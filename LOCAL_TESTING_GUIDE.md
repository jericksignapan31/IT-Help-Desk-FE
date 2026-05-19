# 🚀 Local PWA Testing Guide

## Quick Start

### Option 1: Using the provided scripts (Easiest)

**Windows:**
```bash
.\serve-pwa.bat
```

**Mac/Linux:**
```bash
bash serve-pwa.sh
```

Then visit: `http://localhost:8080`

---

### Option 2: Manual setup (if scripts don't work)

#### Step 1: Build the app
```bash
npm run build
```

#### Step 2: Install http-server globally
```bash
npm install -g http-server
```

#### Step 3: Serve with SPA routing (IMPORTANT!)

**Windows Command Prompt:**
```bash
cd dist\ithelp-desk-fe\browser\
http-server . -p 8080 -c-1 --spa index.html
```

**PowerShell:**
```bash
cd dist/ithelp-desk-fe/browser/
npx http-server . -p 8080 -c-1 --spa index.html
```

**Mac/Linux:**
```bash
cd dist/ithelp-desk-fe/browser/
npx http-server . -p 8080 -c-1 --spa index.html
```

#### Step 4: Open in browser
Visit: `http://localhost:8080`

---

## 🧪 Testing PWA Features

### 1. **Test Service Worker Registration**
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in the sidebar
4. You should see "service-worker.js" with status "activated and running"

### 2. **Test Install Prompt**
1. In browser address bar, look for **⬇️ Install** button
2. Or right-click app icon in address bar → "Install app"
3. Follow browser's install flow

### 3. **Test Offline Mode** ⭐
1. Open DevTools (F12)
2. Go to **Application** tab
3. Click **Service Workers** in sidebar
4. ✅ Check the **Offline** checkbox
5. Refresh the page (Ctrl+R or Cmd+R)
6. **App should still work!** Navigate around, it should use cached data

### 4. **Test Caching**
1. In DevTools, go to **Application** → **Cache Storage**
2. Should see caches like:
   - `ithelp-desk-v1.0.0` (app shell)
   - `ithelp-desk-runtime-v1.0.0` (runtime cache)
   - `ithelp-desk-api-v1.0.0` (API cache)
3. Expand to see cached files

### 5. **Test SPA Routing**
1. In the app, navigate to different pages (/dashboard, /assets, /tickets, etc.)
2. Hard refresh (Ctrl+Shift+R)
3. The route should work even after refresh
4. This proves SPA routing is working correctly

---

## 🔍 Troubleshooting

### Issue: "Cannot GET /login"
**Solution:** You're not using SPA routing. Make sure you're using `--spa index.html` flag:
```bash
npx http-server . -p 8080 -c-1 --spa index.html
```

### Issue: Service Worker not registering
**Solution:** 
1. Check DevTools console for errors
2. Verify service-worker.js exists in dist folder
3. Try clearing browser cache: DevTools → Application → Storage → Clear site data
4. Reload page

### Issue: Service Worker shows "redundant"
**Solution:**
1. Go to Application → Service Workers
2. Click **Unregister** on any old workers
3. Refresh page
4. Reload the page to register fresh

### Issue: Offline mode not working
**Solution:**
1. Service worker might not be fully active yet
2. Wait a few seconds after page load
3. Check DevTools console for any errors
4. Try re-registering: clear cache and reload

### Issue: Assets not loading (404 errors)
**Solution:**
1. Make sure you built first: `npm run build`
2. Verify dist folder has files: `ls dist/ithelp-desk-fe/browser/`
3. Check current directory is correct before running http-server

---

## 📊 What to Look For

### When Testing Offline ✅
- [ ] Pages load without internet
- [ ] Navigation works between routes
- [ ] Dashboard shows cached data
- [ ] Forms don't crash (graceful degradation)
- [ ] Offline indicator appears in UI

### When Testing Online 🌐
- [ ] App loads quickly (from cache)
- [ ] New data fetches from API
- [ ] Updates appear automatically
- [ ] No 404 errors for routes

---

## 📝 Common Commands

```bash
# Build and serve
npm run build && npx http-server dist/ithelp-desk-fe/browser/ -p 8080 -c-1 --spa index.html

# Just build
npm run build

# Clear service worker cache (in DevTools console)
caches.keys().then(names => Promise.all(names.map(name => caches.delete(name))))

# Check registered SW
navigator.serviceWorker.getRegistrations()
```

---

## 🎯 Success Checklist

After following this guide, you should have:

- ✅ PWA running on http://localhost:8080
- ✅ Service Worker registered and active
- ✅ SPA routing working (no 404s)
- ✅ Offline mode working (pages load without internet)
- ✅ Install prompt available in browser
- ✅ Caching visible in DevTools
- ✅ Offline indicator showing in app UI

---

## 🚀 Next: Deploy to Production

Once testing is complete:

```bash
# Build one final time
npm run build

# Deploy dist/ithelp-desk-fe/browser/ to:
# - Vercel ⭐
# - Netlify
# - Firebase Hosting
# - AWS Amplify
# - Your own server
```

**Important:** Production must use HTTPS for service workers to work!

---

*Happy testing! 🎉*
