resource "aws_amplify_app" "web" {
  name       = "${var.app_name}-web-${var.environment}"
  repository = var.github_repository

  # Script de build nativo para o monorepo pnpm Next.js
  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: apps/web
        frontend:
          phases:
            preBuild:
              commands:
                - corepack enable
                - corepack prepare pnpm@9.0.0 --activate
                - pnpm install --frozen-lockfile
            build:
              commands:
                - env | grep -e NEXT_PUBLIC_ >> .env.production
                - pnpm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - .next/cache/**/*
              - node_modules/**/*
  EOT

  environment_variables = {
    NEXT_PUBLIC_API_URL = "https://${var.api_subdomain}.${var.domain_name}"
    NODE_ENV            = "production"
  }

  enable_branch_auto_build = true
}

# Branch de produção conectada ao GitHub
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.web.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"
}

# Associação de domínio customizado para o Frontend (nfe.it2a.com)
resource "aws_amplify_domain_association" "domain" {
  app_id      = aws_amplify_app.web.id
  domain_name = var.domain_name

  # Subdomínio nfe.it2a.com
  sub_domain {
    branch_name = aws_amplify_branch.main.branch_name
    prefix      = var.frontend_subdomain
  }

  enable_auto_sub_domain = false
}
