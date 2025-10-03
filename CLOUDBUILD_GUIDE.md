# Perundhu Cloud Build CI/CD Pipeline

## Overview

This document describes the comprehensive Cloud Build CI/CD pipeline for the Perundhu bus tracking application. The pipeline includes automated quality checks, security scanning, building, and deployment to Google Cloud Platform.

## 🏗️ Pipeline Architecture

The Cloud Build pipeline is designed with the following principles:
- **Quality First**: Comprehensive testing and code analysis before deployment
- **Security Focused**: Automated security scanning for dependencies and containers
- **Cost Effective**: Uses only free security tools and efficient resource allocation
- **Production Ready**: Includes proper health checks, monitoring, and rollback capabilities

## 📋 Pipeline Stages

### 1. Quality Checks & Code Analysis

#### Frontend Quality Checks
- **ESLint**: Code style and potential error detection
- **TypeScript**: Type checking and compilation validation
- **Unit Tests**: Vitest-based testing with coverage reporting
- **Build Validation**: Vite production build verification

#### Backend Quality Checks
- **Unit Tests**: JUnit 5 based testing
- **Integration Tests**: Hexagonal architecture validation
- **Code Quality**: Gradle check tasks (SpotBugs, Checkstyle)
- **Dependency Analysis**: Gradle dependency updates check

### 2. Security Scanning (Free Tools)

#### OWASP Dependency Check
- Scans backend and frontend dependencies for known vulnerabilities
- Generates JSON and HTML reports
- Identifies CVEs in third-party libraries

#### Trivy Container Scanning
- Scans Docker images for vulnerabilities
- Checks OS packages and application dependencies
- Provides detailed vulnerability reports

### 3. Application Building

#### Backend Build
- Gradle-based Spring Boot application build
- Multi-stage Docker image creation
- JAR artifact optimization
- Health check integration

#### Frontend Build
- Node.js-based React TypeScript build
- Vite production optimization
- Static asset generation
- Nginx-based container image

### 4. Database Migration
- Flyway-based database migrations
- Cloud SQL MySQL integration
- Version control and rollback support

### 5. Deployment
- Cloud Run containerized deployment
- Blue-green deployment strategy
- Automatic scaling configuration
- Health check validation

### 6. Post-Deployment Validation
- Service health endpoint testing
- Smoke test execution
- URL generation and reporting

## 🛠️ Setup Instructions

### Prerequisites

1. **Google Cloud Project** with billing enabled
2. **GitHub Repository** connected to Cloud Build
3. **gcloud CLI** installed and authenticated
4. **Required APIs** enabled (automated by setup script)

### Quick Setup

```bash
# 1. Clone the repository
git clone https://github.com/cmadhava85/perundhu.git
cd perundhu

# 2. Run the setup script
./scripts/setup-cloudbuild.sh -p YOUR_PROJECT_ID

# 3. Deploy the infrastructure (if not already done)
cd infrastructure
./deploy.sh

# 4. Trigger your first build
./scripts/deploy.sh -p YOUR_PROJECT_ID
```

## 📄 Configuration Files

### Core Files

| File | Description | Purpose |
|------|-------------|---------|
| `cloudbuild.yaml` | Main CI/CD pipeline configuration | Defines all build steps and quality checks |
| `frontend/Dockerfile` | Frontend container definition | Nginx-based React app container |
| `frontend/nginx.conf` | Nginx web server configuration | Production-ready web server setup |
| `backend/Dockerfile` | Backend container definition | Spring Boot application container |

### Helper Scripts

| Script | Description | Usage |
|--------|-------------|-------|
| `scripts/setup-cloudbuild.sh` | Initial Cloud Build setup | One-time setup of triggers and IAM |
| `scripts/deploy.sh` | Manual deployment trigger | Deploy to any environment |
| `scripts/build-status.sh` | Build monitoring and management | Monitor, cancel, watch builds |

## 🔧 Usage Examples

### Deploy to Preprod

```bash
# Deploy current master branch to preprod
./scripts/deploy.sh -p your-project-id

# Deploy with custom settings
./scripts/deploy.sh -p your-project-id -s "_BACKEND_MIN_INSTANCES=2"
```

### Monitor Builds

```bash
# List recent builds
./scripts/build-status.sh -p your-project-id

# Watch a specific build
./scripts/build-status.sh -p your-project-id -a watch -b BUILD_ID

# Show build logs
./scripts/build-status.sh -p your-project-id -a logs -b BUILD_ID
```

### Cancel Running Build

```bash
./scripts/build-status.sh -p your-project-id -a cancel -b BUILD_ID
```

## 🔐 Security Features

### Implemented Security Measures

1. **Dependency Scanning**
   - OWASP Dependency Check for known vulnerabilities
   - Regular updates and notifications

2. **Container Security**
   - Trivy scanning for container vulnerabilities
   - Non-root user execution
   - Minimal base images

3. **Runtime Security**
   - Service account least-privilege access
   - VPC private networking
   - Secret Manager for credentials

4. **Web Security**
   - Security headers in Nginx configuration
   - Content Security Policy (CSP)
   - HTTPS enforcement

### Security Reports

All security scan results are stored as build artifacts:
- `security-reports/backend/` - Backend dependency scan
- `security-reports/frontend/` - Frontend dependency scan  
- `security-reports/trivy/` - Container vulnerability scan

## 📊 Quality Gates

The pipeline enforces the following quality gates:

### Must Pass (Blocking)
- Frontend ESLint validation
- TypeScript compilation
- Backend unit tests
- Frontend unit tests
- Docker image builds

### Warning Only (Non-blocking)
- Code quality checks
- Dependency vulnerability scans
- Container vulnerability scans
- Architecture tests

## 🔧 Customization

### Environment Variables

Key substitution variables in `cloudbuild.yaml`:

```yaml
substitutions:
  _ENVIRONMENT: 'preprod'           # Target environment
  _REGION: 'us-central1'            # GCP region
  _BACKEND_CPU: '1'                 # Backend CPU allocation
  _BACKEND_MEMORY: '2Gi'            # Backend memory allocation
  _BACKEND_MIN_INSTANCES: '0'       # Minimum backend instances
  _BACKEND_MAX_INSTANCES: '10'      # Maximum backend instances
  _FRONTEND_CPU: '1'                # Frontend CPU allocation
  _FRONTEND_MEMORY: '1Gi'           # Frontend memory allocation
```

### Adding New Quality Checks

To add new quality checks, insert additional steps in the appropriate section:

```yaml
# Add after existing quality checks
- name: 'your-tool:latest'
  entrypoint: 'bash'
  args:
    - '-c'
    - |
      cd backend  # or frontend
      echo "Running additional quality check..."
      your-tool-command
  id: 'your-quality-check'
  waitFor: ['backend-deps']  # or appropriate dependency
```

## 🏷️ Build Artifacts

### Generated Artifacts

1. **Container Images**
   - `gcr.io/$PROJECT_ID/perundhu-backend:$BUILD_ID`
   - `gcr.io/$PROJECT_ID/perundhu-frontend:$BUILD_ID`

2. **Security Reports**
   - Dependency vulnerability reports
   - Container scan results

3. **Test Reports**
   - Unit test results
   - Code coverage reports

4. **Deployment Reports**
   - Service URLs
   - Deployment status
   - Configuration summary

## 🔄 Maintenance

### Regular Tasks

1. **Update Dependencies**
   ```bash
   # Backend
   cd backend
   ./gradlew dependencyUpdates
   
   # Frontend
   cd frontend
   npm audit
   npm update
   ```

2. **Review Security Reports**
   - Check OWASP dependency scan results
   - Review Trivy container scan findings
   - Update vulnerable dependencies

3. **Monitor Build Performance**
   - Review build duration trends
   - Optimize slow build steps
   - Clean up old artifacts

### Troubleshooting

#### Common Issues

1. **Build Timeout**
   - Increase timeout in `cloudbuild.yaml`
   - Optimize dependency caching
   - Use parallel steps where possible

2. **Test Failures**
   - Check test logs in Cloud Build console
   - Run tests locally to reproduce
   - Review test environment configuration

3. **Deployment Failures**
   - Verify Cloud Run service configuration
   - Check VPC connector and networking
   - Validate environment variables

#### Debug Commands

```bash
# Check Cloud Build status
gcloud builds list --limit=10

# View specific build logs
gcloud builds log BUILD_ID

# Check Cloud Run service status
gcloud run services describe SERVICE_NAME --region=REGION

# Test service health
curl https://your-service-url/actuator/health
```

## 🚀 Performance Optimization

### Build Speed Improvements

1. **Dependency Caching**
   - NPM cache for frontend builds
   - Gradle cache for backend builds
   - Docker layer caching

2. **Parallel Execution**
   - Frontend and backend tests run in parallel
   - Security scans run concurrently
   - Independent quality checks

3. **Resource Allocation**
   - E2_HIGHCPU_8 machine type for faster builds
   - Sufficient disk space allocation
   - Optimized step dependencies

### Cost Optimization

1. **Efficient Resource Usage**
   - Scale to zero for non-production environments
   - Right-sized CPU and memory allocations
   - Automatic artifact cleanup

2. **Free Tool Usage**
   - OWASP Dependency Check (free)
   - Trivy vulnerability scanner (free)
   - Built-in Cloud Build features

## 📚 Additional Resources

- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Trivy Scanner](https://trivy.dev/)
- [Spring Boot on Cloud Run](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/deploy-java-service)

## 🤝 Contributing

When contributing to the CI/CD pipeline:

1. Test changes in a development environment first
2. Update documentation for any new features
3. Ensure backward compatibility with existing deployments
4. Add appropriate quality checks for new components
5. Update security scanning for new dependencies

---

**Happy Building! 🚀**

For questions or issues, please check the troubleshooting section or create an issue in the repository.