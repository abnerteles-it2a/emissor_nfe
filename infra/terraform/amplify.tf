resource "aws_amplify_app" "web" {
  name         = "${var.app_name}-web-${var.environment}"
  platform     = "WEB_COMPUTE"
  repository   = var.github_token != "" ? var.github_repository : null
  access_token = var.github_token != "" ? var.github_token : null


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
                - cd ../..
                - pnpm install --frozen-lockfile --prod=false
                - cd apps/web
            build:
              commands:
                - env | grep -e NEXT_PUBLIC_ >> .env.production
                - pnpm run build
                - if [ -d ../../node_modules/next ]; then rm -rf ./node_modules/next && cp -r ../../node_modules/next ./node_modules/next; fi
                - if [ -d ../../node_modules/@next ]; then rm -rf ./node_modules/@next && cp -r ../../node_modules/@next ./node_modules/@next; fi
                - if [ -d ../../node_modules/react ]; then rm -rf ./node_modules/react && cp -r ../../node_modules/react ./node_modules/react; fi
                - if [ -d ../../node_modules/react-dom ]; then rm -rf ./node_modules/react-dom && cp -r ../../node_modules/react-dom ./node_modules/react-dom; fi
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
    AMPLIFY_MONOREPO_APP_ROOT = "apps/web"
    AMPLIFY_DIFF_DEPLOY       = "false"
    NEXT_PUBLIC_API_URL       = "https://${var.api_subdomain}.${var.domain_name}"
    NODE_ENV                  = "production"
  }


  enable_branch_auto_build = true
}

# Branch de produção conectada ao GitHub
resource "aws_amplify_branch" "main" {
  count       = var.github_token != "" ? 1 : 0
  app_id      = aws_amplify_app.web.id
  branch_name = "main"

  framework = "Next.js - SSR"
  stage     = "PRODUCTION"
}

# Associação de domínio customizado para o Frontend (nfe.it2a.com)
resource "aws_amplify_domain_association" "domain" {
  count       = var.github_token != "" ? 1 : 0
  app_id      = aws_amplify_app.web.id
  domain_name = var.domain_name

  # Subdomínio nfe.it2a.com
  sub_domain {
    branch_name = aws_amplify_branch.main[0].branch_name
    prefix      = var.frontend_subdomain
  }

  enable_auto_sub_domain = false
  wait_for_verification  = false
}

