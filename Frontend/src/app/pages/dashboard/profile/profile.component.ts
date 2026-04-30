import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { CoachService } from '../../../services/coach.service';
import { SocialAuthService } from '../../../services/social-auth.service';
import { NutritionistService } from '../../../services/nutritionist.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, DashboardLayoutComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  activeTab: 'general' | 'role' | 'security' = 'general';
  user: any = {};
  profile: any = {};
  role: string = '';
  
  // Form models
  generalForm = {
    first_name: '',
    last_name: '',
    email: ''
  };
  
  securityForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  athleteForm: any = {};
  coachForm: any = {};
  
  isLoading = false;
  uploadingPhoto = false;
  message: { type: 'success' | 'error', text: string } | null = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private athleteService: AthleteService,
    private coachService: CoachService,
    private nutritionistService: NutritionistService,
    private socialAuthService: SocialAuthService
  ) {}

  ngOnInit() {
    this.user = this.authService.getUser();
    this.role = this.user?.role || 'athlete';
    this.loadProfileData();
    
    if (this.user) {
      this.generalForm = {
        first_name: this.user.first_name || '',
        last_name: this.user.last_name || '',
        email: this.user.email || ''
      };
      // Build correct avatar URL from photo_url
      if (this.user.photo_url) {
        this.user.avatar = this.user.photo_url.startsWith('http')
          ? this.user.photo_url
          : `http://localhost:3000${this.user.photo_url}`;
      }
    }
  }

  loadProfileData() {
    if (this.role === 'athlete') {
      this.athleteService.getAll().subscribe(athletes => {
        if (athletes.length > 0) {
          this.profile = athletes[0];
          this.athleteForm = { ...this.profile };
        }
      });
    } else if (this.role === 'coach') {
      // Assuming coachService has a getMyProfile or similar
      this.coachService.getById(this.user.id).subscribe((profile: any) => {
        this.profile = profile;
        this.coachForm = { 
          bio: profile.bio,
          experience_years: profile.experience_years,
          specializations: profile.specializations?.map((s: any) => s.specialization).join(', ')
        };
      });
    } else if (this.role === 'nutritionist') {
      this.nutritionistService.getAllNutritionists().subscribe((list: any[]) => {
        const myProfile = list.find(n => n.userId === this.user.id);
        if (myProfile) {
          this.profile = myProfile;
          this.coachForm = { // Nutritionists use the same form as coaches for bio/exp
            bio: myProfile.bio,
            experience_years: myProfile.experience_years,
            specializations: '' // Specializations might not be in nutritionist entity yet or handled differently
          };
        }
      });
    }
  }

  updateGeneral() {
    this.isLoading = true;
    this.userService.updateProfile(this.generalForm).subscribe({
      next: (updatedUser) => {
        this.isLoading = false;
        this.showFeedback('success', 'Profile updated successfully!');
        // Update local storage user info if needed
        const current = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...current, ...updatedUser }));
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showFeedback('error', err.error?.message || 'Failed to update profile');
      }
    });
  }

  updateRoleProfile() {
    this.isLoading = true;
    if (this.role === 'athlete') {
      this.athleteService.update(this.profile.id, this.athleteForm).subscribe({
        next: () => {
          this.isLoading = false;
          this.showFeedback('success', 'Athlete profile updated!');
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showFeedback('error', 'Failed to update athlete details');
        }
      });
    } else {
      // Coach or Nutritionist update
      const payload = {
        ...this.coachForm,
        specializations: this.coachForm.specializations ? this.coachForm.specializations.split(',').map((s: string) => s.trim()) : []
      };
      
      const updateObs = this.role === 'nutritionist' 
        ? this.nutritionistService.updateProfile(this.user.id, payload)
        : this.coachService.updateProfile(payload);

      updateObs.subscribe({
        next: () => {
          this.isLoading = false;
          this.showFeedback('success', `${this.role === 'nutritionist' ? 'Nutritionist' : 'Coach'} profile updated!`);
        },
        error: (err: any) => {
          this.isLoading = false;
          this.showFeedback('error', `Failed to update ${this.role} details`);
        }
      });
    }
  }

  onPhotoSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.uploadingPhoto = true;
      this.socialAuthService.uploadPhoto(file).subscribe({
        next: (res) => {
          // Build absolute URL
          const absoluteUrl = res.photoUrl.startsWith('http')
            ? res.photoUrl
            : `http://localhost:3000${res.photoUrl}`;
          
          // Update displayed avatar immediately
          this.user.avatar = absoluteUrl;
          this.user.photo_url = res.photoUrl;
          
          // Persist to localStorage so it survives logout/login
          const current = JSON.parse(localStorage.getItem('user') || '{}');
          current.photo_url = res.photoUrl;
          current.avatar = absoluteUrl;
          localStorage.setItem('user', JSON.stringify(current));
          
          this.uploadingPhoto = false;
          this.showFeedback('success', 'Profile photo updated!');
        },
        error: () => {
          this.uploadingPhoto = false;
          this.showFeedback('error', 'Failed to upload photo');
        }
      });
    }
  }

  changePassword() {
    if (this.securityForm.newPassword !== this.securityForm.confirmPassword) {
      this.showFeedback('error', 'Passwords do not match');
      return;
    }
    this.isLoading = true;
    this.userService.changePassword(this.securityForm).subscribe({
      next: () => {
        this.isLoading = false;
        this.showFeedback('success', 'Password changed successfully!');
        this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showFeedback('error', err.error?.message || 'Failed to change password');
      }
    });
  }

  showFeedback(type: 'success' | 'error', text: string) {
    this.message = { type, text };
    setTimeout(() => this.message = null, 3000);
  }
}
