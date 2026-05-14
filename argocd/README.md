# ArgoCD Setup for ShopCloud

This directory contains ArgoCD Application manifests and configuration for managing ShopCloud deployments across dev, staging, and prod environments.

## Prerequisites

- Kubernetes cluster (EKS from Terraform)
- `kubectl` configured to access the cluster
- GitHub personal access token with `repo` scope

## Installation Steps

### 1. Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

Wait for all ArgoCD pods to be ready:

```bash
kubectl -n argocd wait --for=condition=available --timeout=300s deployment/argocd-server
```

### 2. Update credentials

Edit `repository-secret.yaml` and replace:
- `REPLACE_WITH_GITHUB_PERSONAL_ACCESS_TOKEN` with your GitHub PAT (must have `repo` scope)

Edit `kargo/namespace.yaml` and replace:
- `REPLACE_WITH_GITHUB_PERSONAL_ACCESS_TOKEN` with the same GitHub PAT

### 3. Create ArgoCD project and repository secret

```bash
kubectl apply -f argocd/project.yaml
kubectl apply -f argocd/repository-secret.yaml
```

This creates:
- `shopcloud` AppProject with access to `shopcloud-*` namespaces
- Repository secret so ArgoCD can pull from the GitHub repo

### 4. Apply ArgoCD Applications

```bash
kubectl apply -f argocd/apps/
```

This creates three Applications:
- `shopcloud-dev` → syncs to `shopcloud-dev` namespace
- `shopcloud-staging` → syncs to `shopcloud-staging` namespace
- `shopcloud-prod` → syncs to `shopcloud-prod` namespace

### 5. Access ArgoCD UI

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:443
```

Then open: `https://localhost:8080`

Default login:
- **username**: `admin`
- **password**: `kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d`

---

## Next: Kargo Setup

After ArgoCD is running, apply Kargo resources:

```bash
kubectl apply -f kargo/namespace.yaml
kubectl apply -f kargo/warehouse.yaml
kubectl apply -f kargo/analysis-template.yaml
kubectl apply -f kargo/stages.yaml
```

---

## File Reference

| File | Purpose |
|------|---------|
| `project.yaml` | AppProject for RBAC + source/dest restrictions |
| `repository-secret.yaml` | GitHub credentials for ArgoCD |
| `apps/shopcloud-dev.yaml` | Application for dev environment |
| `apps/shopcloud-staging.yaml` | Application for staging environment |
| `apps/shopcloud-prod.yaml` | Application for prod environment |

---

## Troubleshooting

**Applications not syncing?**
- Check repository secret: `kubectl -n argocd get secret shopcloud-repo -o yaml`
- Check Application status: `kubectl -n argocd get application shopcloud-dev`
- Check logs: `kubectl -n argocd logs -f deployment/argocd-repo-server`

**Can't reach ArgoCD UI?**
- Ensure port-forward is running
- Check ArgoCD server pod: `kubectl -n argocd get pod -l app.kubernetes.io/name=argocd-server`

---

## GitHub Actions Integration

The GitHub Actions workflow (`.github/workflows/build-and-push.yml`) automatically:
1. Applies Terraform infrastructure
2. Builds and pushes Docker images to ECR
3. Updates `shopcloud-manifests/envs/dev/kustomization.yaml` with new image tags
4. Triggers Kargo promotion pipeline

When you push to `main`, the full pipeline runs automatically.
