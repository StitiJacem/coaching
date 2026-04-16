import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SocialAuthService } from '../../services/social-auth.service';

@Component({
    selector: 'app-complete-profile',
    standalone: false,
    templateUrl: './complete-profile.component.html',
    styleUrls: ['./complete-profile.component.css']
})
export class CompleteProfileComponent implements OnInit {
    profileForm!: FormGroup;
    errorMessage = '';
    loading = false;
    selectedRole = '';
    currentStep = 1;
    hasInitialRole = false;
    offerTypes = ['Workout Training', 'Nutrition Coaching', 'Fitness Challenges', 'Habit Coaching', 'Payment', 'Low-Ticket Membership', 'High-Ticket Membership'];


    experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Pro'];
    fitnessLevels = ['Sedentary', 'Lightly Active', 'Moderately Active', 'Very Active', 'Extra Active'];
    workTypes = ['Online', 'In-Person', 'Hybrid'];

    roles = [
        {
            id: 'athlete',
            label: 'Athlete',
            icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
            description: 'Track your progress and reach your goals'
        },
        {
            id: 'coach',
            label: 'Coach',
            icon: 'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
            description: 'Manage athletes and create programs'
        },
        {
            id: 'doctor',
            label: 'Doctor',
            icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
            description: 'Monitor health and provide clearances'
        },
        {
            id: 'nutritionist',
            label: 'Nutritionist',
            icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
            description: 'Create nutrition plans and track intake'
        }
    ];

    constructor(
        private fb: FormBuilder,
        private socialAuthService: SocialAuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        const user = this.socialAuthService.getCurrentUser();

        if (!user) {
            this.router.navigate(['/login']);
            return;
        }

        if (user.profile_completed) {
            this.router.navigate(['/dashboard']);
            return;
        }

        const initialRole = user.role || '';
        this.selectedRole = initialRole;
        if (initialRole) {
            this.hasInitialRole = true;
            this.currentStep = 2;
        } else {
            this.hasInitialRole = false;
            this.currentStep = 1;
        }

        this.profileForm = this.fb.group({
            role: [initialRole, [Validators.required]],
            first_name: [user.first_name || '', [Validators.required]],
            last_name: [user.last_name || '', [Validators.required]],
            phone: [''],
            nationality: [''],
            dateOfBirth: [''],
            location: [''],
            sport: [''],
            experienceLevel: ['Beginner'],
            timePerSession: [''],
            preferredTrainingDays: [[]],
            primaryObjective: [''],
            weightGoal: [''],
            fitnessLevel: ['Moderately Active'],
            injuries: [''],
            equipment: [''],
            bio: [''],
            experience_years: [0],
            specializations: [''],
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

    nextStep(): void {
        if (this.currentStep === 1 && !this.profileForm.get('role')?.value) {
            this.errorMessage = 'Please select a role to continue.';
            return;
        }
        this.errorMessage = '';
        this.currentStep++;
    }

    prevStep(): void {
        if (!this.hasInitialRole) {
            this.currentStep--;
        }
    }



    onSubmit(): void {
        const payload = { ...this.profileForm.value };


        if (payload.role === 'coach') {
            payload.offerTypes = payload.coachOfferTypes;

        }

        this.socialAuthService.completeProfile(payload).subscribe({
            next: () => {
                this.router.navigate(['/dashboard']);
            },
            error: (err: any) => {
                this.errorMessage = err.error?.message || 'Profile completion failed';
                this.loading = false;
            }
        });
    }
}
