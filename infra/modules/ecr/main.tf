resource "aws_ecr_repository" "backend" {
  name                 = "shopcloud-backend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}

resource "aws_ecr_repository" "frontend" {
  name                 = "shopcloud-frontend"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}
