import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  standalone: false,
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'GO SPORT';
  showNavbar = false;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects || event.url;
      const hideOn = ['/', '/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/dashboard'];
      this.showNavbar = !hideOn.some(path => url === path || (path !== '/' && url.startsWith(path)));
    });
  }
}
