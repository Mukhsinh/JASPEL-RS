# 🚀 Panduan Deployment JASPEL KPI System ke Vercel

Panduan lengkap untuk deploy aplikasi JASPEL KPI System ke Vercel dengan optimasi maksimal.

## 📋 Persiapan Sebelum Deploy

### 1. Verifikasi Sistem
```bash
# Jalankan script verifikasi
npm run verify:deployment
```

### 2. Optimasi Build
```bash
# Jalankan optimasi build
npm run build:optimize
```

### 3. Test Build Lokal
```bash
# Test build production
npm run build
npm run start:prod
```

## 🔧 Konfigurasi Environment Variables

Pastikan environment variables berikut sudah diset di Vercel Dashboard:

### Required Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### Optional Variables
```env
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## 📦 Deployment Steps

### 1. Persiapan Repository
```bash
# Commit semua perubahan
git add .
git commit -m "feat: optimize for vercel deployment"
git push origin main
```

### 2. Setup Vercel Project
1. Login ke [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import repository dari GitHub
4. Pilih framework: **Next.js**
5. Set build command: `npm run build`
6. Set output directory: `.next`

### 3. Configure Build Settings
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm ci"
}
```

### 4. Set Environment Variables
Di Vercel Dashboard → Settings → Environment Variables:
- Add semua variables dari `.env.local.example`
- Set untuk Production, Preview, dan Development

### 5. Deploy
```bash
# Deploy otomatis setelah push ke main branch
git push origin main
```

## ⚡ Optimasi yang Sudah Diterapkan

### Next.js Optimizations
- ✅ Standalone output untuk Vercel
- ✅ Compression enabled
- ✅ Bundle splitting optimized
- ✅ Static asset optimization
- ✅ Image optimization disabled (Vercel free tier)

### Performance Optimizations
- ✅ Lazy loading components
- ✅ Database query optimization
- ✅ Middleware caching (LRU Cache)
- ✅ API response caching
- ✅ Bundle size optimization

### Security Headers
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ X-XSS-Protection: 1; mode=block

### Vercel-Specific Optimizations
- ✅ Function timeout optimization (10s default, 30s for reports)
- ✅ Static asset caching (1 year)
- ✅ API response caching (5 minutes)
- ✅ Singapore region (sin1) for better latency

## 🔍 Monitoring & Debugging

### Performance Monitoring
```bash
# Analyze bundle size
npm run build:analyze
```

### Check Deployment Status
1. Vercel Dashboard → Deployments
2. Check build logs untuk errors
3. Monitor function execution times
4. Check Core Web Vitals

### Common Issues & Solutions

#### Build Errors
```bash
# Clear cache dan rebuild
rm -rf .next node_modules
npm install
npm run build
```

#### Environment Variable Issues
- Pastikan semua variables ada di Vercel Dashboard
- Check case sensitivity (NEXT_PUBLIC_SUPABASE_URL vs next_public_supabase_url)
- Restart deployment setelah update env vars

#### Database Connection Issues
- Verify Supabase URL dan keys
- Check RLS policies
- Ensure database is accessible from Vercel IPs

#### Function Timeout Issues
- Check `vercel.json` function timeouts
- Optimize database queries
- Use caching untuk expensive operations

## 📊 Performance Targets

### Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### Bundle Size Targets
- **Total Bundle**: < 500KB gzipped
- **First Load JS**: < 200KB
- **Static Assets**: < 50MB total

### Function Performance
- **API Routes**: < 1s response time
- **Dashboard Queries**: < 2s
- **Report Generation**: < 30s

## 🛠️ Troubleshooting

### Deployment Fails
1. Check build logs di Vercel Dashboard
2. Verify `package.json` scripts
3. Ensure all dependencies are in `dependencies` (not `devDependencies`)
4. Check Node.js version compatibility

### Runtime Errors
1. Check function logs di Vercel Dashboard
2. Verify environment variables
3. Test database connectivity
4. Check middleware configuration

### Performance Issues
1. Use Vercel Analytics untuk monitoring
2. Check bundle analyzer report
3. Monitor database query performance
4. Optimize images dan static assets

## 📞 Support

Jika mengalami masalah deployment:

1. **Check Documentation**: Baca error message dengan teliti
2. **Vercel Logs**: Check deployment dan function logs
3. **Database Logs**: Check Supabase logs
4. **Local Testing**: Test build lokal terlebih dahulu

## 🎯 Post-Deployment Checklist

- [ ] Verify semua pages load correctly
- [ ] Test login/logout functionality
- [ ] Check dashboard data loading
- [ ] Verify API endpoints
- [ ] Test file uploads (if any)
- [ ] Check mobile responsiveness
- [ ] Monitor performance metrics
- [ ] Setup error tracking (optional)

---

**🎉 Selamat! Aplikasi JASPEL KPI System sudah siap production di Vercel!**