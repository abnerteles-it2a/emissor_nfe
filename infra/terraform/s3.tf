data "aws_caller_identity" "current" {}

resource "aws_s3_bucket" "fiscal_documents" {
  bucket = "${var.app_name}-docs-${var.environment}-${data.aws_caller_identity.current.account_id}"

  # Previne deleção acidental de notas fiscais
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_s3_bucket_versioning" "fiscal_documents_versioning" {
  bucket = aws_s3_bucket.fiscal_documents.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "fiscal_documents_encryption" {
  bucket = aws_s3_bucket.fiscal_documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "fiscal_documents_public_block" {
  bucket = aws_s3_bucket.fiscal_documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
