# Role IAM que permite o App Runner baixar imagens do Amazon ECR
resource "aws_iam_role" "apprunner_ecr_access" {
  name = "${var.app_name}-apprunner-ecr-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "build.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "apprunner_ecr_policy" {
  role       = aws_iam_role.apprunner_ecr_access.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSAppRunnerServicePolicyForECRAccess"
}

# Role de Instância (Runtime) para a API acessar S3 e outros serviços
resource "aws_iam_role" "apprunner_instance_role" {
  name = "${var.app_name}-apprunner-instance-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "tasks.apprunner.amazonaws.com"
        }
      }
    ]
  })
}

# Permissão para a API gravar no S3 de documentos fiscais
resource "aws_iam_role_policy" "s3_access_policy" {
  name = "${var.app_name}-s3-policy-${var.environment}"
  role = aws_iam_role.apprunner_instance_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:PutObject",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Effect   = "Allow"
        Resource = [
          aws_s3_bucket.fiscal_documents.arn,
          "${aws_s3_bucket.fiscal_documents.arn}/*"
        ]
      }
    ]
  })
}

# Serviço do AWS App Runner para a API Fastify
resource "aws_apprunner_service" "api" {
  service_name = "${var.app_name}-api-${var.environment}"

  source_configuration {
    authentication_configuration {
      access_role_arn = aws_iam_role.apprunner_ecr_access.arn
    }

    image_repository {
      image_identifier      = "${aws_ecr_repository.api.repository_url}:latest"
      image_repository_type = "ECR"

      image_configuration {
        port = "3000"
        runtime_environment_variables = {
          NODE_ENV        = var.environment
          PORT            = "3000"
          DATABASE_URL    = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${aws_db_instance.postgres.db_name}"
          STORAGE_BUCKET  = aws_s3_bucket.fiscal_documents.id
          STORAGE_REGION  = var.aws_region
        }
      }
    }

    auto_deployments_enabled = true
  }

  instance_configuration {
    cpu               = "1024" # 1 vCPU
    memory            = "2048" # 2 GB RAM
    instance_role_arn = aws_iam_role.apprunner_instance_role.arn
  }

  health_check_configuration {
    protocol            = "HTTP"
    path                = "/health"
    interval            = 10
    timeout             = 5
    healthy_threshold   = 1
    unhealthy_threshold = 3
  }
}

# Associação de domínio customizado para a API (api.nfe.it2a.com)
resource "aws_apprunner_custom_domain_association" "api_domain" {
  domain_name = "${var.api_subdomain}.${var.domain_name}"
  service_arn = aws_apprunner_service.api.arn
}
