# Google Domains Registration Guide for perundhu.com

**Date**: January 5, 2026  
**Domain**: perundhu.com  
**Status**: Ready to register  
**Estimated Time**: 15-20 minutes  

---

## Step 1: Access Squarespace Domains

**Note**: Google Domains was acquired by Squarespace in 2023. Registration now happens via Squarespace.

1. Go to: **https://domains.squarespace.com** (or https://domains.google.com will redirect here)
2. Sign in with your Google account or create a Squarespace account

---

## Step 2: Search for Domain

1. In the search box, enter: `perundhu.com`
2. Click **Search** (or press Enter)
3. You should see availability: ✅ **Available**
4. Click on the domain to view details

---

## Step 3: Add to Cart & Checkout

1. Click **Add to cart**
2. Click **Go to cart**
3. Review the pricing:
   - First year: Usually ~$8-10 USD for `.com` domain
   - Auto-renewal: Enable (recommended for production)
4. Click **Continue to checkout**
5. Complete payment using your preferred method

---

## Step 4: Configure Nameservers (After Purchase)

Once purchased, Squarespace will show DNS configuration options. **IMPORTANT**: Use Google Cloud DNS nameservers instead of Squarespace's default.

### Option A: Using Google Cloud DNS (Recommended for Production)

1. In Squarespace, go to your domain settings
2. Find **Nameservers** or **DNS** section
3. Select **Use custom nameservers** (may be labeled "Connect external nameservers")
4. Replace Squarespace nameservers with Google Cloud DNS nameservers:
   ```
   ns-cloud-d1.googledomains.com.
   ns-cloud-d2.googledomains.com.
   ns-cloud-d3.googledomains.com.
   ns-cloud-d4.googledomains.com.
   ```
5. Click **Save**

### Option B: Using Squarespace DNS (Alternative)

If you prefer to use Squarespace's own DNS:
1. Keep Squarespace's default nameservers
2. Add A records in Squarespace DNS settings:
   - **Type**: A
   - **Name**: @ (for root domain perundhu.com)
   - **Data**: [Frontend Cloud Run IP] ← Will get Friday
   - **TTL**: 300
   - Also add: api.perundhu.com → [Backend Cloud Run IP]

---

## Step 5: Verify Nameserver Propagation

Once nameservers are updated, allow **5-15 minutes** for global DNS propagation.

To verify:
```bash
# Check nameservers
nslookup -type=NS perundhu.app

# Should return Google Cloud nameservers:
# ns-cloud-d1.googledomains.com.
# ns-cloud-d2.googledomains.com.
# ns-cloud-d3.googledomains.com.
# ns-cloud-d4.googledomains.com.
```

---

## Step 6: Create A Records in Cloud DNS (Friday)

Once Cloud Run services are deployed Friday and have external IPs, create records:

```bash
# Frontend A record
gcloud dns record-sets create perundhu.com. \
  --rrdatas=[FRONTEND_IP] \
  --ttl=300 \
  --type=A \
  --zone=perundhu-com \
  --project=perundhu-prod-001

# API Backend A record  
gcloud dns record-sets create api.perundhu.com. \
  --rrdatas=[BACKEND_IP] \
  --ttl=300 \
  --type=A \
  --zone=perundhu-com \
  --project=perundhu-prod-001
```

---

## Step 7: Optional - Email Configuration

If you want email at perundhu.app:

1. In Google Domains, go to **Email & accounts**
2. Click **Set up with Google Workspace** (or your preferred provider)
3. Or add MX records:
   ```
   10 aspmx.l.google.com.
   20 alt1.aspmx.l.google.com.
   30 alt2.aspmx.l.google.com.
   40 alt3.aspmx.l.google.com.
   50 alt4.aspmx.l.google.com.
   ```

---

## Checklist

- [ ] Account signed in at https://domains.google.com
- [ ] Domain `perundhu.com` searched and verified available
- [ ] Domain added to cart and purchased
- [ ] Payment completed
- [ ] Nameservers updated to Google Cloud nameservers:
  - [ ] ns-cloud-d1.googledomains.com.
  - [ ] ns-cloud-d2.googledomains.com.
  - [ ] ns-cloud-d3.googledomains.com.
  - [ ] ns-cloud-d4.googledomains.com.
- [ ] Nameserver propagation verified (5-15 minutes)
- [ ] Friday: Create A records with Cloud Run IPs

---

## Quick Reference

| Step | Status | Timeline |
|------|--------|----------|
| Register on Google Domains | ⏳ NOW | 10 minutes |
| Configure nameservers | ⏳ NOW | 5 minutes |
| Wait for DNS propagation | ⏳ NOW | 5-15 minutes |
| Verify nameserver changes | ✅ After propagation | 2 minutes |
| Create A records (Friday) | ⏳ FRIDAY | 5 minutes |
| Deploy to Cloud Run (Friday) | ⏳ FRIDAY | 30 minutes |
| Full activation | ⏳ FRIDAY | - |

---

## Support

**During Registration**:
- Squarespace support: https://support.squarespace.com/hc/en-us/articles/205812378-Add-a-domain
- Google Domains → Squarespace migration: https://support.google.com/domains/answer/13689670

**After Registration**:
- Cloud DNS management: `gcloud dns`
- Check propagation: `nslookup` or `dig` commands

---

## Summary

1. **Today (Now)**: Register domain on Squarespace (~15 min)
2. **Today (Now)**: Update nameservers to Google Cloud DNS (~5 min)
3. **Today (Now)**: Wait for DNS propagation (~5-15 min)
4. **Friday (Deployment Day)**: Create A records with Cloud Run IPs (~5 min)
5. **Friday (After IPs available)**: Full domain activation ✅

**Cost**: ~$8-10 USD/year for `.com` domain

