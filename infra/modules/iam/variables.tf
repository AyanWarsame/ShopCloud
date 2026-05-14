variable "oidc_provider_url" {
  type        = string
  description = "OIDC issuer URL from the EKS cluster"
}

variable "oidc_provider_arn" {
  type        = string
  description = "ARN of the OIDC provider for the EKS cluster"
}

variable "service_account_namespace" {
  type        = string
  description = "Namespace for the Kubernetes service account"
}

variable "service_account_name" {
  type        = string
  description = "Name of the Kubernetes service account"
}

variable "tags" {
  type        = map(string)
  description = "Tags for IAM resources"
  default     = {}
}
