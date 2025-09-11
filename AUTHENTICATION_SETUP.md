# 🔐 Secure Authentication Setup Guide

## Overview
Your application now uses **OAuth 2.0 / OpenID Connect** for secure authentication without handling user credentials directly. This approach is industry-standard and highly secure.

## 🚀 Quick Setup Options

### 1. **Google OAuth2** (Recommended for quick start)
```bash
# Set environment variables
export JWT_JWK_SET_URI=https://www.googleapis.com/oauth2/v3/certs
export JWT_ISSUER_URI=https://accounts.google.com
export JWT_AUDIENCES=your-google-client-id
```

**Frontend Integration:**
```javascript
// Install: npm install @google-cloud/auth-library
import { GoogleAuth } from 'google-auth-library';

const auth = new GoogleAuth({
  scopes: ['openid', 'email', 'profile'],
  credentials: {
    client_id: 'your-google-client-id',
    client_secret: 'your-google-client-secret'
  }
});

// Get ID token and send to your API
const token = await auth.getIdToken();
fetch('/api/v1/contributions/routes', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(contributionData)
});
```

### 2. **Auth0** (Best for production)
```bash
export JWT_JWK_SET_URI=https://your-domain.auth0.com/.well-known/jwks.json
export JWT_ISSUER_URI=https://your-domain.auth0.com/
export JWT_AUDIENCES=your-auth0-api-identifier
```

**Frontend Integration:**
```javascript
// Install: npm install @auth0/auth0-spa-js
import createAuth0Client from '@auth0/auth0-spa-js';

const auth0 = await createAuth0Client({
  domain: 'your-domain.auth0.com',
  clientId: 'your-auth0-client-id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'your-auth0-api-identifier'
  }
});

// Get token and call API
const token = await auth0.getTokenSilently();
```

### 3. **GitHub OAuth2**
```bash
export JWT_JWK_SET_URI=https://token.actions.githubusercontent.com/.well-known/jwks
export JWT_ISSUER_URI=https://token.actions.githubusercontent.com
```

### 4. **AWS Cognito**
```bash
export JWT_JWK_SET_URI=https://cognito-idp.region.amazonaws.com/user-pool-id/.well-known/jwks.json
export JWT_ISSUER_URI=https://cognito-idp.region.amazonaws.com/user-pool-id
```

## 🛡️ Security Features Implemented

### ✅ **What's Secure:**
- **No password storage** - Delegates to trusted providers
- **JWT token validation** - Cryptographically verified
- **Role-based access** - Admin endpoints protected
- **Stateless authentication** - Scalable and secure
- **CORS protection** - Configured for your frontend domains
- **Public endpoints** - Analytics and schedules remain accessible

### ✅ **User Data Extraction:**
```java
// Your controllers now automatically get real user data:
String userId = authenticationService.getCurrentUserId();
String email = authenticationService.getCurrentUserEmail().orElse("");
boolean isAdmin = authenticationService.isCurrentUserAdmin();
```

## 🔧 Development Mode

For local development, the system uses a **MockJwtDecoder** that creates temporary user sessions without requiring real OAuth2 setup.

## 📱 Frontend Integration

### React/Vue.js Example:
```javascript
// Create an API client with automatic token handling
class AuthenticatedApiClient {
  constructor(getTokenFunction) {
    this.getToken = getTokenFunction;
  }

  async post(endpoint, data) {
    const token = await this.getToken();
    return fetch(`/api/v1${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });
  }
}

// Usage
const apiClient = new AuthenticatedApiClient(() => auth0.getTokenSilently());
await apiClient.post('/contributions/routes', routeData);
```

## 🏢 Production Deployment

### Environment Variables:
```bash
# Required for production
JWT_JWK_SET_URI=https://your-provider.com/.well-known/jwks.json
JWT_ISSUER_URI=https://your-provider.com/
JWT_AUDIENCES=your-api-identifier

# Optional security hardening
REQUIRE_SSL=true
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### Docker Example:
```dockerfile
ENV JWT_JWK_SET_URI=https://your-provider.com/.well-known/jwks.json
ENV JWT_ISSUER_URI=https://your-provider.com/
ENV REQUIRE_SSL=true
```

## 🎯 Benefits of This Approach

1. **Zero Credential Handling** - Never store or validate passwords
2. **Industry Standard** - OAuth2/OIDC used by Google, Microsoft, etc.
3. **Scalable** - Stateless JWT tokens
4. **Flexible** - Works with any OAuth2 provider
5. **Secure by Default** - Cryptographic validation
6. **User Friendly** - Single sign-on experience

## 🔍 API Endpoints Protection

| Endpoint Pattern | Access Level |
|------------------|-------------|
| `/api/v1/bus-schedules/**` | 🌐 Public |
| `/api/v1/analytics/**` | 🌐 Public |
| `/api/v1/contributions/analyze-image` | 🌐 Public |
| `/api/v1/contributions/**` | 🔒 Authenticated |
| `/api/admin/**` | 👑 Admin Only |

## 🚀 Next Steps

1. **Choose a provider** (Google, Auth0, etc.)
2. **Set environment variables** 
3. **Update your frontend** to get JWT tokens
4. **Test with real OAuth2** provider
5. **Deploy with production settings**

Your application is now enterprise-ready with secure, delegated authentication! 🎉