import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingBarComponent } from './core/components/loading-bar/loading-bar.component';
import { NotificationToastComponent } from './core/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LoadingBarComponent, NotificationToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('debitos-frontend');
}
