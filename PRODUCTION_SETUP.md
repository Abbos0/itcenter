# Production Setup Guide

## 1. Supabase Production Database
**Current Status:** Demo database ishlatilayotgan
**Kerakli:** Production Supabase project yaratish

### Qilish kerak:
1. [supabase.com](https://supabase.com) ga boring
2. New Project yarating
3. Database URL va API keys oling
4. Environment variables qo'shing

## 2. Environment Variables
Frontend uchun `.env` fayl yarating:

```bash
# .env fayl (frontend papkasida)
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_LIVE_BACKEND_URL=https://your-backend-server.com
```

Backend uchun environment variables:
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
PORT=4000
```

## 3. Server Hosting
**Kerakli serverlar:**
- **Backend Server:** Node.js (Express + Socket.IO)
- **Frontend:** Static hosting (Vercel, Netlify, yoki boshqa)
- **Database:** Supabase (PostgreSQL)

### Tavsiya etilgan hosting:
- **Backend:** Railway, Render, Heroku, yoki VPS
- **Frontend:** Vercel yoki Netlify
- **Database:** Supabase (free tier yetarli)

## 4. Database Schema
Supabase'da `exam_sessions` table yarating:

```sql
CREATE TABLE exam_sessions (
  id SERIAL PRIMARY KEY,
  identity TEXT UNIQUE NOT NULL,
  name TEXT,
  surname TEXT,
  phone TEXT,
  status TEXT DEFAULT 'login',
  score INTEGER,
  total_questions INTEGER,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  finished_at TIMESTAMP
);

-- RLS (Row Level Security) yoqing
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Public read/write policies
CREATE POLICY "Allow all operations" ON exam_sessions FOR ALL USING (true);
```

## 5. Production Deployment
1. Backend deploy qiling
2. Frontend environment variables o'rnating
3. Frontend deploy qiling
4. Domain ulang (ixtiyoriy)

## 6. Admin Credentials
Production uchun admin credentials o'zgartiring:
- Default: login: `admin`, password: `admin123`
- Telefon: `+998901234567`

## 7. Security
- HTTPS majburiy
- API keys himoyalash
- Rate limiting qo'shish
- Authentication yaxshilash

---

**Hozircha demo serverlar ishlaydi, lekin production uchun yuqoridagi o'zgarishlarni qilish kerak.**