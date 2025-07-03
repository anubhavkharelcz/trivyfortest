#!/bin/bash

# Local Trivy Security Scanning Script
# This script demonstrates how to run Trivy scans locally

set -e

echo "🔍 Starting Trivy Security Scans..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
    print_error "Trivy is not installed. Please install it first."
    echo "Installation instructions: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
    exit 1
fi

# Create reports directory
mkdir -p reports

# 1. Filesystem scan
print_status "Running filesystem scan..."
trivy fs . --format table --output reports/filesystem-scan.txt
trivy fs . --format json --output reports/filesystem-scan.json

# 2. Docker image scan (if Docker is available)
if command -v docker &> /dev/null; then
    print_status "Building Docker image..."
   docker build -t use-trivy -f docker/Dockerfile docker/
    
    print_status "Running Docker image scan..."
    trivy image use-trivy:latest --format table --output reports/docker-scan.txt
    trivy image use-trivy:latest --format json --output reports/docker-scan.json
else
    print_warning "Docker not found. Skipping Docker image scan."
fi

# 3. Terraform configuration scan
print_status "Running Terraform configuration scan..."
trivy config ./terraform --format table --output reports/terraform-scan.txt
trivy config ./terraform --format json --output reports/terraform-scan.json

# 4. Generate summary report
print_status "Generating summary report..."
cat > reports/summary.md << EOF
# Trivy Security Scan Summary

Generated on: $(date)

## Scan Results

### Filesystem Scan
- **Location**: Repository root
- **Report**: [filesystem-scan.txt](filesystem-scan.txt)
- **JSON Report**: [filesystem-scan.json](filesystem-scan.json)

### Docker Image Scan
- **Image**: use-trivy:latest
- **Report**: [docker-scan.txt](docker-scan.txt)
- **JSON Report**: [docker-scan.json](docker-scan.json)

### Terraform Configuration Scan
- **Location**: ./terraform
- **Report**: [terraform-scan.txt](terraform-scan.txt)
- **JSON Report**: [terraform-scan.json](terraform-scan.json)

## Next Steps

1. Review the detailed reports for each scan type
2. Prioritize fixing HIGH and CRITICAL vulnerabilities
3. Update dependencies and configurations based on findings
4. Run scans regularly as part of your development workflow

## Common Fixes

- Update outdated dependencies
- Fix Terraform security misconfigurations
- Update base Docker images
- Implement proper secret management
- Review and tighten security group rules

EOF

print_status "All scans completed! Check the 'reports' directory for detailed results."
print_status "Summary report: reports/summary.md"
```

### 10. `.gitignore`
```gitignore
# Terraform
*.tfstate
*.tfstate.*
*.tfvars
.terraform/
.terraform.lock.hcl

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
MANIFEST

# Virtual environments
venv/
env/
ENV/

# IDEs
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
*.log

# Reports
reports/
security-report.md
trivy-*-results.sarif

# Docker
.dockerignore