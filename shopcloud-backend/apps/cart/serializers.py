from rest_framework import serializers
from .models import Cart, CartItem
from apps.products.serializers import ProductListSerializer

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.UUIDField(write_only=True)
    total_price = serializers.SerializerMethodField()
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'total_price']
    
    def get_total_price(self, obj):
        return float(obj.product.price * obj.quantity)


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    total_items = serializers.SerializerMethodField()
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total_price', 'total_items', 'updated_at']
    
    def get_total_price(self, obj):
        return sum(float(item.product.price * item.quantity) for item in obj.items.all())
    
    def get_total_items(self, obj):
        return obj.items.count()
