# 🚀 Deployment Guide for Tex Recruiter

This guide will help you deploy your Tex Recruiter application to various platforms.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Supabase Project**: Set up your Supabase database
2. **Environment Variables**: Configure your environment variables
3. **Git Repository**: Push your code to GitHub/GitLab
4. **Domain** (optional): For custom domain setup

## 🔧 Environment Setup

1. **Copy environment variables**:
   ```bash
   cp .env.example .env.local
   ```

2. **Fill in your Supabase credentials**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-domain.com/api
   ```

3. **Test locally**:
   ```bash
   npm run build
   npm start
   ```

## 🌟 Option 1: Vercel (Recommended)

Vercel is the easiest option for Next.js applications:

### Quick Deploy
1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy from terminal**:
   ```bash
   vercel
   ```

3. **Follow the prompts**:
   - Link to existing project or create new
   - Set build settings (auto-detected for Next.js)
   - Configure environment variables

### GitHub Integration
1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Configure environment variables in dashboard
   - Deploy automatically

### Environment Variables in Vercel
Add these in your Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`

## 🐳 Option 2: Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  tex-recruiter:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    restart: unless-stopped
```

## ☁️ Option 3: Railway

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**:
   ```bash
   railway login
   railway init
   railway up
   ```

3. **Set environment variables**:
   ```bash
   railway variables set NEXT_PUBLIC_SUPABASE_URL=your-url
   railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
   ```

## 🌊 Option 4: Netlify

1. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Deploy**:
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=.next
   ```

## 🔵 Option 5: DigitalOcean App Platform

1. **Create app.yaml**:
   ```yaml
   name: tex-recruiter
   services:
   - name: web
     source_dir: /
     github:
       repo: your-username/tex-recruiter
       branch: main
     run_command: npm start
     build_command: npm run build
     environment_slug: node-js
     instance_count: 1
     instance_size_slug: basic-xxs
     envs:
     - key: NEXT_PUBLIC_SUPABASE_URL
       value: ${NEXT_PUBLIC_SUPABASE_URL}
     - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
       value: ${NEXT_PUBLIC_SUPABASE_ANON_KEY}
   ```

## 🗄️ Database Setup (Supabase)

1. **Run the SQL schema**:
   ```sql
   -- Execute the contents of supabase-schema.sql in your Supabase SQL editor
   ```

2. **Enable Row Level Security**:
   - All tables should have RLS enabled
   - Policies are included in the schema

3. **Set up authentication**:
   - Configure OAuth providers if needed
   - Set up email templates
   - Configure redirect URLs

## 🌐 Custom Domain Setup

### Vercel
1. Go to your project dashboard
2. Click "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### Cloudflare (Optional)
- Set up Cloudflare for CDN and security
- Configure SSL certificates
- Set up redirects if needed

## 🔒 Security Checklist

- [ ] Environment variables are not committed to Git
- [ ] Supabase RLS policies are enabled
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] API routes are secured
- [ ] Error messages don't expose sensitive information

## 📊 Performance Optimization

1. **Image Optimization**:
   ```typescript
   // next.config.ts
   const nextConfig = {
     images: {
       domains: ['your-cdn-domain.com'],
       formats: ['image/webp', 'image/avif'],
     },
   }
   ```

2. **Bundle Analysis**:
   ```bash
   npm install --save-dev @next/bundle-analyzer
   npm run build
   npm run analyze
   ```

## 🔍 Monitoring & Analytics

1. **Vercel Analytics**:
   ```bash
   npm install @vercel/analytics
   ```

2. **Error Tracking**:
   - Sentry
   - LogRocket
   - Bugsnag

## 🚀 Quick Start Commands

```bash
# Clone and setup
git clone your-repo
cd tex-recruiter
npm install
cp .env.example .env.local
# Edit .env.local with your values

# Test build
npm run build
npm start

# Deploy to Vercel
vercel --prod

# Deploy with Docker
docker build -t tex-recruiter .
docker run -p 3000:3000 tex-recruiter
```

## 🆘 Troubleshooting

### Common Issues:

1. **Build Errors**:
   - Check TypeScript errors: `npm run lint`
   - Verify all dependencies: `npm install`

2. **Environment Variables**:
   - Ensure all variables are set in deployment platform
   - Check variable names match exactly

3. **Supabase Connection**:
   - Verify URL and keys are correct
   - Check if database is accessible

4. **Routing Issues**:
   - Ensure all dynamic routes are properly configured
   - Check file structure matches routing

## 📞 Support

If you encounter issues:
1. Check the deployment platform's logs
2. Verify environment variables
3. Test locally with production build
4. Check Supabase connection and policies

---

**Happy Deploying! 🎉**