from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CartViewSet

router = DefaultRouter()

urlpatterns = [
    path('', CartViewSet.as_view({'get': 'list'})),
    path('items/', CartViewSet.as_view({'post': 'add_item'})),
    path('items/<uuid:item_id>/', CartViewSet.as_view({'put': 'update_item', 'delete': 'remove_item'})),
    path('clear/', CartViewSet.as_view({'delete': 'clear'})),
]
