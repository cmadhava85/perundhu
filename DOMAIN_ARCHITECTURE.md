# Domain Architecture: How perundhu.com Connects Frontend & Backend

---

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Visits perundhu.com                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    (DNS Lookup)
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│          Google Cloud DNS (perundhu-com zone)                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  A Record: perundhu.com → 35.244.x.x (Frontend IP)        │ │
│  │  A Record: api.perundhu.com → 35.244.y.y (Backend IP)     │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────┬──────────────────┘
               │                               │
        (Route to 35.244.x.x)          (Route to 35.244.y.y)
               │                               │
               ▼                               ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│   Cloud Run Frontend         │  │   Cloud Run Backend         │
│   perundhu-frontend          │  │   perundhu-backend          │
│   (Vite + React)             │  │   (Spring Boot)             │
│   Port 5173 → HTTPS 443      │  │   Port 8080 → HTTPS 443    │
│   35.244.x.x                 │  │   35.244.y.y                │
│                              │  │                             │
│  • HTML/CSS/JS               │  │  • API Endpoints            │
│  • reCAPTCHA client          │  │  • reCAPTCHA validation     │
│  • Forms & UI                │  │  • JWT verification        │
│                              │  │  • Database queries        │
└──────────────┬───────────────┘  └────────────┬────────────────┘
               │                               │
               │         (API Calls)           │
               │ /api/admin/auth/login         │
               │ /api/v1/contributions/*       │
               └──────────────────────────────►│
                                               │
                         (Returns JSON responses)
```

---

## What Happens When User Visits perundhu.com

### Step 1: DNS Resolution
```
User enters: perundhu.com in browser
↓
Browser performs DNS lookup
↓
Queries Google's nameservers:
  - ns-cloud-e1.googledomains.com.
  - ns-cloud-e2.googledomains.com.
  - ns-cloud-e3.googledomains.com.
  - ns-cloud-e4.googledomains.com.
↓
Nameservers respond with A record:
  perundhu.com → 35.244.x.x (Frontend IP)
↓
Browser connects to 35.244.x.x
```

### Step 2: Frontend Loads
```
HTTP Request: GET perundhu.com/
↓
Cloud Run Frontend Service (35.244.x.x)
↓
Returns: HTML/CSS/JavaScript (React app)
↓
Browser renders Perundhu Bus Tracker UI
↓
Frontend JavaScript loads and runs
```

### Step 3: Frontend Makes API Calls
```
When user clicks "Login" or "Submit Contribution":
↓
Frontend JavaScript code makes API call
↓
Target: api.perundhu.com/api/admin/auth/login
↓
Browser performs DNS lookup again
↓
Queries nameservers for api.perundhu.com
↓
Nameservers respond with A record:
  api.perundhu.com → 35.244.y.y (Backend IP)
↓
Request sent to 35.244.y.y
↓
Cloud Run Backend Service responds with JSON
```

---

## DNS Records (Created Friday)

### Record 1: Root Domain (Frontend)
```
Type:   A
Name:   perundhu.com.
Value:  35.244.x.x          ← Frontend Cloud Run IP (to be determined Friday)
TTL:    300 seconds
Zone:   perundhu-com (Google Cloud DNS)

Result: perundhu.com → Frontend
```

### Record 2: API Subdomain (Backend)
```
Type:   A
Name:   api.perundhu.com.
Value:  35.244.y.y          ← Backend Cloud Run IP (to be determined Friday)
TTL:    300 seconds
Zone:   perundhu-com (Google Cloud DNS)

Result: api.perundhu.com → Backend
```

---

## How Frontend Code Knows About Backend

### Frontend Environment Variables (`.env.production`)
```env
VITE_API_BASE_URL=https://api.perundhu.com
VITE_RECAPTCHA_SITE_KEY=6Lf-qkAsAAAAAMsufKTr2pb6mh9_OSEYcDyl7juE
```

### Frontend API Calls
```javascript
// In src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
// Result: https://api.perundhu.com

// Example API call
fetch(`${API_BASE_URL}/api/admin/auth/login`, {
  method: 'POST',
  headers: {
    'X-reCAPTCHA-Token': recaptchaToken
  },
  body: JSON.stringify({ email, password })
})
```

### Backend Handles All API Routes
```
Backend runs on: Cloud Run (35.244.y.y)

All requests to api.perundhu.com/* route to:
  - /api/admin/auth/login
  - /api/admin/auth/logout
  - /api/admin/auth/status
  - /api/v1/contributions/routes
  - /api/v1/contributions/images
  - /api/v1/locations/*
  - /api/v1/buses/*
  - etc.
```

---

## Architecture Summary

| Component | Domain | IP | Service | Port |
|-----------|--------|----|---------│------|
| **Frontend** | perundhu.com | 35.244.x.x | Cloud Run | 443 (HTTPS) |
| **Backend** | api.perundhu.com | 35.244.y.y | Cloud Run | 443 (HTTPS) |
| **DNS** | - | - | Google Cloud DNS | 53 |
| **Database** | - | Private VPC | Cloud SQL | 3306 |

---

## Data Flow Example: User Login

```
1. User visits: https://perundhu.com
   ↓ DNS resolves to Frontend IP (35.244.x.x)
   ↓ Frontend loads (React app)

2. User clicks "Admin Login" button
   ↓ Frontend shows login form

3. User enters email & password, clicks "Login"
   ↓ Frontend JavaScript:
     • Calls reCAPTCHA API (Google's servers)
     • Gets reCAPTCHA token
     • Calls: POST https://api.perundhu.com/api/admin/auth/login
     ↓ DNS resolves api.perundhu.com to Backend IP (35.244.y.y)

4. Backend receives request:
   ↓ Validates reCAPTCHA token with Google
   ↓ Validates email & password against Cloud SQL
   ↓ Generates JWT token
   ↓ Returns: { token: "jwt...", user: {...} }

5. Frontend receives response:
   ↓ Stores JWT in localStorage
   ↓ Redirects to dashboard
   ↓ All future API calls include JWT header
```

---

## Friday Deployment Flow

### Before A Records Exist
```
perundhu.com → ❌ No DNS record
api.perundhu.com → ❌ No DNS record
```

### Step 1: Deploy Frontend to Cloud Run
```bash
gcloud run deploy perundhu-frontend ...
↓
Returns: Service URL (auto-generated)
Gets External IP: 35.244.x.x ← SAVE THIS
```

### Step 2: Deploy Backend to Cloud Run
```bash
gcloud run deploy perundhu-backend ...
↓
Returns: Service URL (auto-generated)
Gets External IP: 35.244.y.y ← SAVE THIS
```

### Step 3: Create DNS A Records
```bash
# Root domain → Frontend
gcloud dns record-sets create perundhu.com. \
  --rrdatas=35.244.x.x \
  --ttl=300 --type=A --zone=perundhu-com

# API subdomain → Backend
gcloud dns record-sets create api.perundhu.com. \
  --rrdatas=35.244.y.y \
  --ttl=300 --type=A --zone=perundhu-com

↓ DNS Propagation (2-5 minutes)
↓ perundhu.com is LIVE! 🚀
```

---

## SSL/HTTPS

### Automatic
- Google Cloud Run **automatically provisions HTTPS certificates** for custom domains
- No manual certificate management needed
- HTTPS is enforced (HTTP redirects to HTTPS)

### Certificate Details
```
perundhu.com:
  Certificate: Issued by Google Cloud
  Status: Auto-renewed
  Protocol: TLS 1.2+

api.perundhu.com:
  Certificate: Issued by Google Cloud
  Status: Auto-renewed
  Protocol: TLS 1.2+
```

---

## Summary

**perundhu.com connection**:
1. **DNS** routes perundhu.com → Frontend Cloud Run
2. **DNS** routes api.perundhu.com → Backend Cloud Run
3. **Frontend** serves UI and makes API calls to api.perundhu.com
4. **Backend** processes API requests and returns JSON
5. **Cloud SQL** stores all data (in private VPC)
6. **HTTPS** is automatic via Google Cloud

**Result**: Seamless user experience with domain names instead of IP addresses!

