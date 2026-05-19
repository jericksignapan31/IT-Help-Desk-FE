import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PwaStatusComponent } from './components/pwa-status/pwa-status.component';
import { PwaService } from './services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PwaStatusComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ITHelp-desk-fe';
  private pwaService = inject(PwaService);
}
