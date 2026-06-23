terraform {
  required_version = ">= 1.6"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Store state in S3 (create this bucket manually first)
  backend "s3" {
    bucket = "ems-terraform-state"
    key    = "ems/terraform.tfstate"
    region = "ap-southeast-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# ── VPC ───────────────────────────────────────────────────────────────────────
resource "aws_vpc" "ems_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = { Name = "ems-vpc-${var.environment}" }
}

resource "aws_internet_gateway" "ems_igw" {
  vpc_id = aws_vpc.ems_vpc.id
  tags   = { Name = "ems-igw-${var.environment}" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.ems_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = { Name = "ems-public-subnet-${var.environment}" }
}

resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.ems_vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "${var.aws_region}b"
  tags              = { Name = "ems-private-subnet-${var.environment}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.ems_vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ems_igw.id
  }
  tags = { Name = "ems-public-rt-${var.environment}" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.ems_vpc.id
  tags   = { Name = "ems-private-rt-${var.environment}" }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

# ── Security Groups ───────────────────────────────────────────────────────────
resource "aws_security_group" "app_sg" {
  name        = "ems-app-sg-${var.environment}"
  description = "Allow HTTP, HTTPS, and app ports"
  vpc_id      = aws_vpc.ems_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 8000
    to_port     = 8000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_cidr]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "ems-app-sg-${var.environment}" }
}

resource "aws_security_group" "rds_sg" {
  name        = "ems-rds-sg-${var.environment}"
  description = "Allow PostgreSQL from app only"
  vpc_id      = aws_vpc.ems_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app_sg.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "ems-rds-sg-${var.environment}" }
}

# ── EC2 Instance ──────────────────────────────────────────────────────────────
resource "aws_instance" "ems_app" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  subnet_id              = aws_subnet.public.id
  vpc_security_group_ids = [aws_security_group.app_sg.id]
  key_name               = var.key_pair_name

  user_data = <<-EOF
    #!/bin/bash
    apt-get update -y
    apt-get install -y docker.io docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    usermod -aG docker ubuntu
    mkdir -p /opt/ems
  EOF

  tags = { Name = "ems-app-${var.environment}" }
}

# CloudWatch Logs for application and deployment logs.
resource "aws_cloudwatch_log_group" "ems_app" {
  name              = "/ems/${var.environment}/app"
  retention_in_days = 14

  tags = {
    Name        = "ems-app-logs-${var.environment}"
    Environment = var.environment
  }
}

# CloudWatch alarm for high EC2 CPU usage.
resource "aws_cloudwatch_metric_alarm" "ems_high_cpu" {
  alarm_name          = "ems-${var.environment}-high-cpu"
  alarm_description   = "Alerts when EMS EC2 CPU stays above 80 percent."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  treat_missing_data  = "notBreaching"

  dimensions = {
    InstanceId = aws_instance.ems_app.id
  }

  tags = {
    Name        = "ems-high-cpu-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_cloudwatch_dashboard" "ems" {
  dashboard_name = "ems-${var.environment}-overview"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "EMS EC2 CPU Utilization"
          region  = var.aws_region
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/EC2", "CPUUtilization", "InstanceId", aws_instance.ems_app.id]
          ]
          period = 300
          stat   = "Average"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title   = "EMS RDS Free Storage"
          region  = var.aws_region
          view    = "timeSeries"
          stacked = false
          metrics = [
            ["AWS/RDS", "FreeStorageSpace", "DBInstanceIdentifier", aws_db_instance.ems_postgres.identifier]
          ]
          period = 300
          stat   = "Average"
        }
      }
    ]
  })
}

# ── RDS PostgreSQL ────────────────────────────────────────────────────────────
resource "aws_db_subnet_group" "ems_db_subnet" {
  name       = "ems-db-subnet-${var.environment}"
  subnet_ids = [aws_subnet.private.id]
  tags       = { Name = "ems-db-subnet-${var.environment}" }
}

resource "aws_db_instance" "ems_postgres" {
  identifier             = "ems-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "16"
  instance_class         = "db.t3.micro"
  allocated_storage      = 20
  db_name                = var.db_name
  username               = var.db_user
  password               = var.db_password
  db_subnet_group_name   = aws_db_subnet_group.ems_db_subnet.name
  vpc_security_group_ids = [aws_security_group.rds_sg.id]
  skip_final_snapshot    = true
  publicly_accessible    = false
  tags                   = { Name = "ems-rds-${var.environment}" }
}

# CloudWatch alarm for low RDS free storage.
resource "aws_cloudwatch_metric_alarm" "ems_rds_low_storage" {
  alarm_name          = "ems-${var.environment}-rds-low-storage"
  alarm_description   = "Alerts when EMS RDS free storage falls below 2 GB."
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 2147483648
  treat_missing_data  = "notBreaching"

  dimensions = {
    DBInstanceIdentifier = aws_db_instance.ems_postgres.identifier
  }

  tags = {
    Name        = "ems-rds-low-storage-${var.environment}"
    Environment = var.environment
  }
}
