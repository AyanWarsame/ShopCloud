#!/usr/bin/env python
import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Product, ProductCategory
from django.utils.text import slugify

User = get_user_model()

# Get or create default category and merchant
category, _ = ProductCategory.objects.get_or_create(
    name='Electronics',
    defaults={'slug': 'electronics', 'description': 'Electronic products'}
)

# Get or create merchant (admin user)
try:
    merchant = User.objects.get(username='Ayan')
except User.DoesNotExist:
    merchant = User.objects.first()
    if not merchant:
        print("No users found. Please create a superuser first.")
        exit(1)

# Create sample products
products_data = [
    {"name": "Laptop", "description": "High performance laptop", "price": "999.99", "stock": 10},
    {"name": "Wireless Headphones", "description": "Premium wireless headphones", "price": "199.99", "stock": 25},
    {"name": "USB-C Cable", "description": "Durable USB-C charging cable", "price": "19.99", "stock": 100},
    {"name": "Phone Screen Protector", "description": "Tempered glass screen protector", "price": "9.99", "stock": 50},
    {"name": "Bluetooth Speaker", "description": "Portable Bluetooth speaker", "price": "79.99", "stock": 15},
]

for product_data in products_data:
    name = product_data['name']
    sku = slugify(name).upper()[:20]
    
    product, created = Product.objects.get_or_create(
        name=name,
        defaults={
            'slug': slugify(name),
            'description': product_data['description'],
            'price': Decimal(product_data['price']),
            'stock_quantity': product_data['stock'],
            'category': category,
            'merchant': merchant,
            'sku': sku,
        }
    )
    
    if created:
        print(f"✓ Created product: {product.name}")
    else:
        print(f"⊙ Product already exists: {product.name}")

print("\n✓ Database initialized with sample data!")
