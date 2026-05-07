import stripe
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import Payment
from .serializers import PaymentSerializer
from apps.orders.models import Order

stripe.api_key = settings.STRIPE_SECRET_KEY

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Payment.objects.all()
        return Payment.objects.filter(order__user=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_intent(self, request):
        order_id = request.data.get('order_id')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
            
            # Create payment record
            payment, created = Payment.objects.get_or_create(
                order=order,
                defaults={'amount': order.total_price}
            )
            
            # Create Stripe payment intent
            intent = stripe.PaymentIntent.create(
                amount=int(float(order.total_price) * 100),
                currency='usd',
                metadata={'order_id': str(order.id)}
            )
            
            payment.stripe_payment_intent_id = intent.id
            payment.save()
            
            serializer = self.get_serializer(payment)
            return Response({
                **serializer.data,
                'client_secret': intent.client_secret
            })
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='status/(?P<order_id>[^/.]+)')
    def payment_status(self, request, order_id=None):
        try:
            payment = Payment.objects.get(order_id=order_id, order__user=request.user)
            serializer = self.get_serializer(payment)
            return Response(serializer.data)
        except Payment.DoesNotExist:
            return Response({'error': 'Payment not found'}, status=status.HTTP_404_NOT_FOUND)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return Response({'error': 'Invalid payload'}, status=status.HTTP_400_BAD_REQUEST)
    except stripe.error.SignatureVerificationError:
        return Response({'error': 'Invalid signature'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle payment_intent.succeeded event
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        order_id = intent['metadata']['order_id']
        
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
            payment.status = 'completed'
            payment.save()
            
            order = payment.order
            order.payment_status = 'completed'
            order.status = 'confirmed'
            order.save()
        except Payment.DoesNotExist:
            pass
    
    # Handle payment_intent.payment_failed event
    elif event['type'] == 'payment_intent.payment_failed':
        intent = event['data']['object']
        
        try:
            payment = Payment.objects.get(stripe_payment_intent_id=intent['id'])
            payment.status = 'failed'
            payment.save()
            
            order = payment.order
            order.payment_status = 'failed'
            order.save()
        except Payment.DoesNotExist:
            pass
    
    return Response({'status': 'received'})
