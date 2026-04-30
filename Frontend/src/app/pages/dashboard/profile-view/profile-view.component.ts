import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { forkJoin, of, Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { AthleteService } from '../../../services/athlete.service';
import { CoachService } from '../../../services/coach.service';
import { WorkoutLogService } from '../../../services/workout-log.service';
import { SessionService } from '../../../services/session.service';
import { ProgramService } from '../../../services/program.service';
import { NutritionistService } from '../../../services/nutritionist.service';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { SocialAuthService } from '../../../services/social-auth.service';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-profile-view',
  standalone: false,
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})
export class ProfileViewComponent implements OnInit {
  viewType: 'athlete' | 'coach' | 'nutritionist' = 'athlete';
  entityId = '';
  loading = true;
  error = '';

  // For Athlete View (Coach perspective)
  overview: any = null;
  
  // For Coach View (Athlete perspective)
  profile: any = null;
  coachStats: { connectedAthletes: number; activePrograms: number } | null = null;

  activeTab: 'overview' | 'training' | 'metrics' = 'overview';
  selectedMetric: 'weight' | 'bodyFat' | 'vo2max' = 'weight';
  
  // UI Helpers
  editingNotes = false;
  editingInjuries = false;
  editingProfile = false;
  isOwnProfile = false;
  tempField = '';
  
  // Stats helpers
  adherenceColor = '#10b981';
  
  // Field editing
  editForm = {
    first_name: '',
    last_name: '',
    bio: '',
    experience_years: 0,
    phone: '',
    specializations: [] as string[],
    offerTypes: [] as string[]
  };

  uploadingPhoto = false;

  // Athlete edit mode
  editingAthleteProfile = false;
  athleteEditForm = {
    first_name: '',
    last_name: '',
    sport: '',
    weight: null as number | null,
    height: null as number | null,
    goals: '',
    experienceLevel: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private athleteService: AthleteService,
    private coachService: CoachService,
    private workoutLogService: WorkoutLogService,
    private sessionService: SessionService,
    private programService: ProgramService,
    private authService: AuthService,
    private nutritionistService: NutritionistService,
    private socialAuthService: SocialAuthService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.viewType = (params.get('type') as 'athlete' | 'coach' | 'nutritionist') || 'athlete';
      this.entityId = params.get('id') || '';
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    if (!this.entityId) {
      this.error = 'Identifiant de profil invalide.';
      this.loading = false;
      return;
    }

    if (this.viewType === 'athlete') {
      this.athleteService.getOverview(Number(this.entityId)).subscribe({
        next: (data) => {
          this.overview = data;
          
          // Ownership check for athlete
          const currentUser = this.authService.getUser();
          this.isOwnProfile = currentUser && (Number(currentUser.id) === Number(this.overview.athlete?.userId));
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading overview:', err);
          this.error = 'Impossible de charger l\'aperçu de l\'athlète.';
          this.loading = false;
        }
      });
      return;
    }

    // Coach or Nutritionist View
    const serviceObs: Observable<any> = this.viewType === 'nutritionist'
      ? this.nutritionistService.getById(this.entityId)
      : this.coachService.getById(this.entityId);

    serviceObs.subscribe({
      next: (profileData: any) => {
        this.profile = profileData;
        
        // Ownership check
        const currentUser = this.authService.getUser();
        this.isOwnProfile = currentUser && (Number(currentUser.id) === Number(this.profile.userId));

        if (typeof this.profile.offerTypes === 'string') {
          try {
            this.profile.offerTypes = JSON.parse(this.profile.offerTypes);
          } catch (e) {
            this.profile.offerTypes = [this.profile.offerTypes];
          }
        }

        // Stats loading (simplified for nutritionist if needed)
        if (this.viewType === 'coach') {
          forkJoin({
            requests: this.coachService.getCoachRequests(profileData?.id).pipe(catchError(() => of([]))),
            programs: this.programService.getAll({ coachId: profileData?.userId }).pipe(catchError(() => of([])))
          }).subscribe({
            next: ({ requests, programs }) => {
              const accepted = (requests || []).filter((r: any) => r.status === 'accepted').length;
              const activePrograms = (programs || []).filter((p: any) => p.status === 'active').length;
              this.coachStats = { connectedAthletes: accepted, activePrograms };
              this.loading = false;
            },
            error: () => {
              this.coachStats = { connectedAthletes: 0, activePrograms: 0 };
              this.loading = false;
            }
          });
        } else {
          // Nutritionist specific stats (future improvement)
          this.coachStats = { connectedAthletes: this.profile.total_clients || 0, activePrograms: 0 };
          this.loading = false;
        }
      },
      error: () => {
        this.error = `Impossible de charger le profil du ${this.viewType === 'nutritionist' ? 'nutritionniste' : 'coach'}.`;
        this.loading = false;
      }
    });
  }

  // --- Athlete Profile Editing ---

  toggleAthleteEditProfile(): void {
    if (!this.isOwnProfile || !this.overview) return;
    this.athleteEditForm = {
      first_name: this.overview.athlete?.user?.first_name || this.overview.athlete?.name?.split(' ')[0] || '',
      last_name: this.overview.athlete?.user?.last_name || this.overview.athlete?.name?.split(' ').slice(1).join(' ') || '',
      sport: this.overview.athlete?.sport || '',
      weight: this.overview.athlete?.weight || null,
      height: this.overview.athlete?.height || null,
      goals: this.overview.athlete?.goals || '',
      experienceLevel: this.overview.athlete?.experienceLevel || ''
    };
    this.editingAthleteProfile = true;
  }

  cancelAthleteEditProfile(): void {
    this.editingAthleteProfile = false;
  }

  saveAthleteProfile(): void {
    if (!this.isOwnProfile || !this.overview?.athlete) return;
    this.loading = true;

    const userUpdate = {
      first_name: this.athleteEditForm.first_name,
      last_name: this.athleteEditForm.last_name
    };

    const athleteUpdate: any = {
      sport: this.athleteEditForm.sport,
      goals: this.athleteEditForm.goals,
      experienceLevel: this.athleteEditForm.experienceLevel
    };
    if (this.athleteEditForm.weight !== null) athleteUpdate.weight = this.athleteEditForm.weight;
    if (this.athleteEditForm.height !== null) athleteUpdate.height = this.athleteEditForm.height;

    forkJoin({
      user: this.userService.updateProfile(userUpdate),
      athlete: this.athleteService.update(this.overview.athlete.id, athleteUpdate)
    }).subscribe({
      next: () => {
        // Update in-memory state
        this.overview.athlete.name = `${userUpdate.first_name} ${userUpdate.last_name}`.trim();
        if (this.overview.athlete.user) {
          this.overview.athlete.user.first_name = userUpdate.first_name;
          this.overview.athlete.user.last_name = userUpdate.last_name;
        }
        this.overview.athlete.sport = athleteUpdate.sport;
        this.overview.athlete.goals = athleteUpdate.goals;
        this.overview.athlete.experienceLevel = athleteUpdate.experienceLevel;
        if (athleteUpdate.weight) this.overview.athlete.weight = athleteUpdate.weight;
        if (athleteUpdate.height) this.overview.athlete.height = athleteUpdate.height;

        // Persist name change to localStorage
        const savedUser = this.authService.getUser();
        if (savedUser) {
          savedUser.first_name = userUpdate.first_name;
          savedUser.last_name = userUpdate.last_name;
          localStorage.setItem('user', JSON.stringify(savedUser));
        }

        this.editingAthleteProfile = false;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error saving athlete profile:', err);
        alert('Erreur lors de la mise à jour du profil.');
        this.loading = false;
      }
    });
  }

  // --- Profile Editing methods ---

  toggleEditProfile(): void {
    if (!this.profile) return;
    this.editForm = {
      first_name: this.profile.user?.first_name || '',
      last_name: this.profile.user?.last_name || '',
      bio: this.profile.bio || '',
      experience_years: this.profile.experience_years || 0,
      phone: this.profile.user?.phone || '',
      specializations: this.profile.specializations || [],
      offerTypes: this.profile.offerTypes || []
    };
    this.editingProfile = true;
  }

  cancelEditProfile(): void {
    this.editingProfile = false;
  }

  saveProfile(): void {
    if (!this.isOwnProfile) return;
    this.loading = true;
    
    const updateData = {
      ...this.editForm
    };

    const updateObs = this.viewType === 'nutritionist'
      ? this.nutritionistService.updateProfile(this.profile.userId, updateData)
      : this.coachService.updateProfile(updateData);

    updateObs.subscribe({
      next: (updated) => {
        this.profile = { ...this.profile, ...updated };
        this.editingProfile = false;
        this.loading = false;
        // Optionally update local storage user if names changed
        const user = this.authService.getUser();
        if (user) {
          user.first_name = this.editForm.first_name;
          user.last_name = this.editForm.last_name;
          localStorage.setItem('user', JSON.stringify(user));
        }
      },
      error: (err) => {
        console.error('Error updating profile:', err);
        alert('Erreur lors de la mise à jour du profil.');
        this.loading = false;
      }
    });
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

          // Update local state based on view type
          if ((this.viewType === 'coach' || this.viewType === 'nutritionist') && this.profile && this.profile.user) {
            this.profile.user.photo_url = res.photoUrl;
            this.profile.user.avatar = absoluteUrl;
          } else if (this.viewType === 'athlete' && this.overview && this.overview.athlete) {
            this.overview.athlete.profilePicture = absoluteUrl;
            // Persist to database
            this.athleteService.update(this.overview.athlete.id, { profilePicture: res.photoUrl }).subscribe({
              error: (err) => console.error('Error persisting athlete photo:', err)
            });
          }

          // Update localStorage so avatar persists after logout/login
          const user = this.authService.getUser();
          if (user) {
            user.photo_url = res.photoUrl;
            user.avatar = absoluteUrl;
            localStorage.setItem('user', JSON.stringify(user));
          }
          this.uploadingPhoto = false;
        },
        error: () => {
          this.uploadingPhoto = false;
          alert('Erreur lors du téléchargement de la photo.');
        }
      });
    }
  }

  // --- UI Helpers ---

  getSparklinePath(metrics: any[], field: string, width: number, height: number): string {
    if (!metrics || metrics.length < 2) return '';
    
    const values = metrics.map(m => Number(m[field])).filter(v => !isNaN(v));
    if (values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    });

    return `M ${points.join(' L ')}`;
  }

  setMetric(metric: 'weight' | 'bodyFat' | 'vo2max'): void {
    this.selectedMetric = metric;
  }

  getMetricLabel(field: string): string {
    const labels: any = {
      weight: 'Poids (kg)',
      bodyFat: 'Masse Grasse (%)',
      vo2max: 'VO2 Max (ml/kg/min)'
    };
    return labels[field] || field;
  }

  getLatestValue(field: string): string {
    if (!this.overview?.metrics || this.overview.metrics.length === 0) return '-';
    // Find latest metric that has this field
    const latest = [...this.overview.metrics].reverse().find(m => m[field] !== null && m[field] !== undefined);
    return latest ? latest[field] : '-';
  }

  getAdherenceColor(percent: number): string {
    if (percent >= 80) return '#10b981'; // Green
    if (percent >= 50) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  }

  formatDate(date: any): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getTimeAgo(date: any): string {
    if (!date) return '-';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    const diffHrs = Math.round(diffMin / 60);
    const diffDays = Math.round(diffHrs / 24);

    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHrs < 24) return `Il y a ${diffHrs}h`;
    return `Il y a ${diffDays}j`;
  }

  startEdit(field: 'notes' | 'injuries'): void {
    this.tempField = this.overview.athlete[field] || '';
    if (field === 'notes') this.editingNotes = true;
    else this.editingInjuries = true;
  }

  saveEdit(field: 'notes' | 'injuries'): void {
    const payload = { [field]: this.tempField };
    this.athleteService.update(this.overview.athlete.id, payload).subscribe({
      next: () => {
        this.overview.athlete[field] = this.tempField;
        this.editingNotes = false;
        this.editingInjuries = false;
      },
      error: (err) => {
        console.error('Error updating athlete field:', err);
        alert('Erreur lors de la mise à jour.');
      }
    });
  }

  cancelEdit(): void {
    this.editingNotes = false;
    this.editingInjuries = false;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/athletes']);
  }
}
