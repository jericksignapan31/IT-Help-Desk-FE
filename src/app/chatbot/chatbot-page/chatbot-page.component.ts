import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

import { ChatbotWindowComponent } from '../chatbot-window/chatbot-window.component';

@Component({
  selector: 'app-chatbot-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    ChatbotWindowComponent,
  ],
  templateUrl: './chatbot-page.component.html',
  styleUrls: ['./chatbot-page.component.scss'],
})
export class ChatbotPageComponent {
  constructor() {}
}
