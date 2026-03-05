import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 40px; text-align: center;">
      <h1>TEST PAGE - ROUTING WORKS!</h1>
      <p>Kung nakita mo to, gumagana ang routing.</p>
      <p>Token from localStorage: {{ token }}</p>
    </div>
  `,
  styles: [
    `
      h1 {
        color: green;
        font-size: 48px;
      }
      p {
        font-size: 24px;
      }
    `,
  ],
})
export class TestComponent {
  token: string;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (isPlatformBrowser(this.platformId)) {
      this.token = localStorage.getItem('access_token') || 'No token found';
    } else {
      this.token = 'SSR - no localStorage';
    }
  }
}
