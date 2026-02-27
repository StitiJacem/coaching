import { Component, OnInit } from '@angular/core';
import { WorkoutLogService, WorkoutLog, TodayWorkout } from '../../../services/workout-log.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-workout-history',
    standalone: false,
    templateUrl: './workout-history.component.html',
    styleUrls: ['./workout-history.component.css']
})
export class WorkoutHistoryComponent implements OnInit {
    logs: WorkoutLog[] = [];
    total = 0;
    isLoading = true;
    athleteId: number | null = null;
    expandedLogId: number | null = null;
    offset = 0;
    limit = 10;

    constructor(
        private workoutLogService: WorkoutLogService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.loadHistory();
    }

    loadHistory(): void {
        const user = this.authService.getUser();
        if (!user) return;

        // We need the athleteId, but we only have userId here.
        // Load today's workout to resolve athleteId, then load history.
        this.workoutLogService.getTodayWorkout(user.id).subscribe({
            next: (data: TodayWorkout) => {
                if (data.athleteId) {
                    this.athleteId = data.athleteId;
                    this.fetchLogs();
                } else {
                    this.isLoading = false;
                }
            },
            error: () => { this.isLoading = false; }
        });
    }

    fetchLogs(): void {
        if (!this.athleteId) return;
        this.isLoading = true;
        this.workoutLogService.getAthleteHistory(this.athleteId, this.limit, this.offset).subscribe({
            next: (data: any) => {
                this.logs = data.logs;
                this.total = data.total;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    toggleExpand(logId: number): void {
        this.expandedLogId = this.expandedLogId === logId ? null : logId;
    }

    loadMore(): void {
        if (!this.athleteId || this.logs.length >= this.total) return;
        this.offset += this.limit;
        this.workoutLogService.getAthleteHistory(this.athleteId, this.limit, this.offset).subscribe({
            next: (data: any) => {
                this.logs = [...this.logs, ...data.logs];
            }
        });
    }

    getStatusIcon(status: string): string {
        const map: Record<string, string> = {
            completed: '✅',
            missed: '❌',
            in_progress: '🔄',
            scheduled: '📅',
        };
        return map[status] || '⬜';
    }

    getStatusClass(status: string): string {
        const map: Record<string, string> = {
            completed: 'text-green-400 bg-green-400/10',
            missed: 'text-red-400 bg-red-400/10',
            in_progress: 'text-yellow-400 bg-yellow-400/10',
            scheduled: 'text-slate-400 bg-slate-400/10',
        };
        return map[status] || 'text-slate-400 bg-slate-800';
    }

    formatDate(date: any): string {
        if (!date) return '—';
        return new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    }
}
