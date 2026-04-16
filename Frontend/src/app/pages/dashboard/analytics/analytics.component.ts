import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { ReportService, CoachOverview, AthleteProgress } from '../../../services/report.service';
import { AthleteService } from '../../../services/athlete.service';

@Component({
    selector: 'app-analytics',
    standalone: false,
    templateUrl: './analytics.component.html',
    styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
    overview: CoachOverview | null = null;
    athleteProgress: AthleteProgress | null = null;
    athletes: { id: number; name: string }[] = [];
    selectedAthleteId: number | null = null;
    isLoading = true;
    isLoadingAthlete = false;

    constructor(
        public roleService: RoleService,
        private reportService: ReportService,
        private athleteService: AthleteService
    ) { }

    ngOnInit(): void {
        if (this.roleService.currentRole === 'coach') {
            this.loadOverview();
            this.athleteService.getAll().subscribe({
                next: (list) => {
                    this.athletes = list.map(a => ({
                        id: a.id!,
                        name: [a.user?.first_name, a.user?.last_name].filter(Boolean).join(' ') || 'Athlete'
                    }));
                    if (this.athletes.length && !this.selectedAthleteId) {
                        this.selectAthlete(this.athletes[0].id);
                    }
                }
            });
        } else {
            this.isLoading = false;
        }
    }

    loadOverview(): void {
        this.isLoading = true;
        this.reportService.getCoachOverview().subscribe({
            next: (data) => {
                this.overview = data;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    selectAthlete(id: number): void {
        this.selectedAthleteId = id;
        this.athleteProgress = null;
        this.isLoadingAthlete = true;
        this.reportService.getAthleteProgress(id).subscribe({
            next: (data) => {
                this.athleteProgress = data;
                this.isLoadingAthlete = false;
            },
            error: () => { this.isLoadingAthlete = false; }
        });
    }

    get maxWeeklyCompleted(): number {
        if (!this.athleteProgress?.weeklyBreakdown?.length) return 1;
        return Math.max(...this.athleteProgress.weeklyBreakdown.map(w => w.completed), 1);
    }
}
