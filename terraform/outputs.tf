output "ec2_public_ip" {
  description = "Public IP of the EC2 app server"
  value       = aws_instance.ems_app.public_ip
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.ems_postgres.endpoint
}
