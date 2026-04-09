# ITCenter - Project Setup Guide

## ✅ Project Reorganization Complete

Your ITCenter project has been restructured into a clean, organized layout with **frontend** and **backend** separation.

---

## 📁 Current Project Structure

```
itcenter/
├── frontend/                          # All frontend React code
│   ├── src/                           # Main app source code
│   │   ├── App.js, App.css
│   │   ├── Exam.js, Exam.css          # Exam interface
│   │   ├── Face.js, Face.css          # Face recognition
│   │   ├── Login.js, Login.css        # Authentication
│   │   ├── Phone.js, Phone.css        # Phone component
│   │   ├── Instructions.js, Instructions.css
│   │   ├── AdminPanelView.js, AdminPanelView.css
│   │   ├── supabaseApi.js             # Database API
│   │   ├── liveBackend.js             # Backend integration
│   │   ├── index.js, index.css        # Entry point
│   │   └── setupTests.js, App.test.js
│   │
│   ├── public/                        # Static assets
│   │   ├── index.html
│   │   ├── manifest.json
│   │   ├── robots.txt
│   │   └── logos/icons
│   │
│   ├── admin/                         # Admin panel (React app)
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   │
│   ├── package.json                   # Frontend dependencies
│   └── node_modules/                  # Frontend packages
│
├── backend/                           # Node.js Express server
│   ├── server.js                      # Express server entry point
│   ├── package.json                   # Backend dependencies
│   ├── package-lock.json
│   └── node_modules/                  # Backend packages
│
├── .gitignore
├── package.json                       # Root config (project management)
├── README.md                          # Project documentation
├── vercel.json                        # Deployment config
└── SETUP_GUIDE.md                     # This file
```

---

## 🚀 Quick Start

### 1. Install All Dependencies
```bash
npm run install-all
```

### 2. Run Development Environment
```bash
npm run dev
```

This will start both frontend and backend servers concurrently.

### 3. Production Endpoints
- Frontend: `https://itcenter-1.vercel.app/`
- Backend: `https://itcenter-puso.onrender.com/`
- Admin panel: `https://itcenter-1.vercel.app/?admin=1`

---

## 📦 Available Commands

### From Root Directory:

| Command | Purpose |
|---------|---------|
| `npm run install-all` | Install dependencies for frontend and backend |
| `npm run dev` | Run frontend + backend together |
| `npm run frontend` | Run frontend only (port 3000) |
| `npm run backend` | Run backend only |
| `npm run build-frontend` | Build frontend for production |
| `npm run build-backend` | Build backend (N/A for node server) |
| `npm run build` | Build frontend |

### From `frontend/` Directory:

```bash
cd frontend
npm start        # Start React dev server
npm build        # Build for production
npm test         # Run tests
```

### From `backend/` Directory:

```bash
cd backend
npm start        # Start Express server
npm run dev      # Run with node
```

---

## 📝 What's Included

### Frontend (`/frontend`)
✅ React 19 main app
✅ Admin dashboard (separate app in `/frontend/admin`)
✅ All components:
  - Login/Authentication
  - Exam interface
  - Face recognition proctoring
  - Instructions & Phone components
✅ Supabase database integration
✅ Real-time WebSocket communication
✅ React Router navigation
✅ Responsive CSS styles

### Backend (`/backend`)
✅ Express.js server
✅ WebSocket support (Socket.IO)
✅ CORS enabled
✅ RESTful API endpoints
✅ Real-time communication

---

## 🔧 Configuration Files

- **`package.json`** (root): Manages both frontend and backend
- **`frontend/package.json`**: Frontend dependencies (React, Axios, etc.)
- **`backend/package.json`**: Backend dependencies (Express, Socket.IO, CORS)
- **`vercel.json`**: Deployment configuration
- **`.gitignore`**: Git ignore rules (excludes node_modules, build, etc.)

---

## 🌐 How Components Communicate

```
Browser (Frontend on localhost:3000)
    ↓
React Components
    ↓
API Calls (axios) → Express API (localhost:3001 or custom)
WebSocket (Socket.IO) → Express Server Real-time
    ↓
Backend Server
    ↓
Database (Supabase PostgreSQL)
```

---

## 📋 Next Steps

1. **Install dependencies**: `npm run install-all`
2. **Start development**: `npm run dev`
3. **Edit code**:
   - Frontend code: Edit files in `/frontend/src/`
   - Admin panel: Edit files in `/frontend/admin/src/`
   - Backend code: Edit `/backend/server.js`
4. **Build for production**: `npm run build`

---

## ✨ Key Features

- ✅ Clean folder organization
- ✅ Separate frontend and backend
- ✅ Admin panel integrated in frontend
- ✅ Scalable structure
- ✅ Easy to maintain and deploy
- ✅ Only necessary files included

---

## 📞 Troubleshooting

**Port already in use?**
- Change port in `/frontend/package.json`. React default is 3000
- Change port in `/backend/server.js` (Express)

**Dependencies not installing?**
- Delete `package-lock.json` files
- Run `npm cache clean --force`
- Try again: `npm run install-all`

**Admin panel not working?**
- Ensure both frontend and backend are running
- Check WebSocket connection in browser console
- Verify API endpoints in `/frontend/admin/src/`

---

## 📌 Notes

- The admin panel is now inside `/frontend/admin` (not at root level)
- All old, unnecessary files have been removed
- Backend and frontend have separate dependencies
- You can run them independently or together
- Admin panel can access main app APIs via configured backend URLs

---

**Project ready for development!** 🎉
