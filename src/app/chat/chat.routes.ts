import { Routes } from '@angular/router';
import { authGuard } from '../guards/auth.guard';

export const chatRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/chat-layout/chat-layout.component').then(
        (m) => m.ChatLayoutComponent,
      ),
  },
  {
    path: 'direct/:userId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/conversation-detail/conversation-detail.component').then(
        (m) => m.ConversationDetailComponent,
      ),
  },
  {
    path: 'group/:conversationId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/conversation-detail/conversation-detail.component').then(
        (m) => m.ConversationDetailComponent,
      ),
  },
  {
    path: 'ticket/:ticketId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/conversation-detail/conversation-detail.component').then(
        (m) => m.ConversationDetailComponent,
      ),
  },
];
