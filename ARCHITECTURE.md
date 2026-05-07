# ShopCloud Project Structure & Components

## Directory Structure

```
shopcloud-lab/
├── docker-compose.yml          # Container orchestration
├── .env.local                  # Environment variables
├── README.md                   # Getting started
├── PROJECT_FLOW.md             # Detailed flow documentation
│
├── shopcloud-backend/          # Django REST API
│   ├── manage.py
│   ├── Dockerfile
│   ├── requirements/
│   │   ├── base.txt            # Core dependencies
│   │   └── development.txt     # Dev dependencies
│   │
│   ├── config/                 # Project configuration
│   │   ├── settings/
│   │   │   ├── base.py         # Base settings
│   │   │   ├── development.py  # Dev settings
│   │   │   └── production.py   # Production settings
│   │   ├── urls.py             # Main URL routing
│   │   ├── wsgi.py             # WSGI application
│   │   ├── asgi.py             # ASGI application
│   │   └── celery.py           # Celery configuration
│   │
│   └── apps/                   # Django applications
│       ├── users/              # User authentication & profiles
│       │   ├── models.py       # User & Address models
│       │   ├── views.py        # UserViewSet, AddressViewSet
│       │   ├── serializers.py  # User serializers
│       │   ├── urls.py         # User routes
│       │   └── admin.py        # Admin configuration
│       │
│       ├── products/           # Product catalog
│       │   ├── models.py       # Product, Category, Image models
│       │   ├── views.py        # ProductViewSet, CategoryViewSet
│       │   ├── serializers.py  # Product serializers
│       │   ├── urls.py         # Product routes
│       │   └── admin.py        # Admin configuration
│       │
│       ├── cart/               # Shopping cart
│       │   ├── models.py       # Cart, CartItem models
│       │   ├── views.py        # CartViewSet
│       │   ├── serializers.py  # Cart serializers
│       │   ├── urls.py         # Cart routes
│       │   └── admin.py        # Admin configuration
│       │
│       ├── orders/             # Order management
│       │   ├── models.py       # Order, OrderItem models
│       │   ├── views.py        # OrderViewSet
│       │   ├── serializers.py  # Order serializers
│       │   ├── urls.py         # Order routes
│       │   └── admin.py        # Admin configuration
│       │
│       ├── payments/           # Stripe payments
│       │   ├── models.py       # Payment model
│       │   ├── views.py        # Payment creation, webhooks
│       │   ├── serializers.py  # Payment serializers
│       │   ├── urls.py         # Payment routes
│       │   └── admin.py        # Admin configuration
│       │
│       └── notifications/      # Background notifications
│           ├── tasks.py        # Celery tasks
│           ├── models.py       # Notification model
│           └── admin.py        # Admin configuration
│
├── shopcloud-frontend/         # React + Vite
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── postcss.config.js
│   ├── Dockerfile
│   │
│   └── src/
│       ├── main.jsx            # Application entry point
│       ├── App.jsx             # Root component
│       ├── index.css           # Global styles
│       │
│       ├── api/                # API integration
│       │   ├── client.js       # Axios instance with JWT
│       │   └── endpoints.js    # API endpoint constants
│       │
│       ├── app/                # Redux store
│       │   └── store.js        # Redux store setup
│       │
│       ├── features/           # Feature slices (Redux)
│       │   ├── auth/
│       │   │   └── authSlice.js
│       │   │       ├── register thunk
│       │   │       ├── login thunk
│       │   │       ├── loadCurrentUser thunk
│       │   │       └── logout action
│       │   │
│       │   └── cart/
│       │       └── cartSlice.js
│       │           ├── addToCart thunk
│       │           ├── removeFromCart thunk
│       │           ├── updateQuantity thunk
│       │           └── fetchCart thunk
│       │
│       ├── routes/             # Routing configuration
│       │   ├── AppRoutes.jsx   # Route definitions
│       │   └── ProtectedRoute.jsx # Auth guard
│       │
│       ├── pages/              # Page components
│       │   ├── HomePage.jsx    # Products listing
│       │   ├── ProductPage.jsx # Product details
│       │   ├── CartPage.jsx    # Shopping cart
│       │   ├── CheckoutPage.jsx # Checkout process
│       │   ├── OrdersPage.jsx  # Order history
│       │   ├── LoginPage.jsx   # Login form
│       │   ├── RegisterPage.jsx # Registration form
│       │   └── DashboardPage.jsx # User dashboard
│       │
│       ├── components/         # Reusable components
│       │   └── layout/
│       │       ├── Header.jsx  # Navigation header
│       │       ├── Footer.jsx  # Footer
│       │       └── Layout.jsx  # Layout wrapper
│       │
│       ├── hooks/              # Custom React hooks
│       │   └── useCart.js      # Cart management hook
│       │
│       ├── utils/              # Utility functions
│       │   ├── formatters.js
│       │   ├── validators.js
│       │   └── helpers.js
│       │
│       └── styles/             # Stylesheets
│           └── globals.css
```

---

## Component Relationships

### Authentication Flow Components
```
RegisterPage
    ├─ Form inputs
    └─ Dispatches register() thunk → authSlice
        ├─ POST /api/v1/auth/users/register/
        ├─ POST /api/v1/auth/token/
        └─ GET /api/v1/auth/users/me/
        
LoginPage
    ├─ Form inputs
    └─ Dispatches login() thunk → authSlice
        ├─ POST /api/v1/auth/token/
        └─ GET /api/v1/auth/users/me/
```

### Shopping Flow Components
```
HomePage
    ├─ Fetches Products
    └─ ProductCard components
        └─ Links to ProductPage

ProductPage
    ├─ Fetches product details
    ├─ Displays ProductImage
    ├─ Shows description & price
    └─ "Add to Cart" button
        └─ Dispatches addToCart() → cartSlice
            ├─ POST /api/v1/cart/items/
            └─ Updates cart count in Header

CartPage
    ├─ Displays CartItems
    │   ├─ Quantity controls
    │   └─ Remove buttons
    ├─ Shows cart total
    └─ "Checkout" button
        └─ Navigates to CheckoutPage

CheckoutPage
    ├─ Shipping address form
    ├─ Order summary
    ├─ "Confirm Order" button
    │   ├─ POST /api/v1/orders/create/
    │   ├─ POST /api/v1/payments/create_intent/
    │   └─ Redirects to Stripe
    └─ Stripe payment flow

OrdersPage
    ├─ Lists user orders
    ├─ Shows order status
    ├─ Order history
    └─ Order details
```

### Layout Components
```
Header (appears on all pages)
    ├─ Logo (links to home)
    ├─ Navigation menu
    ├─ Cart icon (shows count)
    ├─ User profile menu
    └─ Login/Register links (if logged out)

Footer (appears on all pages)
    ├─ Company info
    ├─ Links
    └─ Social media

Layout (wrapper)
    ├─ Header
    ├─ Main content area
    └─ Footer
```

---

## Backend API Structure

### UserViewSet
- **Route**: `/api/v1/auth/users/`
- **Methods**:
  - `POST /register/` - User registration
  - `GET /me/` - Current user profile
  - `PUT /update_profile/` - Update profile
  - `POST /token/` - Login (from SimpleJWT)
  - `POST /token/refresh/` - Refresh token

### ProductViewSet
- **Route**: `/api/v1/products/`
- **Methods**:
  - `GET /` - List products (paginated, filterable)
  - `GET /{id}/` - Get product details
  - **Filters**: category, price_min, price_max, search

### CartViewSet
- **Route**: `/api/v1/cart/items/`
- **Methods**:
  - `GET /` - Get cart items
  - `POST /` - Add to cart
  - `PUT /{id}/` - Update quantity
  - `DELETE /{id}/` - Remove item
  - `POST /clear/` - Clear cart

### OrderViewSet
- **Route**: `/api/v1/orders/`
- **Methods**:
  - `POST /create/` - Create order from cart
  - `GET /` - List user orders
  - `GET /{id}/` - Order details
  - `PUT /{id}/` - Update order (admin only)

### PaymentViewSet
- **Route**: `/api/v1/payments/`
- **Methods**:
  - `POST /create_intent/` - Create Stripe payment intent
  - `POST /webhook/` - Stripe webhook handler

### AddressViewSet
- **Route**: `/api/v1/auth/addresses/`
- **Methods**:
  - `GET /` - List addresses
  - `POST /` - Create address
  - `PUT /{id}/` - Update address
  - `DELETE /{id}/` - Delete address

---

## Data Flow Diagrams

### Authentication Data Flow
```
User Input (username, email, password)
    ↓ (React form)
RegisterPage.jsx
    ↓ (Redux dispatch)
authSlice.register() thunk
    ↓ (HTTP POST)
Backend: UserViewSet.register()
    ↓ (Validation)
User Model
    ↓ (Save to DB)
PostgreSQL
    ↓ (JWT generation)
Response: {id, email}
    ↓ (Auto-login)
POST /token/ → {access, refresh}
    ↓ (Store tokens)
localStorage & Redux
    ↓ (Redirect)
HomePage
```

### Product Browse Data Flow
```
HomePage Component Mounts
    ↓
GET /api/v1/products/?page=1
    ↓
Backend: ProductViewSet.list()
    ↓
Query Products from DB
    ↓
Serialize with ProductSerializer
    ↓
Response: {results: [...products], count, next, previous}
    ↓
Redux dispatches action to store products
    ↓
Re-render with product cards
    ↓
User clicks product
    ↓
GET /api/v1/products/{id}/
    ↓
Backend: ProductViewSet.retrieve()
    ↓
Response: Full product details
    ↓
ProductPage renders details
```

### Shopping Cart Data Flow
```
User clicks "Add to Cart"
    ↓
Redux dispatches addToCart()
    ↓
POST /api/v1/cart/items/
    ├─ Create Cart if needed
    └─ Create CartItem
    ↓
Backend: CartViewSet.create()
    ↓
Save to CartItem model
    ↓
Response: {id, product, quantity, price}
    ↓
Redux updates cartSlice
    ↓
Header shows updated count
    ↓
Toast notification shows "Added to cart"
```

### Order & Payment Data Flow
```
User submits checkout form
    ↓
POST /api/v1/orders/create/
    ├─ Get cart items
    ├─ Calculate total
    ├─ Create Order + OrderItems
    └─ Clear Cart
    ↓
Backend: OrderViewSet.create()
    ↓
Save Order to DB (status: pending)
    ↓
Response: {order_id, total, items}
    ↓
POST /api/v1/payments/create_intent/
    ├─ Call Stripe API
    └─ Create PaymentIntent
    ↓
Backend: PaymentViewSet.create_intent()
    ↓
Response: {client_secret, payment_intent_id}
    ↓
Frontend redirects to Stripe Checkout
    ↓
User completes payment on Stripe
    ↓
Stripe sends webhook: payment_intent.succeeded
    ↓
Backend: stripe_webhook()
    ├─ Validate webhook signature
    ├─ Verify payment
    ├─ Update Order status to "paid"
    └─ Queue Celery task: send_order_confirmation
    ↓
Celery Worker
    ├─ Compose email
    ├─ Send email notification
    └─ Update notification status
    ↓
User sees order in OrdersPage
```

---

## Key Design Patterns

### Authentication Pattern
- **JWT Tokens**: Stateless authentication
- **Token Storage**: localStorage for persistence
- **Authorization**: Bearer token in HTTP headers
- **Protected Routes**: ProtectedRoute wrapper checks auth state

### State Management Pattern
- **Redux Slices**: Separate slices for auth, cart
- **Async Thunks**: API calls with createAsyncThunk
- **Selectors**: Extract data from Redux state
- **Dispatch**: Actions triggered from components

### API Communication Pattern
- **Axios Instance**: Centralized with JWT interceptor
- **Endpoints Object**: Constants for all API URLs
- **Error Handling**: Catch blocks with user feedback
- **Loading States**: Show loading indicators during async

### Component Patterns
- **Page Components**: Route-level containers
- **Feature Slices**: Organize by feature, not layer
- **Custom Hooks**: Reusable logic (useCart)
- **Layout Wrapper**: Consistent header/footer

---

## Important Files to Modify When Adding Features

| Feature | Files to Modify |
|---------|-----------------|
| New API Endpoint | `views.py`, `serializers.py`, `urls.py`, `models.py` |
| New Page | `pages/`, `routes/AppRoutes.jsx`, `api/endpoints.js` |
| New Redux State | `features/newfeature/newfeatureSlice.js`, `app/store.js` |
| New Component | `components/`, import in parent |
| New Database Field | `models.py`, `serializers.py`, create migration |
| New Background Job | `notifications/tasks.py`, Celery configuration |

---

## Testing Flows

### Manual Testing Checklist
- [ ] Register new user successfully
- [ ] Login with registered user
- [ ] Browse products without error
- [ ] Add product to cart
- [ ] View cart with correct totals
- [ ] Update cart quantity
- [ ] Remove item from cart
- [ ] Proceed to checkout
- [ ] Enter shipping address
- [ ] Create order
- [ ] Complete Stripe payment
- [ ] Verify order appears in OrdersPage
- [ ] Verify order confirmation email sent

