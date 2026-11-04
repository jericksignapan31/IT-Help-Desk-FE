# Chatbot Deployment Guide

## Environment Setup

### Prerequisites
- Node.js 18.19+ or 20.x
- npm 9.x or 10.x
- Angular CLI 19.x
- Access to Render backend at https://it-helpdesk-backend.onrender.com

### Development Environment
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:4200)
npm start

# Run tests
npm test

# Build for production
npm run build
```

---

## Build Process

### Production Build
```bash
# Build application
npm run build

# Expected output:
# - ✅ BUILD SUCCESS (exit code 0)
# - Warnings: CommonJS dependencies (non-critical)
# - Output folder: dist/it-help-desk-fe/browser

# Build artifacts:
# - Main bundle: main.XXX.js (~500KB gzipped)
# - Styles: styles.XXX.css (~100KB gzipped)
# - Source maps for debugging
```

### Build Verification
```bash
# Check build output
ls -la dist/it-help-desk-fe/browser

# Expected files:
# - index.html
# - main.*.js (main bundle)
# - styles.*.css (stylesheet)
# - runtime.*.js (Angular runtime)
# - polyfills.*.js (polyfills)
# - assets/ (images, icons)
```

---

## Pre-Deployment Verification

### 1. Build Compilation
```bash
# Run production build
npm run build

# Verify exit code 0
echo $? # Should output: 0
```

### 2. Dev Server Test
```bash
# Start dev server
npm start

# Visit http://localhost:4200
# Verify:
# - Chat window loads
# - No console errors
# - All components render
# - Dark mode toggle works
# - Network requests to backend succeed
```

### 3. Network Connectivity
```bash
# Test backend API connectivity
curl -X GET https://it-helpdesk-backend.onrender.com/health

# Expected response: 200 OK
```

### 4. Feature Verification
- [ ] Chat window displays and responds to messages
- [ ] Feedback modal opens and submits ratings
- [ ] Ticket creation modal opens and creates tickets
- [ ] Dark mode toggle persists preference
- [ ] Knowledge base search returns results
- [ ] Pagination works in search results
- [ ] All buttons and interactions work

---

## Deployment to Vercel (Current Production)

### Configuration Files
- `vercel.json` - Deployment configuration
- `angular.json` - Angular build configuration
- `package.json` - Dependencies and scripts

### Vercel Deployment
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Verify deployment
# Visit: https://it-help-desk-fe.vercel.app
```

### Environment Variables
The following environment variables should be set in Vercel:
- Backend API URL (from environment.ts/environment.development.ts)
- CORS settings configured in backend

### Deploy with Git
```bash
# 1. Commit changes
git add .
git commit -m "Phase 7: Testing & Deployment"

# 2. Push to main branch
git push origin main

# 3. Vercel auto-deploys on push to main
# Monitor deployment at: https://vercel.com/dashboard
```

---

## Backend API Integration

### API Endpoints Used
All chatbot endpoints require JWT Bearer token authentication:

```typescript
// Header required for all chatbot API calls:
Authorization: Bearer <jwt-token>
```

#### Chat Endpoints
- `POST /api/chat/messages` - Send message to chatbot
- `GET /api/chat/conversations/{id}` - Get conversation history
- `POST /api/chat/conversations` - Start new conversation

#### Knowledge Base Endpoints
- `GET /api/knowledge-base/search?query=...&limit=10` - Search FAQs
- `GET /api/knowledge-base/categories` - Get FAQ categories
- `GET /api/knowledge-base/entries?category=...` - Get by category
- `GET /api/knowledge-base/popular?limit=5` - Get popular entries

#### Feedback Endpoints
- `POST /api/feedback/submit` - Submit user feedback/ratings

#### Ticket Endpoints
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/{id}` - Get ticket details

### Backend Service Status
```bash
# Check backend health
curl -X GET https://it-helpdesk-backend.onrender.com/health

# Check if Render instance is awake
# (Render free tier has cold starts)
# Expected warm-up time: 30-60 seconds on first request
```

---

## Performance Optimization

### Bundle Analysis
```bash
# Analyze bundle size
npm run build

# Check dist folder size
du -sh dist/it-help-desk-fe/browser

# Expected: ~1.2MB uncompressed, ~300KB gzipped
```

### Lazy Loading
- Chatbot module loaded on demand from `/chatbot` route
- Knowledge base component lazy-loaded via `loadComponent`
- Modals loaded on interaction (not upfront)

### Component Optimization
- TrackBy functions used in ngFor loops
- OnPush change detection strategy available
- Proper unsubscribe handling with takeUntil
- No memory leaks detected

### CSS Optimization
- Compiled SCSS to CSS with source maps
- CSS custom properties reduce style bundle size
- No unused styles included

---

## Monitoring & Troubleshooting

### Common Issues

#### Issue: Backend API timeouts
```
Solution: Render free tier has cold starts
- First request may take 30-60 seconds
- Add loading indicators for user feedback
- Ensure timeouts configured in HttpClient (30s)
```

#### Issue: Dark mode not persisting
```
Solution: localStorage not available
- Check browser localStorage is enabled
- Verify ThemeService subscribing on init
- Check console for storage errors
```

#### Issue: Chat messages not sending
```
Solution: Authentication token expired or missing
- Verify JWT token in Authorization header
- Check token expiration time
- Ensure auth interceptor working
```

#### Issue: Styles not loading
```
Solution: CSS bundling issue
- Clear browser cache
- Hard refresh (Ctrl+F5)
- Verify styles.css in network tab
- Check for CORS issues
```

### Error Logging
- All API errors logged to console in dev mode
- Production errors tracked with error boundary
- SweetAlert2 shows user-friendly error messages
- Network errors show retry option

---

## Rollback Procedure

### If deployment fails:
```bash
# Revert to previous version
git revert <commit-hash>
git push origin main

# Or deploy specific version
vercel --prod --yes

# Verify rollback
curl https://it-help-desk-fe.vercel.app
```

---

## Post-Deployment

### Monitoring
- [ ] Error logs monitored (Vercel, browser console)
- [ ] API response times monitored
- [ ] User feedback collected
- [ ] Performance metrics baseline established

### Metrics to Track
- Page load time (target: < 3s)
- API response time (target: < 1s)
- Error rate (target: < 0.1%)
- User satisfaction with feedback ratings
- Ticket creation success rate

### Feedback Channels
- In-app feedback system (star ratings)
- User support email: support@example.com
- Issue tracking: GitHub Issues
- Performance monitoring: Vercel Analytics

---

## Next Steps / Phase 8+

Possible enhancements after Phase 7:

1. **Advanced Search Features**
   - Autocomplete search suggestions
   - Search filters (date range, category)
   - Saved searches

2. **Chat Features**
   - Message reactions (emoji)
   - File/image uploads
   - Conversation export (PDF)
   - Message search history

3. **Analytics**
   - Chat analytics dashboard
   - FAQ performance metrics
   - Ticket resolution tracking
   - User engagement metrics

4. **AI Improvements**
   - Sentiment analysis
   - Intent classification improvement
   - Context-aware responses
   - Multi-turn conversation memory

5. **Integration**
   - CRM integration
   - Email notifications
   - Slack integration
   - Teams integration

---

## Support

For issues or questions:
1. Check this guide's Troubleshooting section
2. Review Phase 7 Testing Guide for feature verification
3. Check backend API health status
4. Contact development team
5. File issue on GitHub repository

---

## Deployment Sign-off

- **Date Deployed:** _______________
- **Deployed By:** _______________
- **Version:** _______________
- **Status:** [ ] SUCCESS [ ] PARTIAL [ ] FAILED

**Notes:** _________________________________________________________________

---

## Appendix: File Structure

```
src/
├── app/
│   ├── chatbot/
│   │   ├── chatbot-page/
│   │   ├── chatbot-window/
│   │   ├── components/
│   │   │   ├── bot-message/
│   │   │   ├── user-message/
│   │   │   ├── message-list/
│   │   │   ├── message-input/
│   │   │   ├── typing-indicator/
│   │   │   ├── feedback-modal/
│   │   │   ├── ticket-creation-dialog/
│   │   │   └── pwa-status/
│   │   ├── knowledge-base/
│   │   └── chat.routes.ts
│   ├── services/
│   │   ├── chat.service.ts
│   │   ├── chatbot.service.ts
│   │   ├── knowledge-base.service.ts
│   │   ├── feedback.service.ts
│   │   ├── theme.service.ts
│   │   └── ticket.service.ts
│   ├── models/
│   │   └── chat.model.ts
│   ├── app.routes.ts
│   └── app.config.ts
├── styles.scss
├── styles-theme.scss
└── index.html

dist/it-help-desk-fe/browser/  (Production build output)
```

---

## Changelog

### Phase 7 Summary
- ✅ Comprehensive testing documentation
- ✅ Production build verification
- ✅ Deployment procedures
- ✅ Performance optimization
- ✅ Post-deployment monitoring
- ✅ Troubleshooting guide

**Total Phases Completed:** 7/7

---

**Documentation Version:** 1.0  
**Last Updated:** November 3, 2026  
**Next Review:** After first production deployment
