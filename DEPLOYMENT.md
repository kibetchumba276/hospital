# 🚀 Deployment Guide

## Option 1: Vercel (Recommended for Next.js)

### Steps:

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add New" → "Project"
   - Select your GitHub repository: `kibetchumba276/hospital`
   - Click "Import"

3. **Configure Environment Variables**
   Add these in the Environment Variables section:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mzxubcgsidqaoodwclwe.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHViY2dzaWRxYW9vZHdjbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjkxMjYsImV4cCI6MjA4OTQwNTEyNn0.a_Ts33C5k462pt0Nj5Yso3xu-ZaXOG9qP8EKRPBGz84
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your site will be live! 🎉

5. **Get Your URL**
   - You'll get a URL like: `hospital-xyz.vercel.app`
   - You can add a custom domain later

---

## Option 2: Netlify

### Steps:

1. **Go to Netlify**
   - Visit: https://netlify.com
   - Sign in with GitHub

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose GitHub
   - Select: `kibetchumba276/hospital`

3. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Click "Show advanced" → "New variable"

4. **Add Environment Variables**
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mzxubcgsidqaoodwclwe.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16eHViY2dzaWRxYW9vZHdjbHdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MjkxMjYsImV4cCI6MjA4OTQwNTEyNn0.a_Ts33C5k462pt0Nj5Yso3xu-ZaXOG9qP8EKRPBGz84
   ```

5. **Install Next.js Plugin**
   - Go to "Plugins" tab
   - Search for "@netlify/plugin-nextjs"
   - Click "Install"

6. **Deploy**
   - Click "Deploy site"
   - Wait 3-5 minutes
   - Your site will be live! 🎉

---

## After Deployment

### Important: Update Supabase Settings

1. **Add your deployment URL to Supabase**
   - Go to: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe/auth/url-configuration
   - Add your site URL to "Site URL"
   - Add to "Redirect URLs":
     - `https://your-site.vercel.app/patient`
     - `https://your-site.vercel.app/doctor`
     - `https://your-site.vercel.app/admin`

2. **Test Your Deployment**
   - Visit your live URL
   - Try registering a new patient
   - Try logging in
   - Book an appointment

---

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify Node version is 18+
- Check build logs for errors

### 404 Errors
- Make sure you ran `fix-rls-policies.sql` in Supabase
- Check that redirect URLs are configured in Supabase

### Can't Login/Register
- Verify environment variables are correct
- Check Supabase Auth settings
- Make sure RLS policies are applied

---

## Recommendation

**Use Vercel** - It's specifically optimized for Next.js and will give you:
- ✅ Faster builds
- ✅ Better performance
- ✅ Automatic preview deployments
- ✅ Edge functions support
- ✅ Free SSL certificate
- ✅ Global CDN

Both work, but Vercel is the better choice for Next.js applications!
