from django.contrib import admin
from .models import User, Address

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'role', 'is_verified', 'created_at']
    list_filter = ['role', 'is_verified', 'created_at']
    search_fields = ['email', 'first_name', 'last_name']

@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'city', 'country', 'is_default']
    list_filter = ['city', 'country', 'is_default']
    search_fields = ['full_name', 'street_address']
