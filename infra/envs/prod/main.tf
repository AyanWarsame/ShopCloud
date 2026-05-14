terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type        = string
  description = "AWS region to deploy resources into"
}

variable "environment" {
  type        = string
  description = "Deployment environment"
}

variable "db_password" {
  type        = string
  sensitive   = true
}

module "vpc" {
  source              = "../modules/vpc"
  vpc_cidr            = "10.2.0.0/16"
  azs                 = ["us-east-1a", "us-east-1b", "us-east-1c"]
  public_subnet_cidrs = ["10.2.0.0/24", "10.2.1.0/24", "10.2.2.0/24"]
  private_subnet_cidrs = ["10.2.10.0/24", "10.2.11.0/24", "10.2.12.0/24"]
  tags = {
    Environment = var.environment
    Project     = "shopcloud"
  }
}

module "eks" {
  source             = "../modules/eks"
  cluster_name       = "shopcloud-${var.environment}"
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  node_instance_type = "t3.large"
  desired_capacity   = 4
  min_size           = 2
  max_size           = 6
  tags = {
    Environment = var.environment
    Project     = "shopcloud"
  }
}

module "ecr" {
  source = "../modules/ecr"
  repositories = {
    backend  = "shopcloud-backend"
    frontend = "shopcloud-frontend"
  }
}

module "rds" {
  source               = "../modules/rds"
  db_username          = "shopcloud"
  db_password          = var.db_password
  instance_class       = "db.t3.medium"
  allocated_storage    = 80
  db_subnet_ids        = module.vpc.private_subnet_ids
  vpc_security_group_ids = []
  tags = {
    Environment = var.environment
    Project     = "shopcloud"
  }
}

module "elasticache" {
  source                   = "../modules/elasticache"
  replication_group_id     = "shopcloud-redis-${var.environment}"
  node_type                = "cache.t3.small"
  num_cache_clusters       = 3
  subnet_ids               = module.vpc.private_subnet_ids
  security_group_ids       = []
  automatic_failover_enabled = true
  tags = {
    Environment = var.environment
    Project     = "shopcloud"
  }
}

output "ecr_backend_url" {
  value = module.ecr.repository_urls["backend"]
}

output "ecr_frontend_url" {
  value = module.ecr.repository_urls["frontend"]
}

output "db_endpoint" {
  value = module.rds.db_endpoint
}

output "redis_primary_endpoint" {
  value = module.elasticache.primary_endpoint_address
}
