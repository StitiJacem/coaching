import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { LucideAngularModule } from 'lucide-angular';
import { AthleteService } from '../../../services/athlete.service';
import { CoachService } from '../../../services/coach.service';
import { WorkoutLogService } from '../../../services/workout-log.service';
import { SessionService, Session } from '../../../services/session.service';
import { ProgramService } from '../../../services/program.service';

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

  profile: any = null;
  athleteStats: any = null;
  workoutStats: any = null;
  recentSessions: Session[] = [];
  bodyMetrics: any[] = [];
  coachStats: { connectedAthletes: number; activePrograms: number } | null = null;

  constructor(
    private route: ActivatedRoute,
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

  private loadData(): void {
    this.loading = true;
    this.error = '';

    if (!this.entityId) {
      this.error = 'Invalid profile id.';
      this.loading = false;
      return;
    }

    if (this.viewType === 'athlete') {
      const athleteId = Number(this.entityId);
      const today = new Date();
      const from = new Date();
      from.setDate(today.getDate() - 30);
      const startDate = from.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];

      this.athleteService.getById(athleteId).subscribe({
        next: (profile) => {
          this.profile = profile;
          forkJoin({
            athleteStats: this.athleteService.getStats(athleteId).pipe(catchError(() => of(null))),
            workoutStats: this.workoutLogService.getAthleteStats(athleteId).pipe(catchError(() => of(null))),
            sessions: this.sessionService.getAll({ athleteId, startDate, endDate }).pipe(catchError(() => of([]))),
            metrics: this.athleteService.getMetrics ? this.athleteService.getMetrics(athleteId).pipe(catchError(() => of([]))) : of([])
          }).subscribe({
            next: (data) => {
              this.athleteStats = data.athleteStats;
              this.workoutStats = data.workoutStats;
              this.recentSessions = (data.sessions || []).slice(0, 8);
              this.bodyMetrics = data.metrics || [];
              this.loading = false;
            },
            error: () => {
              this.loading = false;
            }
          });
        },
        error: () => {
          this.error = 'Unable to load athlete profile.';
          this.loading = false;
        }
      });
      return;
    }

    this.coachService.getById(this.entityId).subscribe({
      next: (coachProfile: any) => {
        this.profile = coachProfile;

        // Ensure offerTypes is an array on the frontend
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
        this.error = 'Unable to load coach profile.';
        this.loading = false;
      }
    });
  }
}
