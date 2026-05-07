# CI/CD Pipeline Quick Reference

## Project Files Structure

```
.github/
└── workflows/
    └── build-and-push.yml          # GitHub Actions CI pipeline

k8s/
├── dev-backend.yaml               # Dev backend deployment
├── dev-frontend.yaml              # Dev frontend deployment
└── dev-infrastructure.yaml        # Dev postgres + redis + celery

argocd/
└── applications.yaml              # ArgoCD applications (all environments)

kargo/
└── kargo-promotion.yaml           # Kargo promotion pipeline

DEPLOYMENT.md                       # Complete deployment guide
```

## Pipeline Flow

```
1. Developer pushes code to GitHub
   ↓
2. GitHub Actions triggered
   ├─ Build backend Docker image
   ├─ Build frontend Docker image
   ├─ Security scan with Trivy
   ├─ Push to ECR
   └─ Update GitOps repo manifests
   ↓
3. ArgoCD detects changes
   ├─ Dev: Auto-sync (immediate)
   ├─ Staging: Manual approval
   └─ Production: Manual approval
   ↓
4. Kargo promotes images between stages
   ├─ Warehouse detects new ECR images
   ├─ Auto-promotes to dev
   ├─ Waits for manual approval for staging
   └─ Waits for manual approval for production
   ↓
5. EKS clusters update with new images
   ├─ Pods spin up with new version
   ├─ Old pods gracefully terminate
   ├─ Health checks verify deployment
   └─ Rollback available if needed
```

## Critical Commands

### GitHub Actions
```bash
# Monitor builds
# GitHub UI: Actions tab → build-and-push workflow

# Manually trigger workflow
git commit --allow-empty -m "Trigger deployment"
git push origin main
```

### ECR Management
```bash
# View images
aws ecr describe-images --repository-name shopcloud-backend

# Push image manually
docker tag shopcloud-backend:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/shopcloud-backend:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/shopcloud-backend:latest
```

### ArgoCD Operations
```bash
# List applications
argocd app list

# Check sync status
argocd app get shopcloud-backend-dev

# Manual sync
argocd app sync shopcloud-backend-dev

# Rollback
argocd app rollback shopcloud-backend-dev 1
```

### Kargo Operations
```bash
# List stages
kubectl get stages -n kargo

# Check freight (image versions)
kubectl get freights -n kargo

# Describe stage details
kubectl describe stage staging -n kargo

# Promote manually (if auto-promote disabled)
kubectl patch freight <freight-id> -n kargo -p '{"status":{"stage":"staging"}}'
```

### Kubernetes Verification
```bash
# Check deployments
kubectl get deployments -n dev
kubectl get deployments -n staging
kubectl get deployments -n production

# View pods
kubectl get pods -n dev -o wide

# Check services
kubectl get svc -n dev

# View logs
kubectl logs -f deployment/backend -n dev

# Describe pod for events
kubectl describe pod <pod-name> -n dev

# Test connectivity
kubectl exec -it <pod-name> -n dev -- curl http://backend-service:8000/health/
```

## Environment Variables Needed

### GitHub Secrets
```
AWS_ACCOUNT_ID          = 123456789012
AWS_REGION              = us-east-1
GITOPS_REPO             = https://github.com/AyanWarsame/ShopCloud-GitOps.git
GITOPS_TOKEN            = ghp_xxxxx
SLACK_WEBHOOK           = https://hooks.slack.com/services/xxx
STRIPE_SECRET_KEY       = sk_live_xxxxx
STRIPE_WEBHOOK_SECRET   = whsec_xxxxx
```

### Kubernetes ConfigMaps/Secrets
```
DJANGO_SETTINGS_MODULE  = config.settings.development
POSTGRES_HOST           = postgres-service
POSTGRES_PORT           = 5432
POSTGRES_DB             = shopcloud_dev
POSTGRES_PASSWORD       = (set in secret)
REDIS_URL               = redis://redis-service:6379/0
CORS_ALLOWED_ORIGINS    = http://frontend-service
```

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| GitHub Actions fails to push to ECR | Verify AWS role trust policy and IAM permissions |
| ArgoCD can't pull images | Create ECR secret in cluster: `kubectl create secret docker-registry ecr-secret ...` |
| Pods stuck in CrashLoopBackOff | Check logs: `kubectl logs <pod>` and events: `kubectl describe pod <pod>` |
| Deployment not syncing | Manually trigger: `argocd app sync <app-name>` |
| Images not promoting in Kargo | Check warehouse detecting images: `kubectl get freights -n kargo` |
| PostgreSQL connection fails | Verify postgres-service is running: `kubectl get svc -n dev` |
| Health checks failing | Implement `/health/` endpoint in applications |

## Rollback Procedures

### Quick Rollback via ArgoCD
```bash
# See previous versions
argocd app history shopcloud-backend-dev

# Rollback to revision 1
argocd app rollback shopcloud-backend-dev 1

# Sync to apply rollback
argocd app sync shopcloud-backend-dev
```

### Quick Rollback via Kubectl
```bash
# See rollout history
kubectl rollout history deployment/backend -n dev

# Undo to previous version
kubectl rollout undo deployment/backend -n dev

# Undo to specific revision
kubectl rollout undo deployment/backend -n dev --to-revision=1
```

## Monitoring Links

| Service | URL |
|---------|-----|
| ArgoCD UI | https://localhost:8080 (after port-forward) |
| Prometheus | http://localhost:9090 (after port-forward) |
| Grafana | http://localhost:3000 (after port-forward) |
| CloudWatch Logs | AWS Console → CloudWatch |
| GitHub Actions | github.com/AyanWarsame/ShopCloud/actions |
| ECR Images | AWS Console → ECR |

## Deployment Checklist

- [ ] AWS account created and configured
- [ ] ECR repositories created (shopcloud-backend, shopcloud-frontend)
- [ ] IAM role created for GitHub Actions
- [ ] GitHub secrets configured
- [ ] 3 EKS clusters created (dev, staging, production)
- [ ] ArgoCD installed on dev cluster
- [ ] Kargo installed and configured
- [ ] GitOps repository created and populated
- [ ] First deployment manual pushed to ECR
- [ ] ArgoCD applications created
- [ ] Kargo stages configured
- [ ] Health checks implemented in applications
- [ ] Monitoring (Prometheus/Grafana) deployed
- [ ] Slack notifications configured
- [ ] Security scanning enabled
- [ ] Network policies implemented
- [ ] RBAC configured
- [ ] Backup strategy implemented

