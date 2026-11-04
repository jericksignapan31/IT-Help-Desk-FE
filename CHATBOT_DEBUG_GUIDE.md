/**
 * Debugging Console Commands for IT Help Desk Chatbot
 * 
 * Usage: Copy and paste any command into the browser console (F12 → Console tab)
 * 
 * Examples:
 * - debug.info()
 * - debug.testConnectivity()
 * - debug.showAll()
 */

// ============================================================================
// CURRENT ISSUES AND FIXES APPLIED
// ============================================================================

/*
ISSUE 1: Service Worker Response Cloning Error
- Error: "Failed to execute 'clone' on 'Response': Response body is already used"
- Status: ✅ FIXED in public/service-worker.js and src/service-worker.ts
- Fix: Rewrote networkThenCache function to properly clone responses
- Next: The fix will take effect after:
  1. Rebuild: npm run build ✅ (already done)
  2. Clear cache: Ctrl+Shift+Delete → Cache → Clear
  3. Refresh page: Ctrl+R or Cmd+R
  4. Check console: Should NOT see "clone" errors

ISSUE 2: Chat Conversations 400 Bad Request
- Error: POST /chat/conversations returns 400
- Status: ✅ FIXED in src/app/services/chat.service.ts
- Fix: Changed payload from complex object to empty {}
- Root Cause: Backend expected different format than what was sent
- Testing: After deploying, try opening chatbot and check console for success

ISSUE 3: Socket.io Token Not Available
- Error: "[ChatInit] No auth token found, skipping Socket.io initialization"
- Status: ✅ IMPROVED with retry logic in src/app/chat/services/chat-init.service.ts
- Fix: Now retries every 1 second if token not immediately available
- Also: Checks both 'access_token' and 'token' keys in localStorage
- Result: Socket.io will eventually initialize after login token is set

ISSUE 4: Chatbot Stats Wrong Interface Fields
- Error: Console shows old fields (knowledgeBaseSize, resolvedSolutions)
- Status: ✅ FIXED in src/app/services/chatbot.service.ts
- Fix: Updated default stats to match new ChatbotStats interface
- New fields: totalKBEntries, totalTicketsCreated, avgResolutionTime, userSatisfaction
- Testing: After deploying, check console for correct stats object

ISSUE 5: Angular Hydration Warning NG0505
- Error: "Angular hydration was requested on the client, but no serialized info..."
- Status: ℹ️ NORMAL (informational, not critical)
- Reason: This is a CSR (Client-Side Rendering) app, not SSR
- Already Fixed: app.config.ts has provideClientHydration(withEventReplay())
- Action: Safe to ignore - warning won't affect functionality
*/

// ============================================================================
// BROWSER CONSOLE DEBUG COMMANDS
// ============================================================================

// 1. VIEW CURRENT DEBUG INFO
//    Shows: Environment, API URL, auth status, PWA status, last API call
window.debug?.info?.()

// 2. VIEW API CALL HISTORY
//    Shows: Last 50 API calls with timestamps and status codes
window.debug?.history?.()

// 3. TEST BACKEND CONNECTIVITY
//    Tests: /chat/conversations, /chat/chatbot/stats, /api/employees, /api/assets
//    Returns: { reachable: boolean, endpoints: {...} }
await window.debug?.testConnectivity?.()

// 4. TEST SERVICE WORKER
//    Shows: Is SW active, registration status
window.debug?.testSW?.()

// 5. SHOW ALL DEBUG INFO IN TABLE
//    Combined view of all debug information
window.debug?.showAll?.()

// 6. CLEAR API CALL HISTORY
window.debug?.clearHistory?.()

// ============================================================================
// MANUAL TESTING CHECKLIST
// ============================================================================

/*
After deploying the fixed build, test these scenarios:

[ ] 1. CLEAR BROWSER CACHE
     - Open DevTools (F12)
     - Application → Service Workers → Unregister
     - Clear Cache Storage
     - Hard refresh (Ctrl+Shift+R)

[ ] 2. CHECK SERVICE WORKER FIX
     - Open DevTools Console
     - Look for "Failed to execute 'clone'" error
     - Should NOT appear anymore
     - Look for "✓ Service Worker registered" message

[ ] 3. TEST CHATBOT INITIALIZATION
     - Click floating chat button (bottom right)
     - Check console for: "🔄 Initializing chatbot conversation..."
     - Should NOT see 400 error on /chat/conversations
     - Should see "✅ Conversation started: [ID]"

[ ] 4. TEST QUICK REPLY BUTTONS
     - In chatbot window, click a quick reply suggestion
     - Message should send and bot should respond
     - Check console for: "✅ POST /chat/chatbot/message [status]"

[ ] 5. TEST VOICE INPUT
     - Click microphone button in chatbot
     - Allow microphone permission
     - Speak a test message
     - Voice should convert to text and send automatically

[ ] 6. TEST API CONNECTIVITY
     - Open DevTools Console
     - Run: await debug.testConnectivity()
     - All endpoints should show: reachable: true
     - Report any failed endpoints for backend investigation

[ ] 7. TEST SOCKET.IO CONNECTION
     - Open DevTools Console
     - Check for: "[ChatInit] Initializing Socket.io connection"
     - Should connect within 1-2 seconds after page load
     - No repeated "No auth token found" errors after login

[ ] 8. MONITOR PERFORMANCE
     - Open DevTools → Performance tab
     - Take a recording while using chatbot
     - Look for excessive "fetch" calls or "clone" errors
     - Service worker should cache non-chat API responses
*/

// ============================================================================
// EXPECTED CONSOLE OUTPUT AFTER FIXES
// ============================================================================

/*
Successful Startup Sequence:
1. ✓ Service Worker registered
2. 🔐 Interceptor: Adding auth token to GET https://...
3. [ChatInit] Initializing Socket.io connection for user: [ID]
4. [ChatInit] ✅ Socket.io connected successfully
5. 🔄 Initializing chatbot conversation...
6. ✅ Conversation started: [conversation-id]

Successful Chat Message Send:
1. 🔐 Interceptor: Adding auth token to POST https://...
2. [Socket] Message sent: [message-id]
3. [Socket] Response received: [response-text]
4. ✅ Message added to chat

Successful Voice Input:
1. 🎤 Voice listening started
2. 📝 Transcript: [your-spoken-text]
3. 🔐 Interceptor: Adding auth token to POST https://...
4. [Socket] Message sent: [message-id]

No Error Messages Like:
❌ DO NOT SEE: Failed to execute 'clone' on 'Response'
❌ DO NOT SEE: POST /chat/conversations 400
❌ DO NOT SEE: Repeated "No auth token found" after login
*/

// ============================================================================
// TROUBLESHOOTING IF ISSUES PERSIST
// ============================================================================

/*
If Service Worker Cloning Error Still Appears:
1. Run in console: navigator.serviceWorker.getRegistrations()
   - Should show registered service worker
2. Click "Unregister" in DevTools → Application → Service Workers
3. Hard refresh page (Ctrl+Shift+R)
4. Run: await debug.testConnectivity()
   - Should make clean fetch requests

If Chat Conversations Still Returns 400:
1. Check console for exact error message
2. Run: await debug.testConnectivity()
3. Note the response body of /chat/conversations
4. File issue with backend team showing:
   - Exact error message
   - Request payload (should be empty {})
   - Expected payload format from backend

If Socket.io Still Doesn't Connect:
1. Check localStorage: localStorage.getItem('access_token')
   - Should show a long token string after login
2. Check console for socket errors
3. Verify backend Socket.io server is running at environment.apiUrl
4. Test with: await debug.testConnectivity()

If Chatbot Stats Still Show Wrong Fields:
1. Hard refresh and clear cache (as above)
2. Check console: debug.history()
3. Look for GET /chat/chatbot/stats response
4. Should have: totalKBEntries, totalTicketsCreated, avgResolutionTime
5. NOT: knowledgeBaseSize, resolvedSolutions (old fields)
*/

console.log(`
╔════════════════════════════════════════════════════════════════╗
║  IT Help Desk Chatbot - Debug Console Ready                    ║
║                                                                  ║
║  Try these commands:                                            ║
║  • debug.info()              - Current status                   ║
║  • debug.testConnectivity()  - Test backend endpoints           ║
║  • debug.history()           - API call history                 ║
║  • debug.showAll()           - Full debug info                  ║
╚════════════════════════════════════════════════════════════════╝
`);
