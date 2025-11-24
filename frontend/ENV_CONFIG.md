# Frontend Environment Configuration Guide

## Overview
The frontend can run against different backend environments. This guide explains how to switch between them.

## Environment Files

- **`.env`** - Default configuration (now uses preprod backend)
- **`.env.local`** - Local development (overrides .env when present)
- **`.env.preprod`** - PreProd environment configuration
- **`.env.production`** - Production environment configuration

## Running Against Different Backends

### 1. **PreProd Backend (Default)**
```bash
npm run dev
# or
npm run dev:preprod
```
This connects to: `https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app`

### 2. **Local Backend**
```bash
npm run dev:local
```
This connects to: `http://localhost:8080`

**Prerequisites:**
- Backend must be running locally on port 8080
- Start backend with: `cd backend/app && ./mvnw spring-boot:run`

### 3. **Production Backend**
```bash
npm run build -- --mode production
npm run preview
```

## Environment Variable Priority

Vite loads environment variables in this order (highest priority first):
1. `.env.[mode].local` (e.g., `.env.preprod.local`)
2. `.env.[mode]` (e.g., `.env.preprod`)
3. `.env.local`
4. `.env`

## Key Environment Variables

- `VITE_API_URL` - Full backend URL
- `VITE_API_BASE_URL` - Same as VITE_API_URL (kept for compatibility)
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_FEATURE_*` - Feature flags

## Troubleshooting

### Issue: Frontend still connecting to localhost
**Solution:**
1. Stop the dev server (Ctrl+C)
2. Clear browser cache or use incognito mode
3. Restart dev server: `npm run dev`
4. Check browser console for: "Creating API instance with baseURL: ..."

### Issue: CORS errors
**Solution:**
- Ensure backend CORS is configured to allow frontend origin
- Check backend logs for CORS-related errors
- Verify backend is actually running and accessible

### Issue: Environment variables not updating
**Solution:**
1. Stop dev server completely
2. Delete `node_modules/.vite` cache
3. Restart: `npm run dev`

## Scripts Added

```json
"dev": "vite",                    // Default - uses preprod backend
"dev:local": "...",              // Override to use localhost:8080
"dev:preprod": "vite --mode preprod"  // Explicitly use preprod
```

## Note on .env.local

The `.env.local` file is loaded automatically when present and will **override** values from `.env`. 

- If you want to use preprod by default: **delete or rename** `.env.local`
- If you want to use localhost: keep `.env.local` as is

Current setup: `.env` now defaults to preprod, so `.env.local` won't interfere unless you explicitly want local backend.
