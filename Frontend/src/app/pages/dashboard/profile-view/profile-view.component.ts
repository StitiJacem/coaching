import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LucideAngularModule } from 'lucide-angular';
import { AthleteService } from '../../../services/athlete.service';
import { CoachService } from '../../../services/coach.service';
import { WorkoutLogService } from '../../../services/workout-log.service';
import { SessionService } from '../../../services/session.service';
import { ProgramService } from '../../../services/program.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-profile-view',
  standalone: false,
  templateUrl: './profile-view.component.html',
  styleUrls: ['./profile-view.component.css']
})
export class ProfileViewComponent implements OnInit {
  viewType: 'athlete' | 'coach' = 'athlete';
  entityId = '';
  loading = true;
  error = '';


  overview: any = null;
  

  profile: any = null;
  coachStats: { connectedAthletes: number; activePrograms: number } | null = null;

  activeTab: 'overview' | 'training' | 'metrics' = 'overview';
  

  editingNotes = false;
  editingInjuries = false;
  tempField = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private athleteService: AthleteService,
    private coachService: CoachService,
    private workoutLogService: WorkoutLogService,
    private sessionService: SessionService,
    private programService: ProgramService
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.viewType = (params.get('type') as 'athlete' | 'coach') || 'athlete';
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


    this.coachService.getById(this.entityId).subscribe({
      next: (coachProfile: any) => {
        this.profile = coachProfile;

        if (typeof this.profile.offerTypes === 'string') {
          try {
            this.profile.offerTypes = JSON.parse(this.profile.offerTypes);
          } catch (e) {
            this.profile.offerTypes = [this.profile.offerTypes];
          }
        }

        forkJoin({
          requests: this.coachService.getCoachRequests(coachProfile?.id).pipe(catchError(() => of([]))),
          programs: this.programService.getAll({ coachId: coachProfile?.userId }).pipe(catchError(() => of([])))
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
      },
      error: () => {
        this.error = 'Impossible de charger le profil du coach.';
        this.loading = false;
      }
    });
  }



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

  getAdherenceColor(percent: number): string {
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
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
