# Vercel Environment Variables Setup

## 🚀 **REQUIRED: Add These Environment Variables in Vercel**

Go to your Vercel Dashboard → Your Project → Settings → Environment Variables

> Security: Do not commit real credentials. If any of the values below were previously committed or shared, rotate them immediately in the provider dashboards before redeploying.

### 1. Housing.com API Credentials (Required)

```
HOUSING_PROFILE_ID = <your_housing_profile_id>
HOUSING_ENCRYPTION_KEY = <your_housing_encryption_key>
```

### 2. Cron Security (Optional but Recommended)

```
CRON_SECRET = <strong_unique_cron_secret>
```

### 3. Existing Supabase Credentials (Already configured)

```
NEXT_PUBLIC_SUPABASE_URL = <your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY = <your_supabase_anon_key>
```

## 📋 **Step-by-Step Vercel Setup**

1. **Go to Vercel Dashboard:**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `spaceoraclecrm`

2. **Add Environment Variables:**
   - Go to **Settings** → **Environment Variables**
   - Click **Add New** for each variable below

3. **Add Housing.com Variables:**
   ```
   Variable Name: HOUSING_PROFILE_ID
   Value: <your_housing_profile_id>
   Environment: Production, Preview, Development (select all)

   Variable Name: HOUSING_ENCRYPTION_KEY
   Value: <your_housing_encryption_key>
   Environment: Production, Preview, Development (select all)
   ```

4. **Add Cron Secret (Optional):**
   ```
   Variable Name: CRON_SECRET
   Value: <strong_unique_cron_secret>
   Environment: Production, Preview, Development (select all)
   ```

5. **Save and Redeploy:**
   - Click **Save**
   - Go to **Deployments** tab
   - Click **Redeploy** or wait for next automatic deployment

## ✅ **After Setup - Test Your Integration**

### 1. Test API Connection:
```
https://<your-deployment-url>/api/housing/test
```

### 2. Test Manual Sync:
```
curl -X POST https://<your-deployment-url>/api/housing/sync \
  -H "Content-Type: application/json" \
  -d '{"hoursBack": 24}'
```

### 3. Test Cron Endpoint:
```
curl -H "Authorization: Bearer <strong_unique_cron_secret>" \
  https://<your-deployment-url>/api/housing/cron
```

## 🔍 **Verify Setup Works**

After deployment, check your Vercel Function Logs:

1. Go to **Functions** tab in Vercel Dashboard
2. Look for `/api/housing/cron` executions
3. Verify logs show successful lead fetching

**Expected Log Output:**
```
[HousingConfig] ✅ Profile ID configured: 4648...
[HousingConfig] ✅ Encryption key configured: SET
[HousingAPIClient] Successfully fetched leads: X
```

## 📊 **Monitor Your Integration**

### Automatic Sync Schedule:
- **Frequency**: Every 15 minutes
- **Endpoint**: `/api/housing/cron`
- **Status**: Check Vercel Function Logs

### View New Leads:
- **CRM Portal**: https://<your-deployment-url>/enquiry/list
- **Filter**: Source = "Housing"
- **Status**: Should show new leads automatically

## 🚨 **Troubleshooting**

### If cron job fails:
1. Check Vercel Function Logs for errors
2. Verify environment variables are correctly set
3. Ensure Housing.com API credentials are valid

### If no leads appear:
1. Check if there are leads in your Housing.com account
2. Verify the API connection: `/api/housing/test`
3. Check for duplicate prevention (leads already exist)

### Common Issues:
- **"Credentials not configured"**: Environment variables missing
- **"Unauthorized access"**: Invalid Housing.com credentials
- **"No new leads found"**: No new leads in time window

## 🎯 **Success Indicators**

✅ **Deployment successful** in Vercel Dashboard
✅ **API test endpoint** returns success
✅ **Cron job executes** every 15 minutes
✅ **New leads appear** in your CRM portal
✅ **Function logs** show successful sync operations

Your Housing.com integration is now **production-ready**! 🏠✨