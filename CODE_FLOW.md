# ShopCloud Code Flow Examples

## How Everything Connects - Code Walkthrough

### Example 1: User Registration Flow

#### Step 1: User Submits Registration Form (Frontend)
**File**: `src/pages/RegisterPage.jsx`
```javascript
const submit = async (event) => {
  event.preventDefault()
  setLocalError('')
  
  // Frontend validation
  if (form.password !== form.password_confirm) {
    setLocalError('Passwords do not match')
    return
  }
  
  // Dispatch Redux thunk
  await dispatch(register(form))
  // Form data: { username, email, password, password_confirm }
}
```

#### Step 2: Redux Thunk Calls API (Frontend)
**File**: `src/features/auth/authSlice.js`
```javascript
export const register = createAsyncThunk('auth/register', async (payload, { rejectWithValue }) => {
  try {
    // 1. Send registration request
    const registerResponse = await api.post(endpoints.register, payload)
    // POST /api/v1/auth/users/register/
    // Body: { username, email, password, password_confirm }
    
    // 2. Auto-login with the new credentials
    const tokenResponse = await api.post(endpoints.token, {
      username: payload.username,
      password: payload.password,
    })
    // POST /api/v1/auth/token/
    // Response: { access, refresh }
    
    // 3. Store tokens
    localStorage.setItem('shopcloud_access', tokenResponse.data.access)
    localStorage.setItem('shopcloud_refresh', tokenResponse.data.refresh)
    
    // 4. Fetch user profile
    const profileResponse = await api.get(endpoints.me)
    // GET /api/v1/auth/users/me/
    // Uses Authorization header with token
    
    return { 
      access: tokenResponse.data.access, 
      refresh: tokenResponse.data.refresh,
      user: profileResponse.data 
    }
  } catch (error) {
    return rejectWithValue(error.response?.data || error.message)
  }
})
```

#### Step 3: Backend Receives Registration Request
**File**: `apps/users/views.py`
```python
class UserViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        # Validates: username unique, email unique, passwords match
        
        if serializer.is_valid():
            user = serializer.save()
            # Creates user in database with hashed password
            return Response(
                {'id': user.id, 'email': user.email}, 
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### Step 4: Backend Processes Registration
**File**: `apps/users/serializers.py`
```python
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password_confirm']
    
    def validate(self, data):
        # Check passwords match
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return data
    
    def create(self, validated_data):
        # create_user hashes password
        user = User.objects.create_user(**validated_data)
        return user
```

#### Step 5: Database Saves User
**File**: `apps/users/models.py`
```python
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)  # Must be unique
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='customer')
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

#### Step 6: JWT Tokens Generated
**File**: `config/settings/base.py`
```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

#### Step 7: Redux State Updated
**File**: `src/features/auth/authSlice.js`
```javascript
extraReducers: (builder) => {
    builder
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded'
        state.access = action.payload.access        // Save token
        state.refresh = action.payload.refresh       // Save refresh token
        state.user = action.payload.user             // Save user data
      })
}
```

#### Step 8: User Redirected to Home
**File**: `src/pages/RegisterPage.jsx`
```javascript
useEffect(() => {
  if (status === 'succeeded') {
    navigate('/')  // Redirect to HomePage
  }
}, [status, navigate])
```

---

### Example 2: Browse Products Flow

#### Step 1: HomePage Loads
**File**: `src/pages/HomePage.jsx`
```javascript
export default function HomePage() {
  const dispatch = useDispatch()
  const { products, loading } = useSelector(state => state.products)
  
  useEffect(() => {
    // Fetch products on component mount
    dispatch(loadProducts())
  }, [dispatch])
  
  return (
    <div>
      {loading ? <Spinner /> : products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}
```

#### Step 2: API Request to Backend
**File**: `src/api/endpoints.js`
```javascript
export const endpoints = {
  products: '/api/v1/products/',
  // GET /api/v1/products/ returns:
  // {
  //   "count": 5,
  //   "next": null,
  //   "previous": null,
  //   "results": [
  //     {
  //       "id": "uuid",
  //       "name": "Laptop",
  //       "price": "999.99",
  //       "description": "High performance laptop",
  //       "stock_quantity": 10,
  //       "images": [...],
  //       "category": {...}
  //     }
  //   ]
  // }
}
```

#### Step 3: Backend Returns Products
**File**: `apps/products/views.py`
```python
class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]  # Anyone can view products
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['price', 'created_at']
    
    def get_queryset(self):
        # Filter active products
        return Product.objects.filter(is_active=True)
```

#### Step 4: Serialize Data
**File**: `apps/products/serializers.py`
```python
class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price',
            'compare_price', 'stock_quantity', 'category',
            'images', 'is_active', 'created_at'
        ]
```

#### Step 5: Frontend Displays Products
**File**: `src/components/ProductCard.jsx`
```javascript
export function ProductCard({ product }) {
  const navigate = useNavigate()
  
  return (
    <div onClick={() => navigate(`/products/${product.id}`)}>
      <img src={product.images[0]?.image} alt={product.name} />
      <h3>{product.name}</h3>
      <p>${product.price}</p>
      <button onClick={() => handleAddToCart(product)}>
        Add to Cart
      </button>
    </div>
  )
}
```

---

### Example 3: Add to Cart Flow

#### Step 1: User Clicks "Add to Cart"
**File**: `src/pages/ProductPage.jsx`
```javascript
const handleAddToCart = async () => {
  const result = await dispatch(addToCart({
    product_id: product.id,
    quantity: 1
  }))
  
  if (result.meta.requestStatus === 'fulfilled') {
    showNotification('Added to cart!')
  }
}
```

#### Step 2: Redux Thunk Makes API Call
**File**: `src/features/cart/cartSlice.js`
```javascript
export const addToCart = createAsyncThunk('cart/addToCart', async (payload) => {
  // payload: { product_id, quantity }
  const response = await api.post(endpoints.cartItems, payload)
  // POST /api/v1/cart/items/
  // Headers: { Authorization: Bearer <token> }
  return response.data
})
```

#### Step 3: Backend Creates Cart Item
**File**: `apps/cart/views.py`
```python
class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)
    
    def perform_create(self, serializer):
        # Get or create cart for current user
        cart, created = Cart.objects.get_or_create(
            user=self.request.user
        )
        serializer.save(cart=cart)
```

#### Step 4: Update Redux Cart State
**File**: `src/features/cart/cartSlice.js`
```javascript
extraReducers: (builder) => {
    builder.addCase(addToCart.fulfilled, (state, action) => {
        state.items.push(action.payload)
        state.count += 1
        // Update total price, etc.
    })
}
```

#### Step 5: Frontend Updates Header
**File**: `src/components/layout/Header.jsx`
```javascript
const Header = () => {
  const { count } = useSelector(state => state.cart)
  
  return (
    <header>
      {/* ... */}
      <Link to="/cart">
        Cart <span className="badge">{count}</span>
      </Link>
    </header>
  )
}
```

---

### Example 4: Complete Order & Payment Flow

#### Step 1: User Submits Checkout
**File**: `src/pages/CheckoutPage.jsx`
```javascript
const handleCheckout = async () => {
  // 1. Create order
  const orderResponse = await api.post(endpoints.createOrder, {
    shipping_address: selectedAddress,
    items: cartItems.map(i => ({
      product_id: i.product.id,
      quantity: i.quantity,
      price: i.product.price
    }))
  })
  // POST /api/v1/orders/create/
  const order = orderResponse.data
  
  // 2. Create payment intent
  const paymentResponse = await api.post(
    endpoints.createPaymentIntent,
    { order_id: order.id }
  )
  // POST /api/v1/payments/create_intent/
  
  // 3. Redirect to Stripe
  window.location.href = paymentResponse.data.checkout_url
}
```

#### Step 2: Backend Creates Order
**File**: `apps/orders/views.py`
```python
@action(detail=False, methods=['post'])
def create(self, request):
    serializer = OrderCreateSerializer(
        data=request.data,
        context={'request': request}
    )
    
    if serializer.is_valid():
        order = serializer.save()
        # Order created with status="pending"
        
        # Clear user's cart
        Cart.objects.filter(user=request.user).delete()
        
        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
```

#### Step 3: Create Payment Intent
**File**: `apps/payments/views.py`
```python
@action(detail=False, methods=['post'])
def create_intent(self, request):
    order_id = request.data.get('order_id')
    order = Order.objects.get(id=order_id)
    
    # Call Stripe API
    intent = stripe.PaymentIntent.create(
        amount=int(order.total * 100),  # Convert to cents
        currency='usd',
        metadata={'order_id': str(order_id)}
    )
    
    # Save payment record
    Payment.objects.create(
        order=order,
        stripe_payment_intent_id=intent.id,
        amount=order.total,
        status='pending'
    )
    
    return Response({
        'client_secret': intent.client_secret,
        'payment_intent_id': intent.id
    })
```

#### Step 4: User Completes Payment on Stripe
(User enters card details on Stripe hosted page)

#### Step 5: Stripe Webhook Notifies Backend
**File**: `apps/payments/views.py`
```python
@action(detail=False, methods=['post'])
def webhook(self, request):
    event = request.data
    
    if event['type'] == 'payment_intent.succeeded':
        payment_intent = event['data']['object']
        
        # Get payment from database
        payment = Payment.objects.get(
            stripe_payment_intent_id=payment_intent['id']
        )
        
        # Update payment and order status
        payment.status = 'succeeded'
        payment.save()
        
        order = payment.order
        order.status = 'paid'
        order.payment_status = 'completed'
        order.save()
        
        # Queue background task to send confirmation email
        send_order_confirmation.delay(order.id)
        
        return Response({'received': True})
```

#### Step 6: Background Job Sends Email
**File**: `apps/notifications/tasks.py`
```python
@shared_task
def send_order_confirmation(order_id):
    from django.core.mail import send_mail
    
    order = Order.objects.get(id=order_id)
    user = order.user
    
    # Compose email
    subject = f'Order Confirmation #{order.id}'
    message = f"""
    Hi {user.first_name},
    
    Your order has been confirmed and payment received.
    Order ID: {order.id}
    Total: ${order.total}
    
    Items: {', '.join([item.product.name for item in order.items.all()])}
    
    Thank you for your purchase!
    """
    
    send_mail(subject, message, 'noreply@shopcloud.com', [user.email])
```

#### Step 7: User Sees Order in OrdersPage
**File**: `src/pages/OrdersPage.jsx`
```javascript
export default function OrdersPage() {
  const { orders } = useSelector(state => state.orders)
  
  useEffect(() => {
    dispatch(loadOrders())
    // GET /api/v1/orders/
  }, [dispatch])
  
  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          <h3>Order #{order.id}</h3>
          <p>Status: {order.status}</p>
          <p>Total: ${order.total}</p>
          <p>Date: {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  )
}
```

---

## Key Data Transformations

### API Request Headers
```javascript
// All authenticated requests include:
{
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIs...',
  'Content-Type': 'application/json'
}
```

### Sample API Responses

#### Get Products Response
```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": "uuid-string",
      "name": "Laptop",
      "slug": "laptop",
      "price": "999.99",
      "stock_quantity": 10,
      "category": {
        "id": "uuid",
        "name": "Electronics"
      },
      "images": [
        {
          "id": "uuid",
          "image": "https://..."
        }
      ]
    }
  ]
}
```

#### Create Order Response
```json
{
  "id": "order-uuid",
  "status": "pending",
  "user": "user-uuid",
  "items": [
    {
      "id": "item-uuid",
      "product": "product-uuid",
      "quantity": 2,
      "price": "99.99"
    }
  ],
  "subtotal": "199.98",
  "tax": "19.99",
  "shipping_cost": "10.00",
  "total": "229.97",
  "created_at": "2026-05-07T10:46:39.251380Z"
}
```

#### Login Response
```json
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## Common Error Scenarios

### Registration Error
```javascript
// Frontend sends:
POST /api/v1/auth/users/register/
{ "username": "john", "email": "john@example.com", "password": "pass123" }

// Backend responds with 400:
{
  "password": ["Ensure this field has at least 8 characters."],
  "password_confirm": ["This field is required."]
}

// Frontend displays: "password: Ensure this field has at least 8 characters."
```

### Unauthorized Error
```javascript
// Request without token:
GET /api/v1/cart/items/

// Backend responds with 401:
{
  "detail": "Authentication credentials were not provided."
}

// Frontend redirects to login
```

### Stripe Payment Error
```python
# If payment intent creation fails:
try:
    intent = stripe.PaymentIntent.create(...)
except stripe.error.CardError as e:
    return Response(
        {'error': str(e)},
        status=status.HTTP_400_BAD_REQUEST
    )
```

---

## Redux Action Dispatch Flow

### Complete Redux Dispatch Example
```javascript
// User clicks Add to Cart
dispatch(addToCart({ product_id: 'uuid', quantity: 1 }))
  ↓
// Redux thunk called with payload
export const addToCart = createAsyncThunk(
  'cart/addToCart',  // Action type
  async (payload) => {
    const response = await api.post('/api/v1/cart/items/', payload)
    return response.data
  }
)
  ↓
// Pending action dispatched
// state.status = 'loading'
  ↓
// API call completes
  ↓
// Fulfilled action dispatched
// case addToCart.fulfilled: state.items.push(action.payload)
  ↓
// Component re-renders with new state
// Cart badge count updates
```

