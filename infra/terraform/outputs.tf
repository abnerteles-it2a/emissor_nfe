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

output "app_runner_service_url" {
  description = "URL padrão HTTPS do App Runner (API)"
  value       = aws_apprunner_service.api.service_url
}

output "amplify_default_domain" {
  description = "Domínio padrão do Amplify (.amplifyapp.com)"
  value       = aws_amplify_app.web.default_domain
}

# --- REGISTROS DNS PARA IONOS (nfe.it2a.com e api.nfe.it2a.com) ---

output "dns_amplify_frontend_verification" {
  description = "Registro de verificação de propriedade do domínio no Amplify para IONOS"
  value       = aws_amplify_domain_association.domain.certificate_verification_dns_record
}

output "dns_app_runner_api_records" {
  description = "Registros de validação SSL e roteamento da API no App Runner para IONOS"
  value       = aws_apprunner_custom_domain_association.api_domain.certificate_validation_records
}

output "dns_app_runner_target" {
  description = "Destino CNAME para api.nfe.it2a.com apontando para o App Runner"
  value       = aws_apprunner_custom_domain_association.api_domain.dns_target
}
