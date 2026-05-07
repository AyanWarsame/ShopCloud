# ShopCloud

ShopCloud is a Django REST API and React storefront for a Phase 1 e-commerce platform.

## Services

- Backend: Django, Django REST Framework, Simple JWT, Celery
- Frontend: React 18, Vite, Redux Toolkit, React Query, TailwindCSS
- Data: PostgreSQL
- Queue/cache: Redis

## Quick Start

```bash
docker compose up --build
```

In another terminal, initialize the database:

```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

Open:

- Frontend: http://localhost:5173
- API docs: http://localhost:8000/api/docs/
- Django admin: http://localhost:8000/admin/

## Useful Commands

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec frontend npm run build
```
# ShopCloud
