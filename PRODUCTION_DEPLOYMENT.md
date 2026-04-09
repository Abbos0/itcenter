# 🚀 Production Deployment Guide

## Step 1: Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Fill in project details:
   - Name: `itcenter-exam-system`
   - Database Password: Choose a strong password
   - Region: Select closest to your users

### 1.2 Get API Keys
1. Go to Settings → API
2. Copy:
   - Project URL: `https://your-project-id.supabase.co`
   - Anon/Public Key: `your-anon-key`

### 1.3 Setup Database Schema
1. Go to SQL Editor in Supabase Dashboard
2. Copy and paste the contents of `database-schema.sql`
3. Click "Run" to create the table and policies

## Step 2: Backend Deployment (Render)

### 2.1 Deploy to Render
1. Go to [render.com](https://render.com) (you mentioned you're registered)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - Name: `itcenter-backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: `Production`

### 2.2 Set Environment Variables in Render
Go to your Render service settings and add:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NODE_ENV=production
```

### 2.3 Get Backend URL
After deployment, copy the URL: `https://itcenter-puso.onrender.com`

## Step 3: Frontend Deployment (Vercel)

### 3.1 Deploy to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login
3. Click "New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: `Create React App`
   - Root Directory: `frontend`

### 3.2 Set Environment Variables in Vercel
Add these environment variables:
```
REACT_APP_SUPABASE_URL=https://mjbhddbyapjkojgdqygb.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_LIVE_BACKEND_URL=https://itcenter-puso.onrender.com
```

### 3.3 Deploy
Click "Deploy" and wait for completion.

## Step 4: Update Environment Files

### 4.1 Frontend .env
Update `frontend/.env`:
```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-supabase-anon-key
REACT_APP_LIVE_BACKEND_URL=https://your-render-app.onrender.com
```

### 4.2 Backend .env
Update `backend/.env`:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
PORT=10000
NODE_ENV=production
```

## Step 5: Update Vercel Configuration

Update `vercel.json` with your actual Render URL:
```json
{
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "https://your-render-app.onrender.com/api/$1"
    },
    {
      "src": "/socket.io/(.*)",
      "dest": "https://your-render-app.onrender.com/socket.io/$1"
    }
  ]
}
```

## Step 6: Test Production Deployment

1. **Frontend:** `https://itcenter-1.vercel.app`
2. **Admin Panel:** `https://itcenter-1.vercel.app/?admin=1`
3. **Backend:** `https://itcenter-puso.onrender.com`

## Step 7: Security & Admin Setup

### 7.1 Change Admin Credentials
In production, update admin credentials in `frontend/src/AdminPanelView.js`:
```javascript
const defaultCredentials = {
  login: 'your-admin-login',
  password: 'your-secure-password',
  phone: '+998-your-phone'
};
```

### 7.2 HTTPS Verification
- Render automatically provides HTTPS
- Vercel automatically provides HTTPS
- Supabase uses HTTPS by default

## Step 8: Domain Setup (Optional)

### Custom Domain for Frontend
1. In Vercel dashboard, go to your project settings
2. Add your custom domain
3. Update DNS records as instructed

### Custom Domain for Backend
1. In Render dashboard, go to your service settings
2. Add custom domain
3. Update DNS records

## Troubleshooting

### Common Issues:
1. **CORS Errors:** Check that backend allows your frontend domain
2. **Socket.IO Connection:** Verify backend URL in environment variables
3. **Database Connection:** Check Supabase credentials
4. **Admin Not Working:** Clear browser cache and check credentials

### Logs:
- **Render:** Check service logs in Render dashboard
- **Vercel:** Check deployment logs in Vercel dashboard
- **Supabase:** Check database logs in Supabase dashboard

## Final Checklist

- ✅ Supabase project created
- ✅ Database schema applied
- ✅ Backend deployed to Render
- ✅ Frontend deployed to Vercel
- ✅ Environment variables configured
- ✅ Admin credentials updated
- ✅ HTTPS enabled
- ✅ Testing completed

**Your production app URLs:**
- Frontend: `https://your-vercel-app.vercel.app`
- Admin: `https://your-vercel-app.vercel.app/?admin=1`
- Backend: `https://your-render-app.onrender.com`