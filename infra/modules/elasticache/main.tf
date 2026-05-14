resource "aws_security_group" "redis" {
  name   = "${var.cluster_id}-redis-sg"
  vpc_id = var.vpc_id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.cluster_id}-subnet-group"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_replication_group" "this" {
  replication_group_id = var.cluster_id
  description          = "ShopCloud Redis"
  node_type            = var.node_type
  num_cache_clusters   = var.num_cache_clusters
  port                 = 6379
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.redis.id]
  tags                 = { Name = var.cluster_id }
}
