# 🚀 Deployment Checklist

Use this checklist before deploying to production.

## Pre-Deployment Checklist

### 1. Database Setup ✅
- [ ] Run `database-schema-safe.sql` in Supabase SQL Editor
- [ ] Run `rls-policies.sql` in Supabase SQL Editor
- [ ] Run `verify-setup.sql` to confirm everything is configured
- [ ] All tables created successfully
- [ ] RLS policies applied to all tables
- [ ] Indexes created for performance

### 2. Admin User ✅
- [ ] Admin user created in Supabase Dashboard
- [ ] Admin user has `super_admin` role in users table
- [ ] Admin user email is confirmed (`email_confirmed_at` is not null)
- [ ] Can login successfully as admin
- [ ] Can access `/admin` dashboard

### 3. Test Data (Optional) ✅
- [ ] Created test doctor accounts
- [ ] Created test patient accounts
- [ ] Created sample beds and wards
- [ ] Tested complete workflow

### 4. Environment Variables ✅
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Environment variables work in production
- [ ] No service role keys exposed in frontend

### 5. Security ✅
- [ ] RLS enabled on all tables
- [ ] Patients can only see their own data
- [ ] Doctors can see all patients
- [ ] Admins have full access
- [ ] No SQL injection vulnerabilities
- [ ] No exposed API keys in code

### 6. Authentication ✅
- [ ] Login works correctly
- [ ] Registration works correctly
- [ ] Session persistence works
- [ ] No redirect loops
- [ ] Logout works correctly
- [ ] Password reset works (if implemented)

### 7. Features Testing ✅

#### Admin Features
- [ ] Can create doctor accounts
- [ ] Staff numbers auto-generate correctly
- [ ] Can set specializations
- [ ] Can activate/deactivate users
- [ ] Search functionality works

#### Doctor Features
- [ ] Can search patients
- [ ] Can diagnose patients
- [ ] Can create invoices
- [ ] Can admit patients
- [ ] Can view appointments

#### Patient Features
- [ ] Can register account
- [ ] Can book appointments
- [ ] Can view appointments
- [ ] Can view bills
- [ ] Can pay bills
- [ ] Can download receipts
- [ ] Can view medical records

### 8. Performance ✅
- [ ] Pages load quickly (< 3 seconds)
- [ ] Database queries are optimized
- [ ] Images are optimized
- [ ] No console errors
- [ ] No memory leaks

### 9. Mobile Responsiveness ✅
- [ ] Works on mobile devices
- [ ] Works on tablets
- [ ] Works on desktop
- [ ] All buttons are clickable
- [ ] Forms are usable

### 10. Error Handling ✅
- [ ] Graceful error messages
- [ ] No exposed stack traces
- [ ] Failed requests are handled
- [ ] Network errors are handled
- [ ] Database errors are handled

## Deployment Steps

### Netlify Deployment

1. **Connect Repository**
   - Go to Netlify Dashboard
   - Click "Add new site" > "Import an existing project"
   - Connect to GitHub
   - Select repository: `kibetchumba276/hospital`

2. **Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

3. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://mzxubcgsidqaoodwclwe.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
     ```

4. **Deploy**
   - Click "Deploy site"
   - Wait for build to complete
   - Test the deployed site

### Vercel Deployment

1. **Connect Repository**
   - Go to Vercel Dashboard
   - Click "Add New" > "Project"
   - Import from GitHub
   - Select repository

2. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`

3. **Set Environment Variables**
   - Add the same variables as Netlify

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment
   - Test the site

## Post-Deployment Checklist

### 1. Verify Deployment ✅
- [ ] Site is accessible at production URL
- [ ] All pages load correctly
- [ ] No 404 errors
- [ ] No console errors
- [ ] SSL certificate is active (HTTPS)

### 2. Test Core Functionality ✅
- [ ] Can login as admin
- [ ] Can create doctor account
- [ ] Can register as patient
- [ ] Can book appointment
- [ ] Can create invoice
- [ ] Can pay bill
- [ ] Can view medical records

### 3. Performance Check ✅
- [ ] Run Lighthouse audit (score > 80)
- [ ] Check page load times
- [ ] Check mobile performance
- [ ] Check database query performance

### 4. Security Check ✅
- [ ] HTTPS is enforced
- [ ] No exposed secrets
- [ ] RLS is working
- [ ] Authentication is secure
- [ ] CORS is configured correctly

### 5. Monitoring Setup ✅
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Set up performance monitoring
- [ ] Configure alerts

### 6. Documentation ✅
- [ ] Update README with production URL
- [ ] Document admin credentials
- [ ] Document deployment process
- [ ] Create user guide (if needed)

### 7. Backup Strategy ✅
- [ ] Database backups enabled in Supabase
- [ ] Code is in version control (GitHub)
- [ ] Environment variables are documented
- [ ] Recovery plan is documented

## Production URLs

After deployment, update these:

- **Production URL**: https://your-site.netlify.app
- **Admin Login**: https://your-site.netlify.app/login
- **Patient Registration**: https://your-site.netlify.app/register
- **Supabase Dashboard**: https://supabase.com/dashboard/project/mzxubcgsidqaoodwclwe

## Rollback Plan

If something goes wrong:

1. **Immediate Rollback**
   - Netlify: Click "Rollback to this deploy" on previous deployment
   - Vercel: Redeploy previous version

2. **Database Rollback**
   - Supabase has automatic backups
   - Go to Database > Backups
   - Restore previous backup if needed

3. **Code Rollback**
   - Revert to previous commit in GitHub
   - Push to trigger new deployment

## Support Contacts

- **Developer**: (your contact)
- **Supabase Support**: https://supabase.com/support
- **Netlify Support**: https://www.netlify.com/support/

## Maintenance Schedule

- **Daily**: Check error logs
- **Weekly**: Review performance metrics
- **Monthly**: Update dependencies
- **Quarterly**: Security audit

## Success Criteria

Deployment is successful when:
- ✅ All features work in production
- ✅ No critical errors in logs
- ✅ Performance is acceptable
- ✅ Security checks pass
- ✅ Users can complete core workflows

---

**Deployment Date**: _____________

**Deployed By**: _____________

**Production URL**: _____________

**Status**: ⬜ Not Started | ⬜ In Progress | ⬜ Complete

**Notes**:
_____________________________________________
_____________________________________________
_____________________________________________
