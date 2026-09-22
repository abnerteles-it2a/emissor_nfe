variable "aws_region" {
  type        = string
  description = "Região da AWS para provisionamento"
  default     = "sa-east-1"
}

variable "environment" {
  type        = string
  description = "Ambiente (staging / production)"
  default     = "staging"
}

variable "app_name" {
  type        = string
  description = "Nome base da aplicação"
  default     = "emissor-fiscal"
}

variable "db_username" {
  type        = string
  description = "Usuário do banco de dados PostgreSQL"
  default     = "fiscal_admin"
}

variable "db_password" {
  type        = string
  description = "Senha do banco de dados PostgreSQL"
  sensitive   = true
  default     = "FiscalStagingSecure2026!"
}

variable "github_repository" {
  type        = string
  description = "URL do repositório no GitHub para o Amplify"
  default     = "https://github.com/abnerteles-it2a/emissor_nfe"
}

variable "domain_name" {
  type        = string
  description = "Domínio base da aplicação"
  default     = "it2a.com"
}

variable "frontend_subdomain" {
  type        = string
  description = "Subdomínio do Frontend"
  default     = "nfe"
}

variable "api_subdomain" {
  type        = string
  description = "Subdomínio da API"
  default     = "api.nfe"
}
