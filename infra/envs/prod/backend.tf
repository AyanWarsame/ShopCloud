terraform {
  backend "s3" {
    bucket = "shopcloud-terraform-state"
    key    = "shopcloud/prod/terraform.tfstate"
    region = "us-east-1"
  }
}

# Update the bucket name to your real Terraform state bucket before applying.
