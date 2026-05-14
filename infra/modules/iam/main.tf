variable "oidc_provider_url" {
  type        = string
  description = "OIDC issuer URL from the EKS cluster"
}

variable "oidc_provider_arn" {
  type        = string
  description = "ARN of the OIDC provider created for the EKS cluster"
}

variable "service_account_namespace" {
  type        = string
  description = "Kubernetes namespace for the service account"
}

variable "service_account_name" {
  type        = string
  description = "Kubernetes service account name"
}

variable "tags" {
  type        = map(string)
  description = "Tags to apply to IAM resources"
  default     = {}
}

data "aws_iam_policy_document" "service_account_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Federated"
      identifiers = [var.oidc_provider_arn]
    }

    actions = ["sts:AssumeRoleWithWebIdentity"]

    condition {
      test     = "StringEquals"
      variable = "${replace(var.oidc_provider_url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${var.service_account_namespace}:${var.service_account_name}"]
    }
  }
}

resource "aws_iam_role" "service_account_role" {
  name               = "shopcloud-${var.service_account_name}-irsa-role"
  assume_role_policy = data.aws_iam_policy_document.service_account_assume_role.json
  tags               = merge({ Name = "shopcloud-${var.service_account_name}-irsa-role" }, var.tags)
}

resource "aws_iam_role_policy" "service_account_policy" {
  name = "shopcloud-${var.service_account_name}-policy"
  role = aws_iam_role.service_account_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = "*"
      },
      {
        Effect   = "Allow"
        Action   = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = "*"
      }
    ]
  })
}

output "service_account_role_arn" {
  value = aws_iam_role.service_account_role.arn
}
