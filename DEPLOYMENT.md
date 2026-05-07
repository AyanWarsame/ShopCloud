# ShopCloud CI/CD Deployment Guide

Complete end-to-end setup for GitHub Actions → ECR → ArgoCD + Kargo → EKS (Dev/Staging/Prod)

## Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│              GitHub Actions (CI)                      │
│  1. Build Docker images (Backend & Frontend)         │
│  2. Push to ECR (Elastic Container Registry)         │
│  3. Scan images with Trivy (security)                │
│  4. Update GitOps manifests                          │
└─────────────────────┬────────────────────────────────┘
                      │ Git commit to GitOps repo
┌─────────────────────▼────────────────────────────────┐
│         ArgoCD + Kargo (CD - Continuous Delivery)    │
│  ┌─ Warehouse: Monitors ECR for new images          │
│  ├─ Dev Stage: Auto-sync (immediate promotion)      │
│  ├─ Staging Stage: Manual promotion (gate)          │
│  └─ Production Stage: Manual promotion (gate)       │
└──────┬──────┬──────────────────────┬───────────────┘
       │      │                      │
┌──────▼──────▼────────────────────┬─▼────────────┐
│    Three EKS Clusters (us-east-1) with Rancher  │
├─────────────────────────────────────────────────┤
│  Dev Cluster          Staging Cluster  Prod     │
│  ├─ dev namespace     ├─ staging NS    Cluster  │
│  └─ Auto-scale        └─ Manual sync   ├─ prod  │
│     (1-3 replicas)       (1-5 replicas) NS     │
│                                        └─ Manual│
│                                           only  │
└─────────────────────────────────────────────────┘
```

---

## Prerequisites

### AWS Setup
- AWS Account with ECR, EKS, and IAM access
- 3 EKS Clusters (dev, staging, production)
- Rancher installed (optional, for cluster management)

### Local Tools
```bash
# Install required CLI tools
brew install awscli kubectl argocd kargo

# Or using apt (Linux)
sudo apt-get install awscli kubectl

# Manual installation of argocd and kargo
# Follow: https://argo-cd.readthedocs.io/en/stable/getting_started/
# Follow: https://kargo.akuity.io/install/
```

### GitHub Setup
- GitHub repository with Actions enabled
- GitHub secrets configured
- Separate GitOps repository for manifests

---

## Step 1: Create AWS IAM Role for GitHub Actions

### Create ECR Repository
```bash
# Create ECR repositories
aws ecr create-repository \
  --repository-name shopcloud-backend \
  --region us-east-1

aws ecr create-repository \
  --repository-name shopcloud-frontend \
  --region us-east-1
```

### Create IAM Role for GitHub
```bash
# Create trust policy file
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:AyanWarsame/ShopCloud:*"
        }
      }
    }
  ]
}
EOF

# Replace ACCOUNT_ID with your AWS account ID
sed -i 's/ACCOUNT_ID/123456789012/g' trust-policy.json

# Create the role
aws iam create-role \
  --role-name github-actions-ecr-role \
  --assume-role-policy-document file://trust-policy.json
```

### Create Policy for ECR Push
```bash
cat > ecr-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:GetRepositoryPolicy",
        "ecr:DescribeRepositories",
        "ecr:ListImages",
        "ecr:DescribeImages",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "arn:aws:ecr:us-east-1:ACCOUNT_ID:repository/shopcloud-*"
    }
  ]
}
EOF

sed -i 's/ACCOUNT_ID/123456789012/g' ecr-policy.json

# Attach policy to role
aws iam put-role-policy \
  --role-name github-actions-ecr-role \
  --policy-name ecr-push-policy \
  --policy-document file://ecr-policy.json
```

---

## Step 2: Configure GitHub Secrets

Add these secrets to GitHub repository settings (`Settings > Secrets and variables > Actions`):

```bash
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1

# GitOps Repository (for manifest updates)
GITOPS_REPO=https://github.com/AyanWarsame/ShopCloud-GitOps.git
GITOPS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Personal access token

# Slack notifications (optional)
SLACK_WEBHOOK=https://hooks.slack.com/services/xxx/yyy/zzz

# Stripe (production)
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Step 3: Create GitOps Repository

Create a separate repository for Kubernetes manifests:

```bash
mkdir ShopCloud-GitOps
cd ShopCloud-GitOps
git init

# Create directory structure
mkdir -p argocd/{dev,staging,production}/{backend,frontend}

# Copy manifests from this repository
cp -r ./k8s/* ./argocd/
cp -r ./kargo/* ./

git add .
git commit -m "Initial GitOps repository structure"
git push -u origin main
```

### GitOps Repository Structure
```
ShopCloud-GitOps/
├── argocd/
│   ├── dev/
│   │   ├── backend/
│   │   │   └── deployment.yaml
│   │   └── frontend/
│   │       └── deployment.yaml
│   ├── staging/
│   │   ├── backend/
│   │   │   └── deployment.yaml
│   │   └── frontend/
│   │       └── deployment.yaml
│   └── production/
│       ├── backend/
│       │   └── deployment.yaml
│       └── frontend/
│           └── deployment.yaml
├── kargo/
│   ├── kargo-promotion.yaml
│   └── stages.yaml
└── README.md
```

---

## Step 4: Install ArgoCD on EKS

### On Dev Cluster
```bash
# Set kubectl context to dev cluster
kubectl config use-context dev-cluster

# Create argocd namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

# Port forward to access UI (optional)
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Access: https://localhost:8080
```

### Register Additional Clusters
```bash
# Add staging cluster
argocd cluster add staging-cluster --name staging --kubeconfig ~/.kube/staging-config

# Add production cluster
argocd cluster add production-cluster --name production --kubeconfig ~/.kube/production-config
```

### Deploy ArgoCD Applications
```bash
# Deploy from this repository
kubectl apply -f ./argocd/applications.yaml -n argocd
```

---

## Step 5: Install Kargo for Promotion

### Install Kargo on Dev Cluster
```bash
# Create kargo namespace
kubectl create namespace kargo

# Install Kargo (follow official docs: https://kargo.akuity.io/install/)
helm repo add kargo https://charts.kargo.io
helm repo update
helm install kargo kargo/kargo --namespace kargo

# Verify installation
kubectl get pods -n kargo
```

### Apply Kargo Stages
```bash
# Deploy Kargo promotion pipeline
kubectl apply -f ./kargo/kargo-promotion.yaml

# Verify stages created
kubectl get stages -n kargo
```

---

## Step 6: Configure Image Registry Access

### Create ECR Secret in Each Cluster
```bash
# Get ECR login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create Kubernetes secret
kubectl create secret docker-registry ecr-secret \
  --docker-server=123456789012.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n dev

# Repeat for staging and production
kubectl config use-context staging-cluster
kubectl create secret docker-registry ecr-secret \
  --docker-server=123456789012.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n staging

kubectl config use-context production-cluster
kubectl create secret docker-registry ecr-secret \
  --docker-server=123456789012.dkr.ecr.us-east-1.amazonaws.com \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region us-east-1) \
  -n production
```

### Update Deployment Image Pull Secrets
```yaml
# In deployment manifests, add imagePullSecrets:
spec:
  template:
    spec:
      imagePullSecrets:
      - name: ecr-secret
```

---

## Step 7: Testing the Pipeline

### Test 1: Trigger GitHub Actions Build
```bash
# Make a commit to main branch
git commit --allow-empty -m "Trigger CI/CD pipeline"
git push origin main

# Monitor in GitHub Actions tab
# Check ECR for new images
aws ecr describe-images --repository-name shopcloud-backend --region us-east-1
```

### Test 2: Verify ArgoCD Sync
```bash
# Check ArgoCD applications
argocd app list

# Check sync status
kubectl get applications -n argocd

# View ArgoCD UI
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

### Test 3: Promote to Staging
```bash
# View Kargo stages
kubectl get stages -n kargo

# Promote manually (if not auto-promoting)
argocd app create shopcloud-backend-staging \
  --repo https://github.com/AyanWarsame/ShopCloud-GitOps.git \
  --path argocd/staging/backend \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace staging
```

### Test 4: Verify Deployment
```bash
# Check pods in dev
kubectl get pods -n dev

# Check pods in staging
kubectl config use-context staging-cluster
kubectl get pods -n staging

# Check services
kubectl get svc -n staging

# Test connectivity
kubectl run -it --rm debug --image=alpine --restart=Never -- sh
# Inside container: wget http://backend-service:8000/health/
```

---

## Step 8: Production Promotion Process

### Manual Approval Process
```bash
# 1. Review changes in staging
kubectl config use-context staging-cluster
kubectl describe deployment backend -n staging

# 2. Test thoroughly
kubectl run -it --rm test --image=alpine --restart=Never -- sh
# Run smoke tests, manual tests, etc.

# 3. Promote to production
argocd app create shopcloud-backend-prod \
  --repo https://github.com/AyanWarsame/ShopCloud-GitOps.git \
  --path argocd/production/backend \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production

# 4. Sync (requires approval/manual)
argocd app sync shopcloud-backend-prod

# 5. Monitor rollout
kubectl config use-context production-cluster
kubectl rollout status deployment/backend -n production
```

---

## Step 9: Monitoring & Logging

### Set Up Prometheus & Grafana
```bash
# Install Prometheus operator
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace

# Install Grafana dashboards
# Access: http://localhost:3000
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
```

### EKS CloudWatch Integration
```bash
# Enable CloudWatch Container Insights
aws eks update-cluster-config \
  --name dev-cluster \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'

# View logs in CloudWatch Console
```

### Application Health Checks
```bash
# Check backend health
kubectl get endpoint backend-service -n dev

# View pod logs
kubectl logs -f deployment/backend -n dev

# Check events
kubectl get events -n dev --sort-by='.lastTimestamp'
```

---

## Step 10: Rollback Procedures

### Rollback from ArgoCD
```bash
# View revision history
argocd app history shopcloud-backend-dev

# Rollback to previous revision
argocd app rollback shopcloud-backend-dev <revision-number>

# Or via kubectl
kubectl rollout undo deployment/backend -n dev
```

### Rollback from Kargo
```bash
# View Kargo stage history
kubectl describe stage dev -n kargo

# Demote from staging
argocd app sync shopcloud-backend-staging --revision <previous-hash>
```

---

## Security Best Practices

### 1. Image Scanning
```bash
# Trivy scans run automatically in GitHub Actions
# View results in GitHub Security tab

# Manual scan
trivy image 123456789012.dkr.ecr.us-east-1.amazonaws.com/shopcloud-backend:latest
```

### 2. Secret Management
```bash
# Use AWS Secrets Manager instead of hardcoding
aws secretsmanager create-secret \
  --name shopcloud/stripe-key \
  --secret-string sk_live_xxxxx

# Reference in pods via ExternalSecrets operator
```

### 3. Network Policies
```bash
# Implement Kubernetes network policies
kubectl apply -f - << 'EOF'
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: backend-policy
  namespace: dev
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 8000
EOF
```

### 4. RBAC Configuration
```bash
# Limit GitHub Actions permissions
# Create narrow IAM role, not full admin

# Limit ArgoCD/Kargo permissions
# Use RBAC and restricted service accounts
```

---

## Troubleshooting

### GitHub Actions Failures
```bash
# Check workflow logs
# GitHub UI: Actions tab → Workflow run

# Common issues:
# 1. AWS credentials not configured
#    - Verify OIDC role setup
#    - Check AWS_ACCOUNT_ID secret

# 2. ECR push fails
#    - Check ECR repository exists
#    - Verify IAM permissions

# 3. GitOps repo update fails
#    - Verify GITOPS_TOKEN is valid
#    - Check GITOPS_REPO URL
```

### ArgoCD Sync Failures
```bash
# View application status
kubectl get applications -n argocd -o wide

# Describe application for errors
kubectl describe application shopcloud-backend-dev -n argocd

# View ArgoCD logs
kubectl logs -f deployment/argocd-application-controller -n argocd
```

### Kargo Promotion Failures
```bash
# Check Kargo stage status
kubectl describe stage dev -n kargo

# View Kargo logs
kubectl logs -f deployment/kargo-controller-manager -n kargo

# Check if images are being detected
kubectl get freights -n kargo
```

### Pod Deployment Issues
```bash
# Check pod status
kubectl describe pod <pod-name> -n dev

# Check image pull errors
kubectl get events -n dev | grep pull

# Verify image exists in ECR
aws ecr describe-images --repository-name shopcloud-backend
```

---

## Cleanup

### Delete Everything
```bash
# Delete ArgoCD applications
kubectl delete applications -n argocd --all

# Delete Kargo stages
kubectl delete stages -n kargo --all

# Delete EKS clusters
aws eks delete-cluster --name dev-cluster
aws eks delete-cluster --name staging-cluster
aws eks delete-cluster --name production-cluster

# Delete ECR repositories
aws ecr delete-repository --repository-name shopcloud-backend --force
aws ecr delete-repository --repository-name shopcloud-frontend --force
```

---

## Next Steps

1. **Enable Auto-Scaling**: Configure Cluster Autoscaler and HPA
2. **Add Monitoring**: Set up Prometheus/Grafana/DataDog
3. **Implement GitOps**: Set up proper branching strategy (dev → staging → main)
4. **Add Compliance**: SOC 2, security scanning, audit logging
5. **Disaster Recovery**: Set up backup strategies for databases
6. **Cost Optimization**: Right-size instances, use spot instances for dev

