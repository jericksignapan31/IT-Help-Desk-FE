import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-typing-indicator',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './typing-indicator.component.html',
  styleUrls: ['./typing-indicator.component.scss'],
})
export class TypingIndicatorComponent {
  @Input() message: string = 'Bot is typing...';
}
