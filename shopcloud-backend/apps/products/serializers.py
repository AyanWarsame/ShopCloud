from rest_framework import serializers
from .models import Product, ProductCategory, ProductImage, ProductVariant, Review

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'name', 'sku', 'price', 'stock_quantity']


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = Review
        fields = ['id', 'user_email', 'rating', 'title', 'content', 'is_verified_purchase', 'created_at']
        read_only_fields = ['id', 'user_email', 'is_verified_purchase', 'created_at']


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = ['id', 'name', 'slug', 'description', 'image']


class ProductSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_id = serializers.UUIDField(write_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    merchant_email = serializers.CharField(source='merchant.email', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'short_description', 
            'price', 'compare_price', 'sku', 'stock_quantity',
            'category', 'category_id', 'merchant_email', 'is_active',
            'images', 'variants', 'reviews', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'merchant_email', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'short_description', 'price', 
            'compare_price', 'category', 'images', 'is_active'
        ]
