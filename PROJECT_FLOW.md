# ShopCloud Project Flow Documentation

## Overview

ShopCloud is a full-stack e-commerce platform with a React frontend and Django REST backend. The system supports user authentication, product browsing, shopping cart management, order creation, and payment processing via Stripe.

---

## 1. Project Architecture

### Technology Stack

**Frontend:**
- React 18 with Vite
- Redux Toolkit for state management
- TailwindCSS for styling
- Axios for API communication
- React Router for navigation

**Backend:**
- Django 5.0 REST Framework
- PostgreSQL for data storage
- Redis for caching and task queue
- Celery for background jobs
- Stripe API for payments
- JWT authentication with Simple JWT

**Infrastructure:**
- Docker & Docker Compose for containerization
- 5 services: Backend, Frontend, PostgreSQL, Redis, Celery Worker

---

## 2. Authentication Flow

### Registration Flow
```
User Submits Registration Form
        ↓
Frontend Validation (password length, match check)
        ↓
POST /api/v1/auth/users/register/
        ↓
Backend Validation (unique username, valid email)
        ↓
User Created in Database
        ↓
Automatic Login (POST /api/v1/auth/token/)
        ↓
JWT Tokens Generated & Stored in localStorage
        ↓
Redirect to Homepage
```

**Key Files:**
- Frontend: `src/pages/RegisterPage.jsx`, `src/features/auth/authSlice.js`
- Backend: `apps/users/views.py`, `apps/users/serializers.py`

### Login Flow
```
User Submits Credentials
        ↓
POST /api/v1/auth/token/
        ↓
Backend Validates Username & Password
        ↓
JWT Tokens Generated (Access + Refresh)
        ↓
Tokens Stored in localStorage & Redux
        ↓
GET /api/v1/auth/users/me/ (Fetch User Profile)
        ↓
Redirect to Homepage
```

**JWT Token Details:**
- **Access Token**: 15 minutes lifetime, used for API requests
- **Refresh Token**: 7 days lifetime, used to get new access tokens
- **Headers**: All API requests include `Authorization: Bearer <access_token>`

---

## 3. Products & Shopping Flow

### Browsing Products
```
User Lands on HomePage
        ↓
Redux dispatches loadProducts()
        ↓
GET /api/v1/products/ (with pagination, filters, search)
        ↓
Products Displayed in Grid
        ↓
User Clicks Product
        ↓
GET /api/v1/products/{id}/
        ↓
Product Details Page Rendered
        ↓
User Can Add to Cart or Go Back
```

**Key Files:**
- Frontend: `src/pages/HomePage.jsx`, `src/pages/ProductPage.jsx`
- Backend: `apps/products/views.py`, `apps/products/models.py`

### Cart Management
```
Add to Cart
    ↓
POST /api/v1/cart/items/
    ├─ Creates cart if doesn't exist
    └─ Adds product with quantity
    ↓
Redux Updates cartSlice
    ↓
Cart Icon Shows Item Count

View Cart
    ↓
GET /api/v1/cart/items/
    ↓
Display All Items with Subtotal
    
Modify Cart
    ├─ Update Quantity: PUT /api/v1/cart/items/{id}/
    ├─ Remove Item: DELETE /api/v1/cart/items/{id}/
    └─ Redux Updates After Each Action
    ↓
Proceed to Checkout
```

**Key Files:**
- Frontend: `src/pages/CartPage.jsx`, `src/features/cart/cartSlice.js`, `src/hooks/useCart.js`
- Backend: `apps/cart/views.py`, `apps/cart/models.py`

---

## 4. Checkout & Order Flow

### Checkout Process
```
User Clicks Checkout
        ↓
CheckoutPage Loaded
        ↓
Step 1: Enter Shipping Address
    ├─ POST /api/v1/auth/addresses/ (Create address)
    └─ Stored in User Profile
        ↓
Step 2: Review Order Summary
    ├─ Display: Items, Quantities, Prices
    ├─ Calculate: Subtotal, Tax, Shipping, Total
    └─ User Confirms Order
        ↓
Step 3: Payment Processing
    ├─ POST /api/v1/orders/create/ (Create Order)
    ├─ Order status: "pending"
    └─ Order stored in database
        ↓
Step 4: Create Payment Intent
    ├─ POST /api/v1/payments/create_intent/
    ├─ Stripe API creates payment intent
    └─ Returns Client Secret
        ↓
Step 5: Redirect to Stripe Checkout
    └─ User completes payment on Stripe
```

**Order States:**
- `pending`: Created, awaiting payment
- `paid`: Payment received
- `shipped`: Order dispatched
- `delivered`: Order completed
- `cancelled`: Order cancelled

**Key Files:**
- Frontend: `src/pages/CheckoutPage.jsx`
- Backend: `apps/orders/views.py`, `apps/payments/views.py`

---

## 5. Payment Processing

### Stripe Integration
```
Create Payment Intent
        ↓
POST /api/v1/payments/create_intent/
        ↓
Backend Calls Stripe API
        ↓
Stripe Creates PaymentIntent
        ↓
Returns: Client Secret + Payment Intent ID
        ↓
Frontend Redirects to Stripe Checkout
        ↓
User Enters Payment Details
        ↓
Stripe Processes Payment
        ↓
Webhook: Stripe Sends payment_intent.succeeded
        ↓
Backend Receives Webhook
        ↓
Validate & Update Order Status to "paid"
        ↓
Trigger Celery Task: send_order_confirmation
        ↓
User Redirected to OrdersPage
```

**Key Files:**
- Backend: `apps/payments/views.py`, `apps/payments/models.py`
- Endpoints: `/api/v1/payments/create_intent/`, `/api/v1/payments/webhook/`

---

## 6. Background Jobs & Notifications

### Celery Task Queue
```
Background Tasks Triggered By:
    ├─ Order Creation → send_order_confirmation
    ├─ Payment Success → process_payment_notification
    ├─ Order Shipped → send_shipment_notification
    └─ User Actions → various notifications

Task Flow:
    ├─ Task Queued in Redis
    ├─ Celery Worker Picks Up Task
    ├─ Execute Task Logic
    └─ Result Stored (success/failure)

Notification Task:
    ├─ Read Task Parameters
    ├─ Compose Email Message
    ├─ Send via Email Service
    └─ Update Notification Status
```

**Key Files:**
- Backend: `apps/notifications/tasks.py`, `config/celery.py`
- Task Examples: Order confirmation, shipment updates, promotional emails

---

## 7. API Endpoints Reference

### Authentication
```
POST   /api/v1/auth/users/register/          - User Registration
POST   /api/v1/auth/token/                   - Login (Get JWT Tokens)
POST   /api/v1/auth/token/refresh/           - Refresh Access Token
GET    /api/v1/auth/users/me/                - Get Current User Profile
PUT    /api/v1/auth/users/update_profile/    - Update Profile
```

### Products
```
GET    /api/v1/products/                     - List Products (paginated, filterable)
GET    /api/v1/products/{id}/                - Get Product Details
GET    /api/v1/products/categories/          - List Categories
GET    /api/v1/products/categories/{id}/     - Get Category Details
```

### Cart
```
GET    /api/v1/cart/items/                   - Get Cart Items
POST   /api/v1/cart/items/                   - Add to Cart
PUT    /api/v1/cart/items/{id}/              - Update Cart Item Quantity
DELETE /api/v1/cart/items/{id}/              - Remove from Cart
POST   /api/v1/cart/clear/                   - Clear All Cart Items
```

### Orders
```
POST   /api/v1/orders/create/                - Create Order
GET    /api/v1/orders/                       - List User's Orders
GET    /api/v1/orders/{id}/                  - Get Order Details
PUT    /api/v1/orders/{id}/                  - Update Order (admin)
```

### Payments
```
POST   /api/v1/payments/create_intent/       - Create Stripe Payment Intent
POST   /api/v1/payments/webhook/             - Stripe Webhook Handler
GET    /api/v1/payments/history/             - Payment History
```

### Addresses
```
GET    /api/v1/auth/addresses/               - List User Addresses
POST   /api/v1/auth/addresses/               - Create Address
PUT    /api/v1/auth/addresses/{id}/          - Update Address
DELETE /api/v1/auth/addresses/{id}/          - Delete Address
```

---

## 8. Data Models

### User
```
├─ id (UUID)
├─ username (unique)
├─ email (unique)
├─ password (hashed)
├─ role (customer/merchant/admin)
├─ is_verified (boolean)
├─ first_name, last_name
├─ created_at, updated_at
└─ Relationships:
   ├─ addresses (has many)
   ├─ orders (has many)
   ├─ carts (has many)
   └─ products (merchant: has many)
```

### Product
```
├─ id (UUID)
├─ name, slug
├─ description, short_description
├─ price, compare_price
├─ sku (unique)
├─ stock_quantity
├─ category_id (FK)
├─ merchant_id (FK)
├─ is_active
├─ created_at, updated_at
└─ Relationships:
   ├─ category (belongs to)
   ├─ merchant (belongs to)
   ├─ images (has many)
   ├─ cart_items (has many)
   └─ order_items (has many)
```

### Order
```
├─ id (UUID)
├─ user_id (FK)
├─ status (pending/paid/shipped/delivered/cancelled)
├─ shipping_address_id (FK)
├─ subtotal, tax, shipping_cost, total
├─ payment_status
├─ tracking_number
├─ created_at, updated_at
└─ Relationships:
   ├─ user (belongs to)
   ├─ items (has many: OrderItems)
   ├─ address (belongs to)
   └─ payment (has many)
```

### Cart
```
├─ id (UUID)
├─ user_id (FK, unique)
├─ created_at, updated_at
└─ Relationships:
   ├─ user (belongs to)
   └─ items (has many: CartItems)
```

---

## 9. State Management (Redux)

### Auth State
```javascript
{
  user: { id, username, email, role, is_verified, created_at },
  access: "JWT_TOKEN",
  refresh: "REFRESH_TOKEN",
  status: "idle" | "loading" | "succeeded" | "failed",
  error: null | "error message"
}
```

### Cart State
```javascript
{
  items: [
    { id, product_id, quantity, price, product_details },
    ...
  ],
  total: 0,
  count: 0,
  status: "idle" | "loading" | "succeeded" | "failed"
}
```

---

## 10. Error Handling

### Frontend Error Handling
```
API Request
    ↓
    └─ Success: Update State, Display Success Message
    └─ Error:
        ├─ 400: Validation Error → Show Field-Specific Messages
        ├─ 401: Unauthorized → Clear Tokens, Redirect to Login
        ├─ 403: Forbidden → Show Permission Denied Message
        ├─ 404: Not Found → Show Not Found Message
        ├─ 500: Server Error → Show Generic Error Message
        └─ Network Error → Show Connection Error Message
```

### Backend Error Handling
```
Request Received
    ↓
Middleware Processing (CORS, Auth, Validation)
    ↓
Endpoint Logic
    ├─ Success: Return 200/201 with Data
    └─ Error:
        ├─ Validation Error → 400 + Field Errors
        ├─ Authentication Failed → 401
        ├─ Permission Denied → 403
        ├─ Resource Not Found → 404
        ├─ Server Error → 500 + Error Details
        └─ DRF Exception Handler → Standard Error Response
```

---

## 11. Key Workflows Summary

### User Registration to First Purchase
1. User registers with unique username/email
2. System auto-logs in user after registration
3. User browses products on homepage
4. User clicks on product to view details
5. User adds product to cart
6. User navigates to cart and reviews items
7. User proceeds to checkout
8. User enters shipping address
9. User creates order
10. System creates Stripe payment intent
11. User completes payment on Stripe
12. Webhook confirms payment
13. Order status updated to "paid"
14. Background job sends order confirmation email
15. User can view order in OrdersPage

### Cart Persistence
- Cart data stored in PostgreSQL
- Cart retrieved on each session
- Redux updates UI immediately
- Backend syncs with database

### Session Management
- JWT tokens stored in localStorage
- Access token attached to all API requests
- Expired access token can be refreshed
- Logout clears tokens and redirects to login

---

## 12. Deployment Checklist

- [ ] Configure Stripe API keys (Secret & Webhook)
- [ ] Set up email service credentials
- [ ] Configure PostgreSQL backup strategy
- [ ] Set up Redis persistence
- [ ] Configure Celery beat for scheduled tasks
- [ ] Set up monitoring and logging
- [ ] Configure S3 for image storage (optional)
- [ ] Enable HTTPS/SSL
- [ ] Set up database migrations automation
- [ ] Configure rate limiting
- [ ] Set up error tracking (Sentry)

---

## 13. Development Commands

### Backend Commands
```bash
# Run migrations
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell

# Run tests
docker compose exec backend python manage.py test

# Load sample data
docker compose exec backend python load_sample_data.py

# Check configuration
docker compose exec backend python manage.py check
```

### Frontend Commands
```bash
# Build for production
docker compose exec frontend npm run build

# Run linter
docker compose exec frontend npm run lint

# Format code
docker compose exec frontend npm run format
```

### Docker Commands
```bash
# Start all services
docker compose up --build

# Stop services
docker compose down

# View logs
docker compose logs -f backend

# Execute command in container
docker compose exec backend bash
```

---

## 14. Troubleshooting

### Registration Error (500)
- Check if username/email already exists
- Ensure passwords match and meet minimum length
- Check backend logs: `docker compose logs backend`

### Payment Failed
- Verify Stripe API keys are configured
- Check payment intent creation in logs
- Ensure webhook is properly configured

### Cart Not Persisting
- Clear browser localStorage
- Check Redis connection
- Verify database integrity

### Celery Tasks Not Running
- Check Redis is running: `docker compose ps`
- View worker logs: `docker compose logs worker`
- Ensure task is properly registered in `tasks.py`

