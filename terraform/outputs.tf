output "ec2_public_ip" {
  description = "Public IP of the EC2 app server"
  value       = aws_instance.ems_app.public_ip
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.ems_postgres.endpoint
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for EMS application logs"
  value       = aws_cloudwatch_log_group.ems_app.name
}

output "cloudwatch_dashboard" {
  description = "CloudWatch dashboard name for EMS metrics"
  value       = aws_cloudwatch_dashboard.ems.dashboard_name
}
