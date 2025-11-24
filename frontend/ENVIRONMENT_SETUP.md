# Frontend Environment Configuration Guide

## Environment Files

The frontend uses different `.env` files for different environments:

### `.env` (Default - Local Development)
- Used for local development with localhost backend
- API URL: `http://localhost:8080`
- Run with: `npm run dev`

### `.env.development` 
- Explicit development environment configuration
- Same as `.env` but more explicit
- API URL: `http://localhost:8080`

### `.env.preprod`
- Pre-production environment
- API URL: `https://perundhu-backend-preprod-c6qn3mz4wa-el.a.run.app`
- Run locally with: `npm run dev:preprod`
- Auto-deployed by GitHub Actions

### `.env.production`
- Production environment
- API URL: Set dynamically during deployment
- Only used in production builds
- Deployed via GitHub Actions release workflow

## Running Locally

### With Local Backend
```bash
npm run dev
# or
npm run dev:local
```

### With PreProd Backend
```bash
npm run dev:preprod
```

## Building for Different Environments

### Development Build
```bash
npm run build
```

### PreProd Build
```bash
npm run build -- --mode preprod
```

### Production Build
```bash
npm run build -- --mode production
```

## Environment Variables

### Required Variables

- `VITE_API_URL` - Backend API base URL (without `/api/v1`)
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key
- `VITE_PERUNDHU_MAP_ID` - Custom map ID for Google Maps

### Feature Flags

- `VITE_FEATURE_TRACKING` - Enable bus tracking features
- `VITE_FEATURE_REWARDS` - Enable rewards system
- `VITE_FEATURE_ANALYTICS` - Enable analytics dashboard
- `VITE_ENABLE_MAP` - Enable map features
- `VITE_FEATURE_ADMIN` - Enable admin features

### Development Flags

- `VITE_MOCK_API` - Use mock API responses (set to `false` for real data)
- `VITE_USE_MOCK_DATA` - Use mock data (set to `false` for real data)
- `VITE_OFFLINE_MODE` - Enable offline mode

## How Vite Loads Environment Files

Vite loads environment files in this order (later files override earlier ones):

1. `.env` - Always loaded
2. `.env.local` - Always loaded, ignored by git
3. `.env.[mode]` - Loaded based on the mode (development, preprod, production)
4. `.env.[mode].local` - Loaded based on the mode, ignored by git

## CI/CD Integration

### PreProd Deployment
- GitHub Actions copies `.env.preprod` to `.env.local` during build
- Backend URL is pre-configured in `.env.preprod`

### Production Deployment  
- GitHub Actions uses `.env.production` as base
- Backend URL is dynamically fetched from Cloud Run
- Appends runtime variables to `.env.local`

## Troubleshooting

### Frontend connects to wrong backend

1. Check which dev script you're running:
   - `npm run dev` → localhost:8080
   - `npm run dev:preprod` → preprod backend

2. Verify environment variables are loaded:
   ```bash
   # In browser console
   console.log(import.meta.env.VITE_API_URL)
   ```

3. Restart dev server after changing `.env` files:
   ```bash
   # Kill existing server
   lsof -ti:5173 | xargs kill -9
   
   # Start fresh
   npm run dev:preprod
   ```

### Environment variables not updating

- Vite only processes `VITE_*` prefixed variables
- Must restart dev server after changing `.env` files
- `.env.local` overrides other files (check if it exists)

## Security Notes

- Never commit `.env.local` files (already in `.gitignore`)
- API keys in committed files are for development only
- Production secrets are injected via GitHub Secrets during deployment
