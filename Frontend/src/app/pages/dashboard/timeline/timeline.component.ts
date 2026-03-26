import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ActivityTimelineService, ActivityEvent } from '../../../services/activity-timeline.service';
import { AthleteService } from '../../../services/athlete.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-timeline',
    standalone: false,
    templateUrl: './timeline.component.html',
    styleUrls: ['./timeline.component.css']
})
export class TimelineComponent implements OnInit {
    events: ActivityEvent[] = [];
    total = 0;
    isLoading = true;
    athleteId: number | null = null;
    athleteName = '';
    offset = 0;
    limit = 20;
    isCoach = false;
    assignedProgramsPending = 0;
    hasActiveProgram = false;
    recentWorkouts: { id: number; scheduledDate: string; status: string }[] = [];

    constructor(
        private route: ActivatedRoute,
        private timelineService: ActivityTimelineService,
        private athleteService: AthleteService,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        const user = this.authService.getUser();
        if (!user) return;

        this.route.paramMap.subscribe(params => {
            const id = params.get('id');
            if (id) {
                this.athleteId = +id;
                this.isCoach = user.role === 'coach';
                this.athleteService.getById(this.athleteId).subscribe({
                    next: (a) => {
                        this.athleteName = [a.user?.first_name, a.user?.last_name].filter(Boolean).join(' ') || 'Athlete';
                    }
                });
                this.offset = 0;
                this.fetchEvents();
            } else {
                this.athleteService.getAll().subscribe({
                    next: (athletes) => {
                        const athlete = athletes[0];
                        if (athlete?.id) {
                            this.athleteId = athlete.id;
                            this.athleteName = 'My';
                            this.offset = 0;
                            this.fetchEvents();
                        } else {
                            this.isLoading = false;
                        }
                    },
                    error: () => { this.isLoading = false; }
                });
            }
        });
    }

    fetchEvents(): void {
        if (!this.athleteId) return;
        this.isLoading = true;
        this.timelineService.getTimeline(this.athleteId, this.limit, this.offset).subscribe({
            next: (data) => {
                if (this.offset === 0) {
                    this.events = data.events;
                    if (data.context) {
                        this.assignedProgramsPending = data.context.assignedProgramsPending;
                        this.hasActiveProgram = data.context.hasActiveProgram;
                        this.recentWorkouts = data.context.recentWorkouts || [];
                    }
                } else {
                    this.events = [...this.events, ...data.events];
                }
                this.total = data.total;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    loadMore(): void {
        if (!this.athleteId || this.events.length >= this.total) return;
        this.offset += this.limit;
        this.fetchEvents();
    }

    getEventIcon(type: string): string {
        const map: Record<string, string> = {
            workout_started: '▶️',
            set_completed: '✓',
            workout_completed: '🏁',
            workout_missed: '⏭️',
            pain_reported: '⚠️',
            quiz_answer: '📝',
            program_assigned: '📋',
        };
        return map[type] || '•';
    }

    getEventLabel(type: string): string {
        return type.replace(/_/g, ' ');
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
        });
    }

    hasPayloadKeys(payload: Record<string, unknown>): boolean {
        return payload && typeof payload === 'object' && Object.keys(payload).length > 0;
    }
}
