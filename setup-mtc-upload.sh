#!/bin/bash
# MTC Upload Environment Setup Helper

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}  MTC Data Upload Environment Setup${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

# Check Python
echo -e "${YELLOW}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✓ ${PYTHON_VERSION}${NC}\n"

# Check MySQL Client
echo -e "${YELLOW}Checking MySQL client...${NC}"
if ! command -v mysql &> /dev/null; then
    echo -e "${YELLOW}⚠ MySQL client not found (optional but recommended)${NC}"
    echo -e "  Install: brew install mysql-client${NC}\n"
else
    MYSQL_VERSION=$(mysql --version)
    echo -e "${GREEN}✓ ${MYSQL_VERSION}${NC}\n"
fi

# Select environment
echo -e "${YELLOW}Select environment:${NC}"
echo "1) local (default)"
echo "2) preprod"
echo "3) prod"
read -p "Enter choice [1-3] (default: 1): " ENV_CHOICE
ENV_CHOICE=${ENV_CHOICE:-1}

case $ENV_CHOICE in
    1) ENVIRONMENT="local" ;;
    2) ENVIRONMENT="preprod" ;;
    3) ENVIRONMENT="prod" ;;
    *) ENVIRONMENT="local" ;;
esac

echo -e "\n${BLUE}Setting up for: ${GREEN}${ENVIRONMENT}${NC}\n"

# Install Python dependencies
echo -e "${YELLOW}Installing Python dependencies...${NC}"
pip install mysql-connector-python --quiet
if [ "$ENVIRONMENT" = "prod" ]; then
    pip install google-cloud-secret-manager --quiet
    echo -e "${GREEN}✓ Dependencies installed (including GCP Secret Manager)${NC}\n"
else
    echo -e "${GREEN}✓ Dependencies installed${NC}\n"
fi

# Environment-specific setup
if [ "$ENVIRONMENT" = "local" ]; then
    setup_local
elif [ "$ENVIRONMENT" = "preprod" ]; then
    setup_preprod
elif [ "$ENVIRONMENT" = "prod" ]; then
    setup_prod
fi

echo -e "\n${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify configuration:"
echo "   python3 scripts/upload_mtc_data.py --environment $ENVIRONMENT --verbose"
echo ""
echo "2. Upload data:"
echo "   python3 scripts/upload_mtc_data.py --environment $ENVIRONMENT"
echo ""

# Functions
setup_local() {
    echo -e "${YELLOW}Configuring LOCAL environment...${NC}\n"
    
    # Check MySQL
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}✗ MySQL client required for local setup${NC}"
        echo -e "  Install: brew install mysql-client"
        exit 1
    fi
    
    # Check MySQL Server
    echo -e "${YELLOW}Checking MySQL Server...${NC}"
    if mysql -u root -e "SELECT 1" &> /dev/null 2>&1; then
        echo -e "${GREEN}✓ MySQL Server is running${NC}\n"
    else
        echo -e "${YELLOW}⚠ MySQL Server not running${NC}"
        echo -e "  Start MySQL: mysql.server start${NC}\n"
        read -p "Continue anyway? [y/N]: " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Create database
    echo -e "${YELLOW}Setting up local database...${NC}"
    mysql -u root -e "CREATE DATABASE IF NOT EXISTS perundhu;" 2>/dev/null || echo -e "${YELLOW}  (Database may already exist)${NC}"
    mysql -u root -e "CREATE USER IF NOT EXISTS 'perundhu_user'@'localhost' IDENTIFIED BY 'perundhu_password';" 2>/dev/null || echo -e "${YELLOW}  (User may already exist)${NC}"
    mysql -u root -e "GRANT ALL PRIVILEGES ON perundhu.* TO 'perundhu_user'@'localhost'; FLUSH PRIVILEGES;" 2>/dev/null
    
    # Test connection
    if mysql -u perundhu_user -pperundhu_password -h localhost perundhu -e "SELECT 1" &> /dev/null; then
        echo -e "${GREEN}✓ Local database configured and accessible${NC}\n"
    else
        echo -e "${RED}✗ Cannot connect to local database${NC}"
        exit 1
    fi
}

setup_preprod() {
    echo -e "${YELLOW}Configuring PREPROD environment...${NC}\n"
    
    # Create .env.preprod file
    if [ ! -f ".env.preprod" ]; then
        echo -e "${YELLOW}Creating .env.preprod template...${NC}"
        cat > .env.preprod << 'EOF'
# Preprod Database Configuration
PREPROD_DB_HOST=preprod-db.example.com
PREPROD_DB_PORT=3306
PREPROD_DB_USER=preprod_user
PREPROD_DB_PASSWORD=your_secure_password

# Optional SSL
# DB_SSL_CA=/path/to/ca-cert.pem
EOF
        echo -e "${YELLOW}⚠ Created .env.preprod template${NC}"
        echo -e "${YELLOW}  Edit and add your preprod credentials:${NC}"
        echo -e "  nano .env.preprod${NC}\n"
    else
        echo -e "${GREEN}✓ .env.preprod exists${NC}\n"
    fi
    
    # Verify connectivity
    if [ -f ".env.preprod" ]; then
        source .env.preprod
        echo -e "${YELLOW}Testing preprod connection...${NC}"
        if mysql -h "$PREPROD_DB_HOST" -u "$PREPROD_DB_USER" -p"$PREPROD_DB_PASSWORD" -e "SELECT 1" &> /dev/null 2>&1; then
            echo -e "${GREEN}✓ Preprod database connection successful${NC}\n"
        else
            echo -e "${YELLOW}⚠ Could not verify preprod connection${NC}"
            echo -e "  Check credentials in .env.preprod${NC}\n"
        fi
    fi
}

setup_prod() {
    echo -e "${YELLOW}Configuring PRODUCTION environment (GCP)...${NC}\n"
    
    # Check gcloud
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}✗ gcloud CLI required for production setup${NC}"
        echo -e "  Install: curl https://sdk.cloud.google.com | bash${NC}"
        exit 1
    fi
    
    GCLOUD_VERSION=$(gcloud --version | head -1)
    echo -e "${GREEN}✓ ${GCLOUD_VERSION}${NC}\n"
    
    # Check GCP authentication
    echo -e "${YELLOW}Checking GCP authentication...${NC}"
    if gcloud auth list | grep -q "ACTIVE"; then
        echo -e "${GREEN}✓ Authenticated with GCP${NC}\n"
    else
        echo -e "${YELLOW}⚠ Not authenticated with GCP${NC}"
        echo -e "  Run: gcloud auth application-default login${NC}\n"
    fi
    
    # Set GCP project
    read -p "Enter GCP Project ID [perundhu-project]: " GCP_PROJECT
    GCP_PROJECT=${GCP_PROJECT:-perundhu-project}
    
    echo -e "${YELLOW}Verifying GCP project...${NC}"
    if gcloud projects describe "$GCP_PROJECT" &> /dev/null; then
        echo -e "${GREEN}✓ Project '$GCP_PROJECT' is accessible${NC}\n"
        export GCP_PROJECT_ID="$GCP_PROJECT"
    else
        echo -e "${RED}✗ Cannot access project '$GCP_PROJECT'${NC}"
        exit 1
    fi
    
    # Check secrets
    echo -e "${YELLOW}Checking GCP Secrets...${NC}"
    SECRETS_FOUND=0
    for secret in production-db-url production-db-username production-db-password; do
        if gcloud secrets describe "$secret" --project="$GCP_PROJECT" &> /dev/null 2>&1; then
            echo -e "${GREEN}✓ Found secret: $secret${NC}"
            ((SECRETS_FOUND++))
        else
            echo -e "${YELLOW}⚠ Missing secret: $secret${NC}"
        fi
    done
    echo ""
    
    if [ $SECRETS_FOUND -lt 3 ]; then
        echo -e "${YELLOW}Create missing secrets:${NC}"
        echo ""
        echo "  echo -n \"prod-db-host.cloudsql.net\" | gcloud secrets create production-db-url --data-file=-"
        echo "  echo -n \"prod_user\" | gcloud secrets create production-db-username --data-file=-"
        echo "  echo -n \"secure_password\" | gcloud secrets create production-db-password --data-file=-"
        echo ""
    else
        echo -e "${GREEN}✓ All secrets found${NC}\n"
    fi
}
