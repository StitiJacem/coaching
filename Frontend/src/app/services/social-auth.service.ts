import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

declare const google: any;
declare const FB: any;

interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        first_name?: string;
        last_name?: string;
        role: string;
        profile_completed: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class SocialAuthService {
    private apiUrl = 'http://localhost:3000/api/auth';
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadGoogleScript();
        this.loadFacebookScript();
    }

    private loadGoogleScript(): void {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    private loadFacebookScript(): void {
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.async = true;
        script.defer = true;
        script.onload = () => {
            (window as any).fbAsyncInit = () => {
                FB.init({
                    appId: 'your_facebook_app_id_here',
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
            };
        };
        document.head.appendChild(script);
    }

    loginWithGoogle(): Promise<AuthResponse> {
        return new Promise((resolve, reject) => {
            if (typeof google === 'undefined') {
                reject(new Error('Google Sign-In not loaded'));
                return;
            }

            google.accounts.id.initialize({
                client_id: 'your_google_client_id_here',
                callback: (response: any) => {
                    this.handleGoogleCallback(response.credential)
                        .subscribe({
                            next: (res) => resolve(res),
                            error: (err) => reject(err)
                        });
                }
            });

            google.accounts.id.prompt();
        });
    }

    private handleGoogleCallback(idToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/google`, { id_token: idToken })
            .pipe(
                tap(response => {
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                })
            );
    }

    loginWithFacebook(): Promise<AuthResponse> {
        return new Promise((resolve, reject) => {
            if (typeof FB === 'undefined') {
                reject(new Error('Facebook SDK not loaded'));
                return;
            }

            FB.login((response: any) => {
                if (response.authResponse) {
                    this.handleFacebookCallback(response.authResponse.accessToken)
                        .subscribe({
                            next: (res) => resolve(res),
                            error: (err) => reject(err)
                        });
                } else {
                    reject(new Error('Facebook login cancelled'));
                }
            }, { scope: 'email' });
        });
    }

    private handleFacebookCallback(accessToken: string): Observable<AuthResponse> {
        return this.http.post<AuthResponse>(`${this.apiUrl}/facebook`, { access_token: accessToken })
            .pipe(
                tap(response => {
                    localStorage.setItem('auth_token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.user));
                    this.currentUserSubject.next(response.user);
                })
            );
    }

    completeProfile(data: { first_name: string; last_name: string; role: string }): Observable<any> {
        const token = localStorage.getItem('auth_token');
        return this.http.post(`${this.apiUrl}/complete-profile`, data, {
            headers: { Authorization: `Bearer ${token}` }
        }).pipe(
            tap(response => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...user, ...data, profile_completed: true };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                this.currentUserSubject.next(updatedUser);
            })
        );
    }

    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}
