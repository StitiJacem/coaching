import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AthleteService } from '../../../../services/athlete.service';
import { ProgramService } from '../../../../services/program.service';
import { ConfirmService } from '../../../../services/confirm.service';
import { ToastService } from '../../../../services/toast.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { format, formatDistanceToNow } from 'date-fns';

@Component({
  selector: 'app-athlete-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, DashboardLayoutComponent],
  templateUrl: './athlete-overview.component.html',
})
export class AthleteOverviewComponent implements OnInit {
  athleteId!: number;
  overview: any = null;
  isLoading = true;
  isEndingProgram = false;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private athleteService: AthleteService,
    private programService: ProgramService,
    private confirmService: ConfirmService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params: any) => {
      this.athleteId = +params['id'];
      this.loadOverview();
    });
  }

  loadOverview(): void {
    this.isLoading = true;
    this.athleteService.getOverview(this.athleteId).subscribe({
      next: (data: any) => { this.overview = data; this.isLoading = false; },
      error: (err: any) => {
        console.error('Error loading overview:', err);
        this.isLoading = false;
      }
    });
  }

  goToCalendar(): void {
    this.router.navigate(['/dashboard/athletes', this.athleteId, 'calendar']);
  }

  async endProgram(): Promise<void> {
    if (!this.overview?.activeProgram?.id) return;
    const confirmed = await this.confirmService.danger(
      `End "${this.overview.activeProgram.name}"? All remaining sessions will be cleared.`,
      'End Program'
    );
    
    if (!confirmed) return;
    this.isEndingProgram = true;
    this.programService.endProgram(this.overview.activeProgram.id).subscribe({
      next: () => {
        this.isEndingProgram = false;
        this.toastService.showSuccess('Program ended successfully.');
        this.loadOverview();
      },
      error: (err: any) => {
        console.error('Error ending program:', err);
        this.isEndingProgram = false;
        this.toastService.showError('Failed to end program.');
      }
    });
  }

  getInitials(name: string): string {
    if (!name) return 'A';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2);
  }

  formatEventType(type: string): string {
    const map: Record<string, string> = {
      workout_completed: '✅ Completed a workout',
      new_pr: '🏆 Set a new PR',
      workout_started: '🚀 Started a workout',
      program_assigned: '📋 Program assigned',
    };
    return map[type] || type;
  }

  formatDistance(date: any): string {
    try { return formatDistanceToNow(new Date(date), { addSuffix: true }); }
    catch { return ''; }
  }

  formatDate(date: any): string {
    try { return format(new Date(date), 'MMM d, yyyy'); }
    catch { return ''; }
  }

  get progressPercent(): number {
    const p = this.overview?.activeProgram?.progress;
    if (!p || p.total === 0) return 0;
    return Math.min(100, Math.round((p.completed / p.total) * 100));
  }

  get adherenceColor(): string {
    const a = this.overview?.trainingStats?.adherence || 0;
    if (a >= 80) return 'text-green-400';
    if (a >= 50) return 'text-gosport-orange';
    return 'text-red-400';
  }
}
