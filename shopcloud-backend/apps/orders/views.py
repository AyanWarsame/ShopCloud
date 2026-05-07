from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from .models import Order, OrderItem
from .serializers import OrderSerializer, OrderCreateSerializer
from apps.cart.models import Cart
from apps.users.models import Address

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)
    
    @transaction.atomic
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get user's cart
            cart = Cart.objects.get(user=request.user)
            if not cart.items.exists():
                return Response(
                    {'error': 'Cart is empty'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get shipping address
            address = Address.objects.get(
                id=serializer.validated_data['shipping_address_id'],
                user=request.user
            )
            
            # Calculate total
            total_price = sum(float(item.product.price * item.quantity) for item in cart.items.all())
            
            # Create order
            order = Order.objects.create(
                user=request.user,
                shipping_address=address,
                total_price=total_price,
                notes=serializer.validated_data.get('notes', '')
            )
            
            # Create order items and update stock
            for cart_item in cart.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=cart_item.product,
                    quantity=cart_item.quantity,
                    unit_price=cart_item.product.price
                )
                
                # Deduct from stock
                cart_item.product.stock_quantity -= cart_item.quantity
                cart_item.product.save()
            
            # Clear cart
            cart.items.all().delete()
            
            order_serializer = OrderSerializer(order)
            return Response(order_serializer.data, status=status.HTTP_201_CREATED)
            
        except Address.DoesNotExist:
            return Response(
                {'error': 'Address not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status == 'cancelled':
            return Response(
                {'error': 'Order is already cancelled'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        order.status = 'cancelled'
        order.save()
        
        serializer = self.get_serializer(order)
        return Response(serializer.data)
