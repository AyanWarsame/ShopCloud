from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, stripe_webhook

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('webhook/', stripe_webhook, name='stripe-webhook'),
]
