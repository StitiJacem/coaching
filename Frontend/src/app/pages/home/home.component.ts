import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialAuthService } from '../../services/social-auth.service';

@Component({
  selector: 'app-home',
  standalone: false,
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;
  isProfileComplete = false;
  profileForm!: FormGroup;
  errorMessage = '';
  loading = false;
  selectedRole = '';

  // UI Helpers
  offerTypes = ['Workout Training', 'Nutrition Coaching', 'Fitness Challenges', 'Habit Coaching', 'Payment', 'Low-Ticket Membership', 'High-Ticket Membership'];
  experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
  fitnessLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'];
  workTypes = ['Online', 'In-Person', 'Hybrid'];

  constructor(
    private fb: FormBuilder,
    private socialAuthService: SocialAuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    const user = this.socialAuthService.getCurrentUser();
    this.isLoggedIn = !!user;

    if (this.isLoggedIn) {
      this.isProfileComplete = user.profile_completed;

      if (this.isProfileComplete) {
        this.router.navigate(['/dashboard']);
        return;
      }

      if (!this.isProfileComplete) {
        this.initOnboardingForm(user);
      }
    }
  }

  private initOnboardingForm(user: any): void {
    this.profileForm = this.fb.group({
      role: ['', [Validators.required]],
      first_name: [user.first_name || '', [Validators.required]],
      last_name: [user.last_name || '', [Validators.required]],
      phone: [''],
      nationality: [''],
      dateOfBirth: [''],
      location: [''],
      sport: [''],
      experienceLevel: ['Beginner'],
      timePerSession: [''],
      primaryObjective: [''],
      weightGoal: [''],
      fitnessLevel: ['Moderately Active'],
      equipment: [''],
      bio: [''],
      experience_years: [0],
      workType: ['Online'],
      coachOfferTypes: [[]]
    });
  }

  setRole(roleId: string): void {
    this.profileForm.patchValue({ role: roleId });
    this.selectedRole = roleId;
  }

  toggleOfferType(type: string): void {
    const current = this.profileForm.get('coachOfferTypes')?.value || [];
    if (current.includes(type)) {
      this.profileForm.patchValue({ coachOfferTypes: current.filter((t: string) => t !== type) });
    } else {
      this.profileForm.patchValue({ coachOfferTypes: [...current, type] });
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    const payload = { ...this.profileForm.value };

    if (payload.role === 'coach') {
      payload.offerTypes = payload.coachOfferTypes;
    }

    this.socialAuthService.completeProfile(payload).subscribe({
      next: () => {
        this.isProfileComplete = true;
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.errorMessage = err.error?.message || 'Profile completion failed';
        this.loading = false;
      }
    });
  }
}
