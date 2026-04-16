import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AthleteService, Athlete } from '../../../../services/athlete.service';
import { SessionService, Session } from '../../../../services/session.service';
import { ProgramService, Program } from '../../../../services/program.service';
import { WorkoutLogService } from '../../../../services/workout-log.service';
import { AuthService } from '../../../../services/auth.service';
import { RoleService } from '../../../../services/role.service';
import {
    startOfWeek,
    endOfWeek,
    addWeeks,
    subWeeks,
    format,
    eachDayOfInterval,
    isSameDay,
    startOfMonth,
    endOfMonth,
    isToday,
    addDays,
    isBefore,
    getDay
} from 'date-fns';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { WorkoutBuilderModalComponent } from '../../../../components/workout-builder/workout-builder-modal.component';

@Component({
    selector: 'app-training-calendar',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, LucideAngularModule, DashboardLayoutComponent, WorkoutBuilderModalComponent],
    templateUrl: './training-calendar.component.html',
    styleUrls: ['./training-calendar.component.css']
})
export class TrainingCalendarComponent implements OnInit {
    athleteId!: number;
    athlete: Athlete | null = null;
    sessions: Session[] = [];

    currentDate = new Date();
    viewMode: '1 Week' | '2 Week' | '4 Week' = '2 Week';
    days: Date[] = [];

    isLoading = true;
    showWorkoutBuilder = false;
    selectedDate: Date | null = null;
    selectedSession: any = null;


    isMasterMode = false;
    masterProgramId: number | null = null;
    programTitle = 'New Training Program';
    programDescription = '';
    showSaveModal = false;
    isSavingTemplate = false;


    showTemplateLibrary = false;
    templates: Program[] = [];
    isLoadingTemplates = false;
    isApplyingTemplate = false;
    blueprintRepeatWeeks: number = 1;
    draggedSession: any | null = null;

    completedLogs: any[] = [];


    isPreviewMode = false;
    previewProgramId: number | null = null;
    previewProgram: Program | null = null;


    showAssignModal = false;
    assignablePrograms: Program[] = [];
    selectedProgramIdToAssign: number | null = null;
    isAssigning = false;


    acceptStartDate: string = new Date().toISOString().split('T')[0];
    acceptSelectedDays: number[] = [];
    isAccepting = false;

    configDays = [
        { initial: 'M', short: 'Mon' },
        { initial: 'T', short: 'Tue' },
        { initial: 'W', short: 'Wed' },
        { initial: 'T', short: 'Thu' },
        { initial: 'F', short: 'Fri' },
        { initial: 'S', short: 'Sat' },
        { initial: 'S', short: 'Sun' }
    ];

    constructor(
        private route: ActivatedRoute,
        public router: Router,
        private athleteService: AthleteService,
        private sessionService: SessionService,
        private programService: ProgramService,
        private workoutLogService: WorkoutLogService,
        private authService: AuthService,
        public roleService: RoleService
    ) { }

    ngOnInit(): void {
        this.route.url.subscribe(url => {
            const path = url.map(u => u.path).join('/');
            this.isMasterMode = path.includes('master-planner');

            this.route.params.subscribe(params => {
                if (this.isMasterMode) {
                    this.masterProgramId = params['id'] ? +params['id'] : null;
                    if (this.masterProgramId) {
                        this.loadMasterProgram();
                    } else {
                        this.generateCalendar();
                        this.isLoading = false;
                    }
                } else if (path.includes('program-preview')) {
                    this.isPreviewMode = true;
                    this.previewProgramId = +params['id'];
                    

                    const currentUser = this.authService.getUser();
                    if (currentUser && currentUser.role === 'athlete') {
                        this.athleteService.getAll().subscribe(athletes => {
                            const found = athletes.find(a => a.userId === currentUser.id);
                            if (found && found.id) {
                                this.athleteId = found.id;
                                this.athlete = found;
                                this.acceptSelectedDays = found.preferredTrainingDays || [];
                            }
                        });
                    }
                    
                    this.generateCalendar();
                    this.loadPreviewProgram();
                } else {
                    this.athleteId = +params['id'];
                    this.loadAthlete();
                    this.generateCalendar();
                }
            });
        });
    }

    loadAthlete(): void {
        this.athleteService.getById(this.athleteId).subscribe({
            next: (data) => {
                this.athlete = data;
                this.loadSessions();
            },
            error: (err) => {
                console.error('Error loading athlete:', err);
                if (err.status === 403) {
                    this.router.navigate(['/dashboard']);
                }
            }
        });
    }

    loadSessions(): void {
        if (this.isMasterMode) return;
        this.isLoading = true;
        this.sessions = [];
        const startDate = format(this.days[0], 'yyyy-MM-dd');
        const endDate = format(this.days[this.days.length - 1], 'yyyy-MM-dd');

        this.sessionService.getAll({
            athleteId: this.athleteId,
            startDate,
            endDate
        }).subscribe({
            next: (data) => {
                this.sessions = data;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading sessions:', err);
                this.isLoading = false;
                if (err.status === 403) {
                    this.router.navigate(['/dashboard']);
                }
            }
        });

        if (this.athleteId) {
            this.workoutLogService.getAthleteHistory(this.athleteId, 100, 0).subscribe({
                next: (res: any) => {
                    this.completedLogs = res.logs.filter((l: any) => l.status === 'completed');
                }
            });
        }
    }

    loadMasterProgram(): void {
        this.loadProgramIntoCalendar(this.masterProgramId!, true);
    }

    loadPreviewProgram(): void {
        if (!this.previewProgramId) return;
        this.isLoading = true;
        this.programService.getById(this.previewProgramId).subscribe({
            next: (program) => {
                this.previewProgram = program;
                this.programTitle = program.name;
                this.programDescription = program.description || '';
                
                if (program.startDate) {
                    this.acceptStartDate = format(new Date(program.startDate), 'yyyy-MM-dd');
                }
                
                this.updateDynamicPreview();
            },
            error: () => this.isLoading = false
        });
    }

    loadProgramIntoCalendar(programId: number, isMaster: boolean): void {
        this.isLoading = true;
        this.programService.getById(programId).subscribe({
            next: (program) => {
                this.sessions = [];
                const anchorDate = this.days[0];
                program.days.forEach(day => {
                    const date = addDays(anchorDate, day.day_number - 1);
                    this.sessions.push({
                        id: day.id,
                        date: date,
                        title: day.title,
                        workoutData: {
                            exercises: day.exercises.map(e => ({
                                id: e.id,
                                name: e.exercise_name,
                                gifUrl: e.exercise_gif,
                                videoId: (e as any).videoId,
                                videoTitle: (e as any).videoTitle,
                                sets: e.sets,
                                reps: e.reps,
                                order: e.order
                            }))
                        }
                    } as any);
                });
                this.isLoading = false;
            },
            error: () => this.isLoading = false
        });
    }

    toggleAcceptDay(index: number): void {
        const idx = this.acceptSelectedDays.indexOf(index);
        if (idx > -1) {
            this.acceptSelectedDays.splice(idx, 1);
        } else {
            this.acceptSelectedDays.push(index);
            this.acceptSelectedDays.sort();
        }
        this.updateDynamicPreview();
    }

    updateDynamicPreview(): void {
        if (!this.previewProgram || !this.isPreviewMode) return;

        const start = new Date(this.acceptStartDate);


        this.currentDate = new Date(start);
        this.generateCalendar();

        this.sessions = [];


        if (this.acceptSelectedDays.length === 0) {
            this.previewProgram.days.forEach(day => {
                const date = addDays(start, day.day_number - 1);
                this.sessions.push(this.mapDayToSession(day, date));
            });
            return;
        }


        let currentDate = new Date(start);
        this.previewProgram.days.forEach(day => {

            while (true) {
                const dayOfWeek = (getDay(currentDate) + 6) % 7;
                if (this.acceptSelectedDays.includes(dayOfWeek)) {
                    this.sessions.push(this.mapDayToSession(day, currentDate));
                    currentDate = addDays(currentDate, 1);
                    break;
                }
                currentDate = addDays(currentDate, 1);
            }
        });
    }

    private mapDayToSession(day: any, date: Date): any {
        return {
            id: day.id,
            date: date,
            title: day.title,
            workoutData: {
                exercises: day.exercises.map((e: any) => ({
                    id: e.id,
                    name: e.exercise_name,
                    gifUrl: e.exercise_gif,
                    videoId: (e as any).videoId,
                    videoTitle: (e as any).videoTitle,
                    sets: e.sets,
                    reps: e.reps,
                    order: e.order
                }))
            }
        } as any;
    }

    onAcceptProgram(): void {
        if (!this.previewProgramId) return;
        this.isAccepting = true;

        const payload = {
            startDate: this.acceptStartDate || new Date().toISOString().split('T')[0],
            scheduleConfig: {
                trainingDays: this.acceptSelectedDays
            }
        };

        this.programService.acceptProgram(this.previewProgramId, payload).subscribe({
            next: () => {
                this.isAccepting = false;
                alert('Success! Your program is now active.');
                this.router.navigate(['/dashboard/programs']);
            },
            error: (err) => {
                console.error('Error accepting program:', err);
                this.isAccepting = false;
                alert('Failed to activate program: ' + (err?.error?.message || 'Please try again.'));
            }
        });
    }

    loadTemplates(): void {
        const coach = JSON.parse(localStorage.getItem('user') || '{}');
        if (!coach.id) return;
        this.isLoadingTemplates = true;
        this.programService.getAll({ coachId: coach.id }).subscribe({
            next: (data) => {
                this.templates = data;
                this.isLoadingTemplates = false;
            },
            error: () => this.isLoadingTemplates = false
        });
    }

    openTemplateLibrary(): void {
        this.showTemplateLibrary = true;
        this.loadTemplates();
    }

    bundleCurrentCalendarIntoProgram(): void {
        const coach = JSON.parse(localStorage.getItem('user') || '{}');
        if (!coach.id || !this.athleteId) return;

        if (this.sessions.length === 0) {
            alert('No sessions found in the current calendar view to assign.');
            return;
        }

        this.isAssigning = true;
        const sortedSessions = [...this.sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const firstSessionDate = new Date(sortedSessions[0].date);

        const payload: Partial<Program> = {
            name: `Custom Routine - ${format(firstSessionDate, 'MMM d, yyyy')}`,
            description: 'Custom routine built directly in the calendar.',
            coachId: coach.id,
            athleteId: this.athleteId,
            status: 'assigned',
            startDate: firstSessionDate,
            isConfigured: false,
            days: sortedSessions.map((s) => {
                const date = new Date(s.date);
                date.setHours(0, 0, 0, 0);
                const firstDate = new Date(firstSessionDate);
                firstDate.setHours(0, 0, 0, 0);
                
                const dayNum = Math.round((date.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                return {
                    day_number: dayNum,
                    title: s.title || 'Workout Session',
                    exercises: s.workoutData?.exercises.map((ex: any, idx: number) => ({
                        exercise_id: ex.id || ex.exercise_id,
                        exercise_name: ex.name,
                        exercise_gif: ex.gifUrl || ex.exercise_gif,
                        videoId: ex.videoId,
                        videoTitle: ex.videoTitle,
                        sets: ex.sets,
                        reps: ex.reps,
                        rest_seconds: ex.rest,
                        order: ex.order !== undefined ? ex.order : idx
                    })) || []
                };
            })
        };

        this.programService.create(payload).subscribe({
            next: () => {
                this.isAssigning = false;
                alert('Success! Custom program bundled and assigned to athlete.');
            },
            error: (err: any) => {
                console.error('Assign failed:', err);
                this.isAssigning = false;
                alert('Failed to bundle and assign program.');
            }
        });
    }

    applyTemplate(template: Program): void {
        if (!this.athleteId || !template.id) return;

        const proceed = () => {
            this.isApplyingTemplate = true;
            this.programService.getById(template.id!).subscribe({
                next: (fullTemplate) => {
                    const newSessions: any[] = [];
                    const anchorDate = this.selectedDate || this.days[0];
                    const preferredDays = this.athlete?.preferredTrainingDays || [0, 1, 2, 3, 4, 5, 6];

                    const coach = JSON.parse(localStorage.getItem('user') || '{}');
                    const weeksCount = this.blueprintRepeatWeeks || 1;

                    for (let w = 0; w < weeksCount; w++) {
                        let currentDate = addDays(new Date(anchorDate), w * 7);
                        
                        fullTemplate.days.forEach(day => {
                            while (true) {
                                const dayOfWeek = (getDay(currentDate) + 6) % 7;
                                if (preferredDays.includes(dayOfWeek)) {
                                    const sessionPayload = {
                                        athleteId: this.athleteId,
                                        coachId: coach.id,
                                        programId: fullTemplate.id,
                                        date: format(currentDate, 'yyyy-MM-dd'),
                                        title: day.title,
                                        time: '12:00',
                                        type: fullTemplate.type || 'Strength',
                                        workoutData: {
                                            exercises: day.exercises.map(e => ({
                                                exercise_id: e.exercise_id,
                                                name: e.exercise_name,
                                                gifUrl: e.exercise_gif,
                                                videoId: (e as any).videoId,
                                                videoTitle: (e as any).videoTitle,
                                                sets: e.sets,
                                                reps: e.reps,
                                                order: e.order
                                            }))
                                        }
                                    };
                                    newSessions.push(this.sessionService.create(sessionPayload));
                                    currentDate = addDays(currentDate, 1);
                                    break;
                                }
                                currentDate = addDays(currentDate, 1);
                            }
                        });
                    }

                    if (newSessions.length > 0) {
                        import('rxjs').then(({ forkJoin }) => {
                            forkJoin(newSessions).subscribe({
                                next: () => {
                                    this.isApplyingTemplate = false;
                                    this.showTemplateLibrary = false;
                                    alert(`Applied "${template.name}" template starting from ${format(anchorDate, 'MMM d')}`);
                                    this.loadSessions();
                                },
                                error: (err) => {
                                    console.error('Error applying template:', err);
                                    this.isApplyingTemplate = false;
                                }
                            });
                        });
                    } else {
                        this.isApplyingTemplate = false;
                    }
                },
                error: () => this.isApplyingTemplate = false
            });
        };

        const upcomingSessions = this.sessions.filter(s => s.status === 'upcoming');
        if (upcomingSessions.length > 0) {
            if (confirm(`This blueprint will add new sessions. Would you like to CLEAR the existing ${upcomingSessions.length} upcoming sessions first for a clean schedule?`)) {
                this.isLoading = true;
                import('rxjs').then(({ forkJoin }) => {
                    const deletions = upcomingSessions.map(s => this.sessionService.delete(s.id!));
                    forkJoin(deletions).subscribe({
                        next: () => proceed(),
                        error: () => proceed()
                    });
                });
            } else {
                proceed();
            }
        } else {
            proceed();
        }
    }

    generateCalendar(): void {
        let start: Date;
        let end: Date;

        if (this.viewMode === '1 Week') {
            start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
            end = endOfWeek(this.currentDate, { weekStartsOn: 1 });
        } else if (this.viewMode === '2 Week') {
            start = startOfWeek(this.currentDate, { weekStartsOn: 1 });
            end = endOfWeek(addWeeks(this.currentDate, 1), { weekStartsOn: 1 });
        } else {
            start = startOfWeek(startOfMonth(this.currentDate), { weekStartsOn: 1 });
            end = endOfWeek(endOfMonth(this.currentDate), { weekStartsOn: 1 });
        }

        this.days = eachDayOfInterval({ start, end });
        if (this.athlete && !this.isPreviewMode) this.loadSessions();
    }

    nextRange(): void {
        const skip = this.viewMode === '4 Week' ? 1 : (this.viewMode === '2 Week' ? 2 : 1);
        this.currentDate = this.viewMode === '4 Week' ? addWeeks(this.currentDate, 4) : addWeeks(this.currentDate, skip);
        this.generateCalendar();
    }

    prevRange(): void {
        const skip = this.viewMode === '4 Week' ? 1 : (this.viewMode === '2 Week' ? 2 : 1);
        this.currentDate = this.viewMode === '4 Week' ? subWeeks(this.currentDate, 4) : subWeeks(this.currentDate, skip);
        this.generateCalendar();
    }

    setToday(): void {
        this.currentDate = new Date();
        this.generateCalendar();
    }

    setViewMode(mode: '1 Week' | '2 Week' | '4 Week'): void {
        this.viewMode = mode;
        this.generateCalendar();
    }

    getSessionsForDay(day: Date): Session[] {
        const daySessions = this.sessions.filter(s => isSameDay(new Date(s.date), day));
        

        const unique: Session[] = [];
        const seen = new Set<string>();
        
        daySessions.forEach(s => {

            const key = `${s.title?.toLowerCase().trim()}-${s.type?.toLowerCase().trim()}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(s);
            }
        });
        
        return unique;
    }

    isSessionCompleted(session: Session): boolean {

        return this.completedLogs.some(log => {
            const sameDay = isSameDay(new Date(log.scheduledDate), new Date(session.date));
            const sameProgram = !session.programId || log.programId === session.programId;
            return sameDay && sameProgram;
        });
    }

    isSessionMissed(session: Session): boolean {
        if (this.isSessionCompleted(session)) return false;
        if (session.status === 'completed') return false;
        
        const sessionDate = new Date(session.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return isBefore(sessionDate, today);
    }

    onDragStart(event: DragEvent, session: Session) {
        if (!this.isMasterMode && !this.isPreviewMode) {
            this.draggedSession = session;
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'copyMove';
                event.dataTransfer.setData('text/plain', session.id?.toString() || '');
            }
        }
    }

    onDragOver(event: DragEvent) {
        if (!this.isMasterMode && !this.isPreviewMode) {
            event.preventDefault();
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = event.ctrlKey ? 'copy' : 'move';
            }
        }
    }

    onDrop(event: DragEvent, targetDate: Date) {
        if (this.isMasterMode || this.isPreviewMode) return;
        event.preventDefault();
        
        if (!this.draggedSession || !this.athleteId) return;

        const isCopy = event.ctrlKey;
        const newDateStr = format(targetDate, 'yyyy-MM-dd');
        
        const coach = JSON.parse(localStorage.getItem('user') || '{}');

        if (isCopy) {

            const payload = {
                athleteId: this.athleteId,
                coachId: coach.id,
                programId: this.draggedSession.programId,
                date: newDateStr,
                time: this.draggedSession.time || '12:00',
                title: this.draggedSession.title,
                type: this.draggedSession.type || 'Strength',
                duration: this.draggedSession.duration || 45,
                status: 'upcoming',
                workoutData: this.draggedSession.workoutData
            };
            this.sessionService.create(payload).subscribe({
                next: () => this.loadSessions(),
                error: (err) => console.error('Error duplicating session', err)
            });

            if (!this.draggedSession.id) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const targetDate = new Date(newDateStr);
            if (isBefore(targetDate, today)) {
                alert('You cannot move a workout to a date in the past.');
                this.draggedSession = null;
                return;
            }

            this.sessionService.update(this.draggedSession.id, { date: newDateStr }).subscribe({
                next: () => this.loadSessions(),
                error: (err) => console.error('Error moving session', err)
            });
        }
        
        this.draggedSession = null;
    }

    openWorkoutBuilder(date: Date, session?: any): void {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (isBefore(date, today) && !this.isMasterMode) {
            alert('Selection Restricted: You cannot add or edit workouts for past dates.');
            return;
        }

        this.selectedDate = date;

        this.selectedSession = this.sessions.find(s => isSameDay(new Date(s.date), date));
        this.showWorkoutBuilder = true;
    }

    onWorkoutSaved(newSession: any): void {
        const index = this.sessions.findIndex(s => isSameDay(new Date(s.date), this.selectedDate!));
        if (index > -1 && !this.isMasterMode) {
            this.loadSessions();
        } else {
            if (newSession) {
                this.sessions = [...this.sessions.filter(s => !isSameDay(new Date(s.date), this.selectedDate!)), newSession];
            }
        }
        this.showWorkoutBuilder = false;
    }

    saveMasterPlanner(): void {
        this.showSaveModal = true;
    }

    confirmSaveMaster(): void {
        this.isSavingTemplate = true;


        const firstDay = this.days[0];
        const days: any[] = this.sessions.map(s => {
            const date = new Date(s.date);
            const dayNum = Math.floor((date.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            return {
                day_number: dayNum,
                title: s.title,
                exercises: s.workoutData?.exercises.map((ex: any, idx: number) => ({
                    exercise_id: ex.id,
                    exercise_name: ex.name,
                    exercise_gif: ex.gifUrl,
                    videoId: ex.videoId,
                    videoTitle: ex.videoTitle,
                    sets: ex.sets,
                    reps: ex.reps,
                    rest_seconds: ex.rest,
                    order: ex.order !== undefined ? ex.order : idx
                })) || []
            };
        });




        const coach = JSON.parse(localStorage.getItem('user') || '{}');
        const payload: Partial<Program> = {
            name: this.programTitle,
            description: this.programDescription,
            coachId: coach.id,
            status: 'draft',
            startDate: new Date(),
            days: days
        };

        const request = this.masterProgramId
            ? this.programService.update(this.masterProgramId, payload)
            : this.programService.create(payload);

        request.subscribe({
            next: () => {
                this.isSavingTemplate = false;
                this.showSaveModal = false;
                alert('Master Program Saved to Drafts!');
                this.router.navigate(['/dashboard/programs']);
            },
            error: (err) => {
                console.error('Error saving master program:', err);
                this.isSavingTemplate = false;
                alert('Failed to save master program.');
            }
        });
    }

    deleteSession(session: any, event?: MouseEvent): void {
        if (event) event.stopPropagation();
        
        if (this.isMasterMode || this.isPreviewMode) {
            this.sessions = this.sessions.filter(s => s !== session);
            return;
        }

        if (!session.id) {
            this.sessions = this.sessions.filter(s => s !== session);
            return;
        }

        if (confirm('Delete this workout from the calendar?')) {
            this.sessionService.delete(session.id).subscribe({
                next: () => this.loadSessions(),
                error: (err) => console.error('Error deleting session', err)
            });
        }
    }

    clearCalendar(): void {
        if (!this.athleteId || this.isMasterMode || this.isPreviewMode) return;
        const upcomingSessions = this.sessions.filter(s => s.status === 'upcoming');
        if (upcomingSessions.length === 0) {
            alert('No upcoming sessions to clear in this view.');
            return;
        }

        if (confirm(`This will permanently delete ALL ${upcomingSessions.length} upcoming sessions for this athlete. Use this to fix duplicated workouts or to totally reset their schedule. Proceed?`)) {
            this.isLoading = true;
            import('rxjs').then(({ forkJoin }) => {
                const deletions = upcomingSessions.map(s => this.sessionService.delete(s.id!));
                forkJoin(deletions).subscribe({
                    next: () => {
                        this.isLoading = false;
                        alert('Calendar cleared successfully.');
                        this.loadSessions();
                    },
                    error: (err) => {
                        this.isLoading = false;
                        console.error('Error clearing calendar', err);
                        alert('Some sessions could not be deleted.');
                        this.loadSessions();
                    }
                });
            });
        }
    }

    isPast(day: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return isBefore(day, today);
    }

    isDayToday(day: Date): boolean {
        return isToday(day);
    }

    isDayAvailable(day: Date): boolean {

        if (!this.athleteId || this.isMasterMode) return true;


        if (!this.athlete?.preferredTrainingDays || this.athlete.preferredTrainingDays.length === 0) return true;

        const dayOfWeek = (getDay(day) + 6) % 7;
        return this.athlete.preferredTrainingDays.includes(dayOfWeek);
    }

    formatDateRange(): string {
        if (this.days.length === 0) return '';
        const start = this.days[0];
        const end = this.days[this.days.length - 1];
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
}
