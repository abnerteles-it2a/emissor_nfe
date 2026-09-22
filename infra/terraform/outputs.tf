output "s3_bucket_name" {
  description = "Nome do bucket S3 de documentos fiscais"
  value       = aws_s3_bucket.fiscal_documents.id
}

output "rds_endpoint" {
  description = "Endpoint do banco de dados RDS PostgreSQL"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_database_name" {
  description = "Nome do banco de dados no RDS"
  value       = aws_db_instance.postgres.db_name
}

output "ecr_api_repository_url" {
  description = "URL do repositório ECR para imagem da API"
  value       = aws_ecr_repository.api.repository_url
}

output "ecr_worker_repository_url" {
  description = "URL do repositório ECR para imagem do Worker"
  value       = aws_ecr_repository.worker.repository_url
}

output "amplify_default_domain" {
  description = "Domínio padrão do Amplify (Frontend)"
  value       = aws_amplify_app.web.default_domain
}

output "alb_dns_name" {
  description = "DNS do Application Load Balancer da API (Destino CNAME para api.nfe.it2a.com na IONOS)"
  value       = aws_lb.api.dns_name
}
