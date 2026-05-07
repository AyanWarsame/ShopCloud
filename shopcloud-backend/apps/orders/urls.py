from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrderViewSet

router = DefaultRouter()
router.register(r'', OrderViewSet, basename='order')

urlpatterns = [
    path('create/', OrderViewSet.as_view({'post': 'create_order'}), name='create-order'),
    path('', include(router.urls)),
]
