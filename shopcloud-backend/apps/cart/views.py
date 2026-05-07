from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import F
from .models import Cart, CartItem
from .serializers import CartSerializer

class CartViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def list(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = CartSerializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        if quantity <= 0:
            return Response({'error': 'Quantity must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            item, created = CartItem.objects.get_or_create(
                cart=cart,
                product_id=product_id,
                defaults={'quantity': quantity}
            )
            if not created:
                item.quantity = F('quantity') + quantity
                item.save()
                item.refresh_from_db()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['put'], url_path='items/(?P<item_id>[^/.]+)')
    def update_item(self, request, item_id=None):
        try:
            item = CartItem.objects.get(id=item_id, cart__user=request.user)
            cart = item.cart
            quantity = int(request.data.get('quantity', 1))
            
            if quantity <= 0:
                item.delete()
            else:
                item.quantity = quantity
                item.save()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['delete'], url_path='items/(?P<item_id>[^/.]+)')
    def remove_item(self, request, item_id=None):
        try:
            item = CartItem.objects.get(id=item_id, cart__user=request.user)
            cart = item.cart
            item.delete()
            
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['delete'])
    def clear(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        
        serializer = CartSerializer(cart)
        return Response(serializer.data)
