from django.contrib import admin
from .models import Order, OrderItem

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'status', 'payment_status', 'total_price', 'created_at']
    list_filter = ['status', 'payment_status', 'created_at']
    search_fields = ['user__email', 'id']

@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'unit_price']
    search_fields = ['order__id', 'product__name']
