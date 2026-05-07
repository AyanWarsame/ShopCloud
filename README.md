# ShopCloud

ShopCloud is a Django REST API and React storefront for a Phase 1 e-commerce platform.

## 📚 Documentation

### Architecture & Flow
- [Project Flow](PROJECT_FLOW.md) - Complete feature workflows and data flows
- [Architecture](ARCHITECTURE.md) - System components, directory structure, data models
- [Code Flow](CODE_FLOW.md) - Detailed code examples and step-by-step implementations

### Deployment & Infrastructure
- [CI/CD Deployment](DEPLOYMENT.md) - **Complete guide for GitHub Actions → ECR → ArgoCD + Kargo → EKS**
- [CI/CD Quick Reference](CICD_QUICK_REFERENCE.md) - Commands, troubleshooting, checklists

## 🚀 Quick Start (Local Development)

```bash
# Start all services with Docker Compose
docker compose up --build
```

In another terminal, initialize the database:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python load_sample_data.py
```

Open:

- **Frontend**: http://localhost:5173
- **API docs**: http://localhost:8000/api/docs/
- **Django admin**: http://localhost:8000/admin/

## Services

- **Backend**: Django, Django REST Framework, Simple JWT, Celery
- **Frontend**: React 18, Vite, Redux Toolkit, React Query, TailwindCSS
- **Data**: PostgreSQL
- **Queue/cache**: Redis

## 🏗️ Production Deployment Pipeline

```
Code Push → GitHub Actions
  ↓
Build & Push Images to ECR
  ↓
Scan with Trivy (Security)
  ↓
Update GitOps Manifests
  ↓
ArgoCD + Kargo Promotion
  ├─ Dev: Auto-sync
  ├─ Staging: Manual gate
  └─ Production: Manual gate
  ↓
Deploy to 3 EKS Clusters
```

**See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step setup.**

## Useful Commands

```bash
# Backend
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py shell
docker compose exec backend python load_sample_data.py

# Frontend
docker compose exec frontend npm run build
docker compose exec frontend npm run lint
docker compose exec frontend npm run format

# Docker & Logs
docker compose logs -f backend
docker compose logs -f frontend
docker compose ps
```

## Quick Reference

| Component | URL | Purpose |
|-----------|-----|---------|
| Frontend | http://localhost:5173 | React storefront |
| API Schema | http://localhost:8000/api/docs/ | Interactive API documentation |
| Django Admin | http://localhost:8000/admin/ | Admin panel |
| PostgreSQL | localhost:5432 | Database |
| Redis | localhost:6379 | Cache & task queue |

## Credentials

| Service | Username | Password |
|---------|----------|----------|
| Django Admin | Ayan | Ayan1199# |
| Superuser Email | ayan@shopcloud.com | — |

## Project Structure

```
shopcloud-lab/
├── .github/workflows/
│   └── build-and-push.yml              # GitHub Actions CI pipeline
├── k8s/
│   ├── dev-backend.yaml                # Dev backend deployment
│   ├── dev-frontend.yaml               # Dev frontend deployment
│   └── dev-infrastructure.yaml         # Dev database & cache
├── argocd/
│   └── applications.yaml               # ArgoCD applications
├── kargo/
│   └── kargo-promotion.yaml            # Kargo promotion stages
├── shopcloud-backend/                  # Django REST API
│   ├── apps/
│   │   ├── users/                      # Authentication
│   │   ├── products/                   # Product catalog
│   │   ├── cart/                       # Shopping cart
│   │   ├── orders/                     # Order management
│   │   ├── payments/                   # Stripe payments
│   │   └── notifications/              # Email notifications
│   └── config/
├── shopcloud-frontend/                 # React + Vite
│   └── src/
│       ├── pages/                      # Route pages
│       ├── features/                   # Redux slices
│       ├── components/                 # React components
│       └── api/                        # API integration
├── DEPLOYMENT.md                       # CI/CD setup guide
├── CICD_QUICK_REFERENCE.md            # Quick commands & troubleshooting
├── PROJECT_FLOW.md                     # User flows & workflows
├── ARCHITECTURE.md                     # System architecture
└── CODE_FLOW.md                        # Code implementation examples
```

## Key Features

✅ **User Authentication**: JWT-based registration and login  
✅ **Product Catalog**: Browse and search products with filtering  
✅ **Shopping Cart**: Add/remove items, persistent storage  
✅ **Checkout**: Complete order workflow with address management  
✅ **Payments**: Stripe integration for secure payments  
✅ **Background Jobs**: Celery for async notifications  
✅ **API Documentation**: Interactive Swagger/OpenAPI docs  
✅ **State Management**: Redux for frontend state  
✅ **Responsive UI**: TailwindCSS styling  

## API Endpoints

### Authentication
- `POST /api/v1/auth/users/register/` - Register user
- `POST /api/v1/auth/token/` - Login (get JWT)
- `POST /api/v1/auth/token/refresh/` - Refresh token
- `GET /api/v1/auth/users/me/` - Current user

### Products
- `GET /api/v1/products/` - List products
- `GET /api/v1/products/{id}/` - Product details
- `GET /api/v1/products/categories/` - List categories

### Cart
- `GET /api/v1/cart/items/` - Cart items
- `POST /api/v1/cart/items/` - Add to cart
- `PUT /api/v1/cart/items/{id}/` - Update quantity
- `DELETE /api/v1/cart/items/{id}/` - Remove item

### Orders & Payments
- `POST /api/v1/orders/create/` - Create order
- `GET /api/v1/orders/` - Order history
- `POST /api/v1/payments/create_intent/` - Stripe payment

---

## 🔄 Next Steps

1. **Read Project Flow**: [PROJECT_FLOW.md](PROJECT_FLOW.md) - Understand user journeys
2. **Explore Architecture**: [ARCHITECTURE.md](ARCHITECTURE.md) - Component relationships
3. **Learn Implementation**: [CODE_FLOW.md](CODE_FLOW.md) - Code examples
4. **Deploy to Production**: [DEPLOYMENT.md](DEPLOYMENT.md) - GitHub Actions + ECR + ArgoCD + Kargo + EKS

---

## 📖 Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Redux Toolkit, TailwindCSS, Axios |
| **Backend** | Django 5.0, Django REST Framework, Simple JWT |
| **Database** | PostgreSQL 15 |
| **Cache/Queue** | Redis 7, Celery |
| **Payment** | Stripe API |
| **Container** | Docker, Docker Compose |
| **Orchestration** | Kubernetes (EKS), ArgoCD, Kargo |
| **CI/CD** | GitHub Actions |
| **Monitoring** | Prometheus, Grafana, CloudWatch |

---

## 🤝 Contributing

1. Create feature branch from `develop`
2. Commit changes
3. Push to feature branch
4. Open Pull Request
5. GitHub Actions will run tests
6. Merge after approval

---

## 📝 License

[Add your license here]
