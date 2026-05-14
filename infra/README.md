# ShopCloud Infrastructure

This `infra/` layout is designed to support Terraform-managed AWS infrastructure for ShopCloud. It includes reusable modules and environment-specific roots.

## Structure

- `modules/vpc/` - VPC, public/private subnets, NAT gateways
- `modules/eks/` - EKS cluster and managed node group
- `modules/rds/` - PostgreSQL RDS instance
- `modules/elasticache/` - Redis ElastiCache replication group
- `modules/ecr/` - ECR repositories for backend and frontend
- `modules/iam/` - IRSA role for service accounts
- `envs/dev/`, `envs/staging/`, `envs/prod/` - environment-specific module root configs

## How to use

```bash
cd infra/envs/dev
terraform init
terraform apply -auto-approve
```

For staging and prod, run from their respective directories.

## Notes

- The current configs use a local backend for state by default.
- Replace the local backend with an S3 backend in `envs/*/backend.tf` for shared state.
- The GitHub Actions workflow now applies Dev infra before building and pushing images.
