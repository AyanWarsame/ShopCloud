from rest_framework import serializers
from .models import Order, OrderItem
from apps.products.serializers import ProductListSerializer
from apps.users.serializers import AddressSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'unit_price']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    shipping_address = AddressSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'payment_status', 'shipping_address',
            'total_price', 'items', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class OrderCreateSerializer(serializers.Serializer):
    shipping_address_id = serializers.UUIDField()
    notes = serializers.CharField(required=False, allow_blank=True)
