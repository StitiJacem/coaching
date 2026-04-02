import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: false,
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.css']
})
export class VerifyEmailComponent implements OnInit {
  verifyForm: FormGroup;
  email: string = '';
  errorMessage: string = '';
  successMessage: string = '';
  timeLeft: number = 300;
  timerInterval: any;
  resending: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.verifyForm = this.fb.group({
      code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
    });
  }

  ngOnInit() {
    this.email = this.route.snapshot.queryParams['email'] || '';
    if (!this.email) {
      this.router.navigate(['/signup']);
      return;
    }
    this.startTimer();
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.timeLeft--;
      if (this.timeLeft <= 0) {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeLeft / 60);
    const seconds = this.timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  onSubmit() {
    if (this.verifyForm.valid) {
      const code = this.verifyForm.value.code;
      this.authService.verifyEmail(this.email, code).subscribe({
        next: () => {
          this.successMessage = 'Email vérifié avec succès !';
          this.errorMessage = '';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Code invalide';
          this.successMessage = '';
        }
      });
    }
  }

  resendCode() {
    this.resending = true;
    this.authService.resendCode(this.email).subscribe({
      next: () => {
        this.successMessage = 'Code renvoyé avec succès !';
        this.errorMessage = '';
        this.timeLeft = 300;
        this.resending = false;
        if (this.timerInterval) {
          clearInterval(this.timerInterval);
        }
        this.startTimer();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Erreur lors du renvoi';
        this.resending = false;
      }
    });
  }
}
