from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework.validators import UniqueValidator
from .models import Address

User = get_user_model()

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'full_name', 'phone', 'street_address', 'city', 'state', 'postal_code', 'country', 'is_default']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    addresses = AddressSerializer(many=True, read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'is_verified', 'addresses', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(
        validators=[UniqueValidator(queryset=User.objects.all(), message='This username is already in use.')]
    )
    email = serializers.EmailField(
        validators=[UniqueValidator(queryset=User.objects.all(), message='This email is already registered.')]
    )
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})

        try:
            validate_password(data['password'])
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': list(error.messages)})

        data['email'] = data['email'].lower()
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
