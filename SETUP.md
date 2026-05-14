# Complete ShopCloud Deployment Pipeline Setup

This guide walks through the complete setup for the Terraform + GitHub Actions + ArgoCD + Kargo pipeline for ShopCloud.

---

## 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):

| Secret Name | Value | Notes |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Your AWS access key | For Terraform and ECR |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret key | For Terraform and ECR |
| `DB_PASSWORD` | Database password | Strong password for RDS (e.g., `Shopcloud2024!`) |
| `KARGO_API_URL` | URL of Kargo server | e.g., `https://kargo.example.com` |
| `KARGO_API_TOKEN` | Kargo service account token | Generate from Kargo |

---

## 2. Configure Terraform State Bucket

Before running the pipeline, create an S3 bucket for Terraform state:

```bash
aws s3 mb s3://shopcloud-terraform-state --region us-east-1
```

The Terraform configs already reference `shopcloud-terraform-state` in:
- `infra/envs/dev/backend.tf`
- `infra/envs/staging/backend.tf`
- `infra/envs/prod/backend.tf`

---

## 3. Update GitHub Credentials in Files

### For ArgoCD

Edit `argocd/repository-secret.yaml`:
```yaml
stringData:
  password: YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
  username: AyanWarsame
```

### For Kargo

Edit `kargo/namespace.yaml`:
```yaml
stringData:
  token: YOUR_GITHUB_PERSONAL_ACCESS_TOKEN
  username: AyanWarsame
```

Generate a GitHub PAT at: `Settings > Developer settings > Personal access tokens > Tokens (classic)`
- Scopes needed: `repo`, `read:org`

---

## 4. Set up AWS Account and ECR Repositories

The AWS account ID is: `136906334786`

Kargo is already configured to watch:
- `136906334786.dkr.ecr.us-east-1.amazonaws.com/shopcloud-backend`
- `136906334786.dkr.ecr.us-east-1.amazonaws.com/shopcloud-frontend`

---

## 5. Provision Infrastructure with Terraform

```bash
cd infra/envs/dev
terraform init
terraform apply -auto-approve
```

This creates:
- VPC, subnets, NAT gateways
- EKS cluster
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- ECR repositories

Capture the outputs for later use.

---

## 6. Deploy ArgoCD

Follow the complete guide in [argocd/README.md](argocd/README.md):

```bash
# Install ArgoCD
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Create project and repository secret
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/repository-secret.yaml

# Deploy applications
kubectl apply -f argocd/apps/
```

Verify ArgoCD synced all three applications:

```bash
kubectl -n argocd get applications
```

---

## 7. Deploy Kargo

```bash
# Create Kargo namespace and RBAC
kubectl apply -f kargo/namespace.yaml

# Deploy Kargo resources (warehouse, stages, analysis template)
kubectl apply -f kargo/warehouse.yaml
kubectl apply -f kargo/analysis-template.yaml
kubectl apply -f kargo/stages.yaml
```

Verify Kargo resources:

```bash
kubectl -n kargo get warehouse,stages
```

---

## 8. Push to GitHub and Trigger Pipeline

```bash
git add -A
git commit -m "feat: complete Terraform, ArgoCD, and Kargo setup"
git push origin main
```

The GitHub Actions pipeline will:
1. ✅ Apply Terraform (if infra changed)
2. ✅ Build and push backend Docker image to ECR
3. ✅ Build and push frontend Docker image to ECR
4. ✅ Update `shopcloud-manifests/envs/dev/kustomization.yaml` with new image tags
5. ✅ Commit and push the manifest update
6. ✅ Trigger Kargo to promote dev → staging
7. ⏳ Wait for staging health check
8. ✅ Prompt for manual prod approval

---

## 9. Monitor Pipeline Execution

### GitHub Actions
Watch the workflow run: `https://github.com/AyanWarsame/ShopCloud/actions`

### ArgoCD
```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
# Open: https://localhost:8080
```

### Kargo
```bash
kubectl -n kargo get freights
kubectl -n kargo get promotions
```

---

## 10. Promote to Production (Manual)

After staging passes smoke tests, manually promote to prod:

```bash
kargo promote \
  --project kargo \
  --stage prod \
  --freight-from-stage staging
```

Or use the Kargo UI dashboard.

---

## File Structure Reference

```
shopcloud-lab/
├── infra/                              # Terraform IaC
│   ├── modules/{vpc,eks,rds,elasticache,ecr,iam}/
│   └── envs/{dev,staging,prod}/
├── .github/workflows/
│   └── build-and-push.yml              # Full CI/CD pipeline
├── shopcloud-manifests/                # GitOps manifests
│   ├── base/                           # Shared resources
│   └── envs/{dev,staging,prod}/        # Environment overlays
├── argocd/                             # ArgoCD config
│   ├── project.yaml
│   ├── repository-secret.yaml
│   ├── apps/shopcloud-{dev,staging,prod}.yaml
│   └── README.md
├── kargo/                              # Kargo config
│   ├── warehouse.yaml
│   ├── stages.yaml
│   ├── analysis-template.yaml
│   ├── pipeline.yaml                   # Legacy pipeline reference
│   ├── namespace.yaml
│   └── (manifests auto-updated by CI)
└── shopcloud-{backend,frontend}/       # Application code
```

---

## Troubleshooting

### Terraform fails to initialize
```bash
# Verify S3 bucket exists
aws s3 ls s3://shopcloud-terraform-state

# Check AWS credentials
aws sts get-caller-identity
```

### GitHub Actions workflow fails
- Check `Settings > Actions > General > Workflow permissions` is set to `Read and write`
- Verify all secrets are set correctly
- Check GitHub Actions logs

### ArgoCD applications not syncing
- Verify repository secret: `kubectl -n argocd get secret shopcloud-repo`
- Check AppProject allows the destination: `kubectl -n argocd get appproject shopcloud`
- Inspect Application status: `kubectl -n argocd describe app shopcloud-dev`

### Kargo promotions not progressing
- Check Kargo stage status: `kubectl -n kargo describe stage dev`
- Verify warehouse has detected images: `kubectl -n kargo get warehouse shopcloud`
- Check smoke test logs: `kubectl -n kargo logs -f <pod>`

---

## Next Steps

- [ ] Configure DNS/ingress for production traffic
- [ ] Set up Prometheus/Grafana for monitoring
- [ ] Configure backup strategy for RDS
- [ ] Set up CloudWatch logs aggregation
- [ ] Implement Sealed Secrets for sensitive data
- [ ] Add network policies for pod-to-pod communication
