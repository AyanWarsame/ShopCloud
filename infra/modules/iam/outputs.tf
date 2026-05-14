output "service_account_role_arn" {
  description = "ARN of the IRSA role created for the service account"
  value       = aws_iam_role.service_account_role.arn
}
