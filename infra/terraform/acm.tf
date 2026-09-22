# ==========================================
# Certificado SSL no AWS Certificate Manager (ACM)
# ==========================================
resource "aws_acm_certificate" "api_cert" {
  domain_name       = "api.nfe.${var.domain_name}"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.nfe.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "SSL Cert - api.nfe.${var.domain_name}"
  }
}

# Listener HTTPS será ativado assim que a validação do DNS for concluída na IONOS
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.api.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
#   certificate_arn   = aws_acm_certificate.api_cert.arn
# 
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.api.arn
#   }
# }
