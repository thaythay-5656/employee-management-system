variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-southeast-2"
}

variable "environment" {
  description = "dev or prod"
  type        = string
  default     = "dev"
}

variable "ami_id" {
  description = "Ubuntu 24.04 LTS AMI ID for ap-southeast-2"
  type        = string
  default     = "ami-0d6560f3176dc9ec0"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "key_pair_name" {
  description = "Name of the EC2 key pair for SSH access"
  type        = string
}

variable "your_ip_cidr" {
  description = "Your IP address in CIDR notation for SSH (e.g. 1.2.3.4/32)"
  type        = string
}

variable "db_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "EMSDB"
}

variable "db_user" {
  description = "PostgreSQL master username"
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "PostgreSQL master password"
  type        = string
  sensitive   = true
}
