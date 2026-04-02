import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SocialAuthService } from '../../services/social-auth.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage: string = '';
  socialLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private socialAuthService: SocialAuthService,
    private roleService: RoleService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: (response: any) => {
          this.roleService.refreshRole();

          if (response.user && !response.user.profile_completed) {
            this.router.navigate(['/']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Login failed';
        }
      });
    }
  }

  async loginWithGoogle() {
    try {
      this.socialLoading = true;
      this.errorMessage = '';
      const response = await this.socialAuthService.loginWithGoogle();

      if (!response.user.profile_completed) {
        this.router.navigate(['/']);
      } else {
        this.roleService.refreshRole();
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Google login failed';
    } finally {
      this.socialLoading = false;
    }
  }

  async loginWithFacebook() {
    try {
      this.socialLoading = true;
      this.errorMessage = '';
      const response = await this.socialAuthService.loginWithFacebook();

      if (!response.user.profile_completed) {
        this.router.navigate(['/']);
      } else {
        this.roleService.refreshRole();
        this.router.navigate(['/dashboard']);
      }
    } catch (error: any) {
      this.errorMessage = error.message || 'Facebook login failed';
    } finally {
      this.socialLoading = false;
    }
  }
}
