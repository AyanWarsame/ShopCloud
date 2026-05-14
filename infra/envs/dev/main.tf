terraform {
  required_providers {
    aws = { source = "hashicorp/aws" version = "~> 5.0" }
  }
}

provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source          = "../../modules/vpc"
  name            = "shopcloud-dev"
  cidr            = "10.0.0.0/16"
  azs             = ["us-east-1a", "us-east-1b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.11.0/24", "10.0.12.0/24"]
}

module "eks" {
  source        = "../../modules/eks"
  cluster_name  = "shopcloud-cluster"
  subnet_ids    = module.vpc.private_subnet_ids
  instance_type = "t3.medium"
  desired_size  = 2
  min_size      = 1
  max_size      = 3
}

module "rds" {
  source      = "../../modules/rds"
  identifier  = "shopcloud-dev-db"
  vpc_id      = module.vpc.vpc_id
  vpc_cidr    = "10.0.0.0/16"
  subnet_ids  = module.vpc.private_subnet_ids
  db_password = var.db_password
}

module "elasticache" {
  source     = "../../modules/elasticache"
  cluster_id = "shopcloud-dev-redis"
  vpc_id     = module.vpc.vpc_id
  vpc_cidr   = "10.0.0.0/16"
  subnet_ids = module.vpc.private_subnet_ids
}

module "ecr" {
  source = "../../modules/ecr"
}

variable "db_password" {
  type      = string
  sensitive = true
}

output "eks_cluster_name"     { value = module.eks.cluster_name }
output "eks_cluster_endpoint" { value = module.eks.cluster_endpoint }
output "ecr_backend_url"      { value = module.ecr.backend_url }
output "ecr_frontend_url"     { value = module.ecr.frontend_url }
output "rds_endpoint"         { value = module.rds.endpoint }
output "redis_endpoint"       { value = module.elasticache.primary_endpoint }
