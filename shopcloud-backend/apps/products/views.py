from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, BasePermission, SAFE_METHODS, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, ProductCategory, Review
from .serializers import (
    ProductSerializer, ProductListSerializer, ProductCategorySerializer,
    ReviewSerializer
)


class IsMerchantOrAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return request.user.is_authenticated and request.user.role in ['merchant', 'admin']


class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.all()
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    permission_classes = [IsMerchantOrAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'price']
    search_fields = ['name', 'description', 'sku']
    ordering_fields = ['price', 'created_at', 'name']
    ordering = ['-created_at']
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    def get_queryset(self):
        if self.request.user.is_authenticated and self.request.user.role == 'merchant':
            return Product.objects.filter(merchant=self.request.user)
        return Product.objects.filter(is_active=True)
    
    def perform_create(self, serializer):
        serializer.save(merchant=self.request.user)
    
    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def reviews(self, request, slug=None):
        product = self.get_object()
        reviews = product.reviews.all()
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, slug=None):
        product = self.get_object()
        serializer = ReviewSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product, user=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
