from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings


@shared_task
def send_order_status_email(email, order_id, status):
    subject = f"Order {order_id} is now {status}"
    message = f"Your ShopCloud order {order_id} status changed to {status}."
    return send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=True)
