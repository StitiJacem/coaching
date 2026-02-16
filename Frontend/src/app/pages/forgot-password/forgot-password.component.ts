import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  standalone: false,
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  forgotForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  loading: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit() {
    if (this.forgotForm.valid) {
      this.loading = true;
      this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
        next: () => {
          this.successMessage = 'Code de réinitialisation envoyé !';
          this.errorMessage = '';
          this.loading = false;
          setTimeout(() => {
            this.router.navigate(['/reset-password'], { queryParams: { email: this.forgotForm.value.email } });
          }, 2000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Une erreur est survenue';
          this.successMessage = '';
          this.loading = false;
        }
      });
    }
  }
}
