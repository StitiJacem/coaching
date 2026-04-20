import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule]
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  errorMessage = '';

  roles = [
    {
      id: 'athlete',
      label: 'Athlete',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
    },
    {
      id: 'coach',
      label: 'Coach',
      icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3'
    },
    {
      id: 'doctor',
      label: 'Doctor',
      icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
    },
    {
      id: 'nutritionist',
      label: 'Nutritionist',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
    }
  ];

  specializationsList = [
    { id: 'PADEL', label: 'Padel', icon: '🎾' },
    { id: 'MUSCULATION', label: 'Musculation', icon: '💪' },
    { id: 'CROSSFIT', label: 'CrossFit', icon: '🏋️' }
  ];

  selectedSpecializations: string[] = [];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.signupForm = this.fb.group({
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]]
    });
  }

  setRole(roleId: string): void {
    this.signupForm.patchValue({ role: roleId });
    if (roleId !== 'coach') {
      this.selectedSpecializations = [];
    }
  }

  toggleSpecialization(specId: string): void {
    const index = this.selectedSpecializations.indexOf(specId);
    if (index > -1) {
      this.selectedSpecializations.splice(index, 1);
    } else {
      this.selectedSpecializations.push(specId);
    }
  }

  onSubmit(): void {
    if (this.signupForm.invalid || !this.signupForm.get('role')?.value) return;

    this.errorMessage = '';
    const formData = this.signupForm.value;

    this.authService.signup({
      username: formData.email,
      email: formData.email,
      password: formData.password,
      first_name: formData.first_name,
      last_name: formData.last_name,
      role: formData.role,
      specializations: this.selectedSpecializations
    }).subscribe({
      next: () => {
        this.router.navigate(['/verify-email'], {
          queryParams: { email: formData.email }
        });
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
      }
    });
  }
}
