import { RoleService } from '../../services/role.service';
import { DashboardService } from '../../services/dashboard.service';
import { WorkoutLogService, TodayWorkout, AthleteWorkoutStats } from '../../services/workout-log.service';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CoachService, CoachingRequest } from '../../services/coach.service';
import { AuthService } from '../../services/auth.service';
import { ProgramService, Program } from '../../services/program.service';
import { SessionService, Session } from '../../services/session.service';
import { AthleteService, Athlete } from '../../services/athlete.service';
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isSameDay,
    isToday,
    getDay
} from 'date-fns';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../components/dashboard-layout/dashboard-layout.component';
import { CardComponent } from '../../components/ui/card/card.component';
import { AvatarComponent } from '../../components/ui/avatar/avatar.component';
import { BadgeComponent } from '../../components/ui/badge/badge.component';
import { ButtonComponent } from '../../components/ui/button/button.component';
import { ProgramConfigModalComponent } from './programs/program-config-modal.component';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        LucideAngularModule,
        DashboardLayoutComponent,
        CardComponent,
        AvatarComponent,
        BadgeComponent,
        ButtonComponent,
        ProgramConfigModalComponent
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats: any[] = [];
    todaySessions: any[] = [];
    recentAthletes: any[] = [];
    loading = true;
    error: string | null = null;
    isStartingWorkout = false;


    todayWorkout: TodayWorkout | null = null;
    workoutStats: AthleteWorkoutStats | null = null;
    weekDays: Date[] = [];
    weekSessions: Session[] = [];
    currentWeekRange: string = '';
    
    recentPRs: any[] = [];

    pendingRequests: CoachingRequest[] = [];
    isUpdatingRequest = false;


    pendingPrograms: Program[] = [];
    showConfigModal = false;
    selectedProgramForConfig: Program | null = null;
    athleteId: number | null = null;

    constructor(
        public roleService: RoleService,
        private dashboardService: DashboardService,
        private workoutLogService: WorkoutLogService,
        private authService: AuthService,
        private router: Router,
        private coachService: CoachService,
        private programService: ProgramService,
        private sessionService: SessionService,
        private athleteService: AthleteService
    ) { }

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;
        this.error = null;
        const role = this.roleService.currentRole;

        this.dashboardService.getStats(role).subscribe({
            next: (data) => { this.stats = data; },
            error: (err) => { console.error('Error loading stats', err); }
        });

        this.dashboardService.getTodaySessions().subscribe({
            next: (data) => { this.todaySessions = data; },
            error: (err) => { console.error('Error loading sessions', err); }
        });

        this.dashboardService.getRecentAthletes().subscribe({
            next: (data) => { this.recentAthletes = data; this.loading = false; },
            error: (err) => { console.error('Error loading athletes', err); this.loading = false; }
        });


        if (role === 'coach') {
            this.loadCoachData();
            this.loadRecentPRs();
        } else if (role === 'athlete') {
            this.athleteService.getAll().subscribe({
                next: (athletes) => {
                    if (athletes.length > 0) {
                        const athlete = athletes[0];
                        this.athleteId = athlete.id!;
                        this.loadAthleteData(this.athleteId);
                        this.loadRecentPRs();
                        this.loadCoachData();
                        this.loadPendingPrograms(this.athleteId);
                        this.initializeWeeklySchedule(this.athleteId);
                    }
                },
                error: (err) => console.error('Error loading athlete profile', err)
            });
        }
    }

    initializeWeeklySchedule(athleteId: number) {
        const now = new Date();
        const start = startOfWeek(now, { weekStartsOn: 1 });
        const end = endOfWeek(now, { weekStartsOn: 1 });

        this.weekDays = eachDayOfInterval({ start, end });
        this.currentWeekRange = `${format(start, 'MMM d').toUpperCase()}-${format(end, 'd')}`;

        this.loadWeeklySessions(athleteId, start, end);
    }

    loadWeeklySessions(athleteId: number, start: Date, end: Date) {
        this.sessionService.getAll({
            athleteId: athleteId,
            startDate: format(start, 'yyyy-MM-dd'),
            endDate: format(end, 'yyyy-MM-dd')
        }).subscribe({
            next: (sessions) => {
                this.weekSessions = sessions;
            },
            error: (err) => {
                console.error('Error loading weekly sessions', err);
            }
        });
    }

    hasSessionOn(day: Date): boolean {
        return this.weekSessions.some(s => isSameDay(new Date(s.date), day));
    }

    isToday(day: Date): boolean {
        return isToday(day);
    }

    loadAthleteData(athleteId: number) {
        const user = this.authService.getUser();
        if (!user) return;


        this.workoutLogService.getTodayWorkout(user.id).subscribe({
            next: (data: TodayWorkout) => {
                this.todayWorkout = data;
                this.workoutLogService.getAthleteStats(athleteId).subscribe({
                    next: (stats: AthleteWorkoutStats) => { this.workoutStats = stats; },
                    error: (err: any) => { console.error('Error loading workout stats', err); }
                });
            },
            error: (err: any) => { console.error('Error loading today workout', err); }
        });
    }

    loadRecentPRs() {
        this.dashboardService.getRecentPRs(this.roleService.currentRole).subscribe({
            next: (data) => { this.recentPRs = data; },
            error: (err) => { console.error('Error loading PRs', err); }
        });
    }

    loadCoachData() {
        this.coachService.getMyRequests().subscribe({
            next: (requests) => {
                this.pendingRequests = requests.filter(r => r.status === 'pending');
            },
            error: (err) => { console.error('Error loading coaching requests', err); }
        });
    }

    handleRequest(requestId: string | undefined, status: 'accepted' | 'rejected') {
        if (!requestId) return;
        this.isUpdatingRequest = true;
        this.coachService.updateRequestStatus(requestId, status).subscribe({
            next: () => {
                this.pendingRequests = this.pendingRequests.filter(r => r.id !== requestId);
                this.isUpdatingRequest = false;

                if (status === 'accepted') {
                    this.loadDashboardData();
                }
            },
            error: (err) => {
                console.error('Error updating request', err);
                this.isUpdatingRequest = false;
            }
        });
    }

    startWorkout() {
        if (!this.todayWorkout?.day || !this.todayWorkout?.athleteId) return;
        this.isStartingWorkout = true;

        const data = {
            athleteId: this.todayWorkout.athleteId,
            programId: this.todayWorkout.program?.id,
            scheduledDate: new Date().toISOString().split('T')[0]
        };

        this.workoutLogService.startWorkout(data).subscribe({
            next: (log) => {
                this.isStartingWorkout = false;
                this.router.navigate(['/dashboard/workout', log.id]);
            },
            error: (err) => {
                console.error('Error starting workout', err);
                this.isStartingWorkout = false;
            }
        });
    }

    quitWorkout() {
        if (!this.todayWorkout?.workoutLog?.id) return;
        if (confirm('Are you sure you want to quit this workout? Your coach will be notified.')) {
            this.workoutLogService.quitWorkout(this.todayWorkout.workoutLog.id).subscribe({
                next: () => this.loadDashboardData(),
                error: (err) => console.error('Error quitting workout', err)
            });
        }
    }

    quitProgram() {
        if (!this.todayWorkout?.program?.id) return;
        if (confirm('Are you sure you want to quit your current program? Your coach will be notified.')) {
            this.programService.quitProgram(this.todayWorkout.program.id).subscribe({
                next: () => this.loadDashboardData(),
                error: (err) => console.error('Error quitting program', err)
            });
        }
    }

    consultProgram() {
        if (this.athleteId) {
            this.router.navigate(['/dashboard/athletes', this.athleteId, 'calendar']);
        }
    }

    get todayExerciseCount(): number {
        return this.todayWorkout?.day?.exercises?.length || 0;
    }

    get todayWorkoutName(): string {
        if (this.todayWorkout?.isRestDay) return 'Rest Day';
        if (this.todayWorkout?.day) return this.todayWorkout.day.title;
        return 'No Workout Assigned';
    }

    get isRestDay(): boolean {
        return !!this.todayWorkout?.isRestDay || !!this.todayWorkout?.notStarted;
    }

    get isProgramNotStarted(): boolean {
        return !!this.todayWorkout?.notStarted;
    }

    get daysUntilStart(): number {
        return this.todayWorkout?.daysUntilStart || 0;
    }

    get nextSessionCountdown(): string {
        const days = this.daysUntilNext;
        if (days === 1) return 'starts tomorrow';
        return `starts in ${days} days`;
    }

    get daysUntilNext(): number {
        return this.todayWorkout?.daysUntilNext || 0;
    }

    get nextWorkoutName(): string {
        return this.todayWorkout?.nextDay?.title || 'Next Session';
    }

    get targetMuscleGroups(): string[] {
        if (!this.todayWorkout) return [];
        const exercises = this.isRestDay ? this.todayWorkout.nextDay?.exercises : this.todayWorkout.day?.exercises;
        if (!exercises) return [];
        
        const parts = new Set<string>();
        exercises.forEach((ex: any) => {
            if (ex.exercise_name) {
                parts.add(ex.exercise_name.split(' ')[0]);
            }
        });
        return Array.from(parts).slice(0, 3);
    }
    
    get upcomingExercises(): any[] {
        return this.todayWorkout?.day?.exercises?.slice(0, 3) || [];
    }

    get currentStreak(): number {
        return this.workoutStats?.currentStreak || 0;
    }

    get adherencePercent(): number {
        return this.workoutStats?.adherencePercent || 0;
    }

    get completedSessions(): number {
        return this.workoutStats?.completedSessions || 0;
    }

    get hasActiveProgram(): boolean {
        return !!this.todayWorkout?.program;
    }

    get workoutAlreadyStarted(): boolean {
        return this.todayWorkout?.workoutLog?.status === 'in_progress';
    }

    get workoutCompleted(): boolean {
        return this.todayWorkout?.workoutLog?.status === 'completed';
    }

    get userFirstName(): string {
        return this.roleService.user.name.split(' ')[0] || 'Athlete';
    }

    get currentStats() { return this.stats; }

    get dashboardTitle() {
        const titles: Record<string, string> = {
            coach: 'Your <span class="text-gosport-orange">Athletes</span>',
            athlete: 'Your <span class="text-gosport-orange">Progress</span>',
            doctor: 'Your <span class="text-gosport-orange">Patients</span>',
            nutritionist: 'Your <span class="text-gosport-orange">Clients</span>',
            manager: 'Your <span class="text-gosport-orange">Workspace</span>'
        };
        return titles[this.roleService.currentRole] || titles['coach'];
    }

    get dashboardLabel() {
        return this.roleService.currentRole.charAt(0).toUpperCase() + this.roleService.currentRole.slice(1) + ' Dashboard';
    }

    getIconName(iconPath: string): string {
        const iconMap: Record<string, string> = {
            'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z': 'users',
            'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3': 'dumbbell',
            'M13 10V3L4 14h7v7l9-11h-7z': 'activity',
            'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6': 'trending-up'
        };
        return iconMap[iconPath] || 'activity';
    }

    getTrend(stat: any): 'up' | 'down' | 'neutral' {
        if (stat.subtext?.includes('+') || stat.subtext?.toLowerCase().includes('up')) return 'up';
        if (stat.subtext?.includes('-') || stat.subtext?.toLowerCase().includes('down')) return 'down';
        return 'neutral';
    }

    getAthleteStatus(athlete: any): 'online' | 'offline' | 'busy' {
        if (athlete.status) return athlete.status;
        return 'offline';
    }

    formatLastActive(lastActive: any): string {
        if (typeof lastActive === 'string') return lastActive;
        if (lastActive instanceof Date) {
            const now = new Date();
            const diff = now.getTime() - lastActive.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            if (days === 1) return 'Yesterday';
            return `${days} days ago`;
        }
        return 'Unknown';
    }

    onAddClient() { console.log('Add athlete clicked'); }

    loadPendingPrograms(athleteId: number) {
        this.programService.getAll({
            status: 'assigned',
            athleteId: athleteId
        }).subscribe({
            next: (programs: Program[]) => {
                this.pendingPrograms = programs;
            },
            error: (err: any) => {
                console.error('Error loading pending programs', err);
            }
        });
    }

    openConfigModal(program: Program) {
        this.router.navigate(['/dashboard/program-preview', program.id]);
    }

    onProgramAccepted(updatedProgram: Program) {
        this.showConfigModal = false;
        this.selectedProgramForConfig = null;
        this.pendingPrograms = this.pendingPrograms.filter(p => p.id !== updatedProgram.id);
        if (this.athleteId) {
            this.loadAthleteData(this.athleteId);
        }
    }
}
