# Frontend Chat Integration Guide

## 📋 Overview

This guide explains **all the endpoints, data structures, and implementation details** the frontend needs to display and use the chat feature.

---

## 🔌 API Endpoints

### Base URL
```
LOCAL:      http://localhost:3000
PRODUCTION: https://ticketing-web-app.onrender.com
```

### Authentication
All endpoints require a **Bearer token** in the Authorization header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 📡 REST API Endpoints

### 1. **Create Conversation**
```
POST /chat/conversations
```

**Request Body:**
```json
{
  "type": "DIRECT" | "GROUP" | "TICKET",
  "name": "Optional conversation name (required for GROUP)",
  "participant_ids": ["user-id-1", "user-id-2"],
  "ticket_id": "ticket-uuid (only for TICKET type)"
}
```

**Response (201 Created):**
```json
{
  "conversation_id": "uuid",
  "type": "DIRECT",
  "name": null,
  "participant_ids": ["user-id-1", "user-id-2"],
  "created_at": "2026-05-20T08:30:00.000Z",
  "updated_at": "2026-05-20T08:30:00.000Z"
}
```

---

### 2. **Get All Conversations**
```
GET /chat/conversations?page=1&limit=50
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number for pagination
- `limit` (optional, default: 50) - Items per page

**Response (200 OK):**
```json
{
  "data": [
    {
      "conversation_id": "uuid",
      "type": "DIRECT",
      "name": null,
      "participant_ids": ["user-id-1", "user-id-2"],
      "participants": [
        {
          "user_id": "user-id-1",
          "username": "john",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        {
          "user_id": "user-id-2",
          "username": "jane",
          "first_name": "Jane",
          "last_name": "Smith",
          "email": "jane@example.com"
        }
      ],
      "created_at": "2026-05-20T08:30:00.000Z",
      "updated_at": "2026-05-20T08:30:00.000Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 50
}
```

---

### 3. **Get Conversation by ID**
```
GET /chat/conversations/:conversationId
```

**Path Parameters:**
- `conversationId` - UUID of conversation

**Response (200 OK):**
```json
{
  "conversation_id": "uuid",
  "type": "DIRECT",
  "name": null,
  "participant_ids": ["user-id-1", "user-id-2"],
  "participants": [...],
  "created_at": "2026-05-20T08:30:00.000Z",
  "updated_at": "2026-05-20T08:30:00.000Z"
}
```

---

### 4. **Create or Get Direct Conversation**
```
POST /chat/conversations/direct/:otherUserId
```

**Path Parameters:**
- `otherUserId` - UUID of the other user

**Response (201 Created or 200 OK):**
```json
{
  "conversation_id": "uuid",
  "type": "DIRECT",
  "name": null,
  "participant_ids": ["current-user-id", "other-user-id"],
  "created_at": "2026-05-20T08:30:00.000Z",
  "updated_at": "2026-05-20T08:30:00.000Z"
}
```

---

### 5. **Send Message**
```
POST /chat/messages
```

**Request Body:**
```json
{
  "conversation_id": "conversation-uuid",
  "content": "Hello! This is my message"
}
```

**Response (201 Created):**
```json
{
  "message_id": "uuid",
  "conversation_id": "conversation-uuid",
  "sender_id": "user-uuid",
  "content": "Hello! This is my message",
  "is_read": false,
  "created_at": "2026-05-20T08:30:30.105Z",
  "updated_at": "2026-05-20T08:30:30.105Z"
}
```

**Error (400 Bad Request):**
```json
{
  "statusCode": 400,
  "message": "User is not a participant in this chat"
}
```

---

### 6. **Get Messages from Conversation**
```
GET /chat/conversations/:conversationId/messages?page=1&limit=50
```

**Path Parameters:**
- `conversationId` - UUID of conversation

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response (200 OK):**
```json
{
  "data": [
    {
      "message_id": "uuid",
      "conversation_id": "conversation-uuid",
      "sender_id": "user-uuid",
      "content": "Hello!",
      "is_read": false,
      "sender": {
        "user_id": "user-uuid",
        "username": "john",
        "first_name": "John",
        "last_name": "Doe"
      },
      "created_at": "2026-05-20T08:30:30.105Z",
      "updated_at": "2026-05-20T08:30:30.105Z"
    }
  ],
  "total": 42,
  "page": 1,
  "limit": 50
}
```

---

### 7. **Mark Message as Read**
```
POST /chat/messages/:messageId/read
```

**Path Parameters:**
- `messageId` - UUID of message

**Response (200 OK):**
```json
{
  "message_id": "uuid",
  "is_read": true
}
```

---

### 8. **Mark All Messages in Conversation as Read**
```
POST /chat/conversations/:conversationId/mark-read
```

**Path Parameters:**
- `conversationId` - UUID of conversation

**Response (200 OK):**
```json
{
  "conversationId": "uuid",
  "markedCount": 5
}
```

---

### 9. **Delete Message**
```
DELETE /chat/messages/:messageId
```

**Path Parameters:**
- `messageId` - UUID of message

**Response (200 OK):**
```json
{
  "success": true,
  "messageId": "uuid"
}
```

---

### 10. **Get Unread Message Count**
```
GET /chat/unread-count
```

**Response (200 OK):**
```json
{
  "unreadCount": 5
}
```

---

### 11. **Delete Conversation**
```
DELETE /chat/conversations/:conversationId
```

**Path Parameters:**
- `conversationId` - UUID of conversation

**Response (200 OK):**
```json
{
  "success": true,
  "conversationId": "uuid"
}
```

---

## 🔌 WebSocket Events (Socket.IO)

### Connection Setup
```typescript
const socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});
```

### **Emit Events** (Frontend → Backend)

#### 1. **Join Conversation**
```typescript
socket.emit('join_conversation', {
  conversationId: 'uuid'
});
```

#### 2. **Send Message (via WebSocket)**
```typescript
socket.emit('send_message', {
  conversationId: 'uuid',
  content: 'Hello via WebSocket'
});
```

#### 3. **User Typing**
```typescript
socket.emit('typing', {
  conversationId: 'uuid'
});
```

#### 4. **User Stopped Typing**
```typescript
socket.emit('stop_typing', {
  conversationId: 'uuid'
});
```

#### 5. **Mark Message as Read (via WebSocket)**
```typescript
socket.emit('mark_as_read', {
  conversationId: 'uuid',
  messageId: 'uuid'
});
```

#### 6. **Leave Conversation**
```typescript
socket.emit('leave_conversation', {
  conversationId: 'uuid'
});
```

---

### **Listen Events** (Backend → Frontend)

#### 1. **New Message Received**
```typescript
socket.on('message_received', (data) => {
  console.log('New message:', data);
  // data = { message_id, conversation_id, sender_id, content, is_read, created_at, ... }
});
```

#### 2. **User Typing**
```typescript
socket.on('user_typing', (data) => {
  console.log('User is typing:', data);
  // data = { conversationId, userId }
});
```

#### 3. **User Stopped Typing**
```typescript
socket.on('user_stopped_typing', (data) => {
  console.log('User stopped typing:', data);
  // data = { conversationId, userId }
});
```

#### 4. **Message Marked as Read**
```typescript
socket.on('message_marked_read', (data) => {
  console.log('Message read:', data);
  // data = { conversationId, messageId, readBy }
});
```

#### 5. **Connection Status**
```typescript
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

---

## 📊 Data Types & Structures

### Conversation Object
```typescript
interface Conversation {
  conversation_id: string;           // UUID
  type: 'DIRECT' | 'GROUP' | 'TICKET';
  name: string | null;               // null for DIRECT, required for GROUP
  ticket_id: string | null;          // UUID, only for TICKET
  participant_ids: string[];         // Array of user UUIDs
  participants?: User[];             // User details (from API responses)
  created_at: string;                // ISO timestamp
  updated_at: string;                // ISO timestamp
}
```

### Message Object
```typescript
interface Message {
  message_id: string;                // UUID
  conversation_id: string;           // UUID
  sender_id: string;                 // UUID
  content: string;                   // Message text
  is_read: boolean;                  // Read status
  sender?: User;                     // Sender details (from API responses)
  created_at: string;                // ISO timestamp
  updated_at: string;                // ISO timestamp
}
```

### User Object
```typescript
interface User {
  user_id: string;                   // UUID
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'ADMIN' | 'IT' | 'SUPERVISOR' | 'EMPLOYEE';
  employment_status: string;
  branch_id: string;
}
```

---

## 🎯 Implementation Flow

### Step 1: Load Conversations on App Init
```typescript
// When app loads or chat page opens
this.chatApi.getConversations(1, 50).subscribe(response => {
  const conversations = response.data;
  // Display in conversation list
  this.store.setConversations(conversations);
});
```

### Step 2: Select Conversation & Load Messages
```typescript
// When user clicks a conversation
const conversationId = 'uuid';

this.chatApi.getMessages(conversationId, 1, 50).subscribe(response => {
  const messages = response.data;
  // Display messages in chat window
  this.store.setMessages(conversationId, messages);
  
  // Connect to WebSocket to receive new messages
  this.socket.emit('join_conversation', { conversationId });
});
```

### Step 3: Send Message
```typescript
// When user types message and hits send
const message = {
  conversation_id: 'uuid',
  content: 'User typed text'
};

// Option A: Via REST API
this.chatApi.sendMessage(message).subscribe(response => {
  // Message saved in database
  this.store.addMessage(response.conversation_id, response);
});

// Option B: Via WebSocket (real-time)
this.socket.emit('send_message', message);
```

### Step 4: Receive New Messages
```typescript
// Listen for new messages from other users
this.socket.on('message_received', (message) => {
  if (message.conversation_id === currentConversationId) {
    // Add to current conversation messages
    this.store.addMessage(message.conversation_id, message);
  }
});
```

### Step 5: Show Typing Indicator
```typescript
// When user starts typing
this.socket.emit('typing', { conversationId: 'uuid' });

// Listen for other users typing
this.socket.on('user_typing', (data) => {
  if (data.conversationId === currentConversationId) {
    // Show "User is typing..." indicator
    this.store.addTypingUser(data.conversationId, data.userId);
  }
});

// When user stops typing (after 1 second of no input)
this.socket.emit('stop_typing', { conversationId: 'uuid' });

this.socket.on('user_stopped_typing', (data) => {
  // Remove typing indicator
  this.store.removeTypingUser(data.conversationId, data.userId);
});
```

---

## 🧪 Testing Checklist

### ✅ Local Testing (with local database)

```bash
# Terminal 1: Start Backend
cd "d:\PROJECT\ITHELPDESK\it help desk be"
npm run start:dev

# Terminal 2: Start Frontend
cd "d:\PROJECT\ITHELPDESK\it help desk fe"
npm start
```

**Test Steps:**
- [ ] Navigate to `/chat` in browser
- [ ] See "Chat" in sidebar menu
- [ ] Click Chat → should load conversation list (empty if first time)
- [ ] Create direct conversation with another user
- [ ] Send message → should appear instantly
- [ ] Switch conversation → messages should remain (use cache)
- [ ] Switch back → should load instantly from cache
- [ ] See typing indicator when other user types
- [ ] See unread badge on Chat menu item

### ✅ Production Testing (after Render deploy)

**Same tests but at:** `https://ticketing-web-app.onrender.com`

---

## 🔐 Important Notes

### Authentication
- All requests need valid JWT token from `/auth/login`
- Token is extracted from Authorization header by `@CurrentUser()` decorator
- User ID is taken from JWT `sub` field

### Participant Validation
- User can only send messages to conversations where they are in `participant_ids`
- TICKET type conversations allow anyone to send (public ticket discussion)
- DIRECT conversations require both participants in `participant_ids`

### Message IDs
- Backend returns: `message_id` (UUID primary key)
- Use this for updates, reads, deletes
- Field name is `message_id`, NOT `id`

### Field Names
- Message text: `content` (NOT `text`)
- Conversation ID: `conversation_id` (NOT `id`)
- Message ID: `message_id` (NOT `id`)
- Sender ID: `sender_id` (NOT `userId`)

---

## 🚀 Quick Start Example

```typescript
// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private baseUrl = 'http://localhost:3000/chat';
  
  constructor(private http: HttpClient) {}

  // REST Endpoints
  getConversations() {
    return this.http.get(`${this.baseUrl}/conversations`);
  }

  getMessages(conversationId: string) {
    return this.http.get(
      `${this.baseUrl}/conversations/${conversationId}/messages`
    );
  }

  sendMessage(data: { conversation_id: string; content: string }) {
    return this.http.post(`${this.baseUrl}/messages`, data);
  }

  createDirectConversation(otherUserId: string) {
    return this.http.post(
      `${this.baseUrl}/conversations/direct/${otherUserId}`,
      {}
    );
  }
}

// socket.service.ts
@Injectable({ providedIn: 'root' })
export class ChatSocketService {
  private socket: Socket | null = null;
  messageReceived$ = new Subject<any>();
  userTyping$ = new Subject<any>();

  connect(token: string) {
    this.socket = io('http://localhost:3000', {
      auth: { token }
    });

    this.socket.on('message_received', (msg) => {
      this.messageReceived$.next(msg);
    });

    this.socket.on('user_typing', (data) => {
      this.userTyping$.next(data);
    });
  }

  sendMessage(conversationId: string, content: string) {
    this.socket?.emit('send_message', { conversationId, content });
  }

  joinConversation(conversationId: string) {
    this.socket?.emit('join_conversation', { conversationId });
  }
}

// chat.component.ts
export class ChatComponent {
  conversations$ = new BehaviorSubject<any[]>([]);
  messages$ = new BehaviorSubject<any[]>([]);
  selectedConversation: any = null;

  constructor(
    private chatApi: ChatApiService,
    private chatSocket: ChatSocketService,
    private authService: AuthService
  ) {
    this.initialize();
  }

  private initialize() {
    // Connect WebSocket
    const token = localStorage.getItem('token');
    this.chatSocket.connect(token!);

    // Load conversations
    this.chatApi.getConversations().subscribe((res: any) => {
      this.conversations$.next(res.data);
    });

    // Listen for new messages
    this.chatSocket.messageReceived$.subscribe((msg) => {
      if (msg.conversation_id === this.selectedConversation?.conversation_id) {
        const current = this.messages$.value;
        this.messages$.next([...current, msg]);
      }
    });
  }

  selectConversation(conv: any) {
    this.selectedConversation = conv;
    this.chatApi.getMessages(conv.conversation_id).subscribe((res: any) => {
      this.messages$.next(res.data);
    });
    this.chatSocket.joinConversation(conv.conversation_id);
  }

  sendMessage(content: string) {
    if (!this.selectedConversation) return;
    
    const message = {
      conversation_id: this.selectedConversation.conversation_id,
      content
    };
    this.chatApi.sendMessage(message).subscribe((res: any) => {
      this.messages$.next([...this.messages$.value, res]);
    });
  }
}
```

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Token missing or expired. Login again and check Authorization header |
| 400 "Not a participant" | Current user not in conversation's `participant_ids` |
| 404 Conversation not found | Wrong `conversation_id` UUID format |
| Messages not appearing | WebSocket not connected. Call `socket.emit('join_conversation')` |
| Typing indicator stuck | Call `stop_typing` event. Frontend has auto-timeout |
| Field name errors | Check exact field names: `message_id`, `content`, `conversation_id` |

---

## 📚 Additional Resources

- Backend API Docs: `http://localhost:3000/api` (Swagger)
- Socket.IO Docs: https://socket.io/docs/
- JWT Token Extraction: Authorization header as Bearer token
- User ID from JWT: `sub` field in decoded token

---

**Status:** ✅ READY FOR FRONTEND IMPLEMENTATION  
**Last Updated:** May 20, 2026  
**Version:** 1.0
