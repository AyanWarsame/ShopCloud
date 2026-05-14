variable "identifier"       { type = string }
variable "vpc_id"           { type = string }
variable "vpc_cidr"         { type = string }
variable "subnet_ids"       { type = list(string) }
variable "instance_class"   { type = string  default = "db.t3.micro" }
variable "allocated_storage" { type = number default = 20 }
variable "db_name"          { type = string  default = "shopcloud" }
variable "db_username"      { type = string  default = "shopcloud" }
variable "db_password"      { type = string  sensitive = true }
