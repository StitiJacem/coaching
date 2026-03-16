import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AthleteService, Athlete } from '../../../../services/athlete.service';
import { SessionService, Session } from '../../../../services/session.service';
import { ProgramService, Program } from '../../../../services/program.service';
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
    getDay
} from 'date-fns';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { WorkoutBuilderModalComponent } from '../../../../components/workout-builder/workout-builder-modal.component';

@Component({
    selector: 'app-training-calendar',
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, DashboardLayoutComponent, WorkoutBuilderModalComponent],
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

    // Master Planner State
    isMasterMode = false;
    masterProgramId: number | null = null;
    programTitle = 'New Training Program';
    programDescription = '';
    showSaveModal = false;
    isSavingTemplate = false;

    // Template Library State
    showTemplateLibrary = false;
    templates: Program[] = [];
    isLoadingTemplates = false;
    isApplyingTemplate = false;

    // Preview Mode State (Athlete consulting a new assignment)
    isPreviewMode = false;
    previewProgramId: number | null = null;
    previewProgram: Program | null = null;

    // Acceptance Configuration (within Preview Mode)
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
        private programService: ProgramService
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
            error: (err) => console.error('Error loading athlete:', err)
        });
    }

    loadSessions(): void {
        if (this.isMasterMode) return;
        this.isLoading = true;
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
            }
        });
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

        // Sync calendar view with start date
        this.currentDate = new Date(start);
        this.generateCalendar();

        this.sessions = [];

        // If no days selected, we fall back to sequential or empty
        if (this.acceptSelectedDays.length === 0) {
            this.previewProgram.days.forEach(day => {
                const date = addDays(start, day.day_number - 1);
                this.sessions.push(this.mapDayToSession(day, date));
            });
            return;
        }

        // Logic: Map program days to selected week days
        let currentDate = new Date(start);
        this.previewProgram.days.forEach(day => {
            // Find next available training day
            while (true) {
                const dayOfWeek = (getDay(currentDate) + 6) % 7; // Map to 0 (Mon) - 6 (Sun)
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
        // In the new flow, the coach has already scheduled it on valid days.
        // We just need to activate the program.
        this.programService.acceptProgram(this.previewProgramId, {}).subscribe({
            next: () => {
                this.isAccepting = false;
                alert('Success! Your program is now active.');
                this.router.navigate(['/dashboard']);
            },
            error: (err) => {
                console.error('Error accepting program:', err);
                this.isAccepting = false;
                alert('Failed to activate program. Please try again.');
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

    applyTemplate(template: Program): void {
        if (!this.athleteId || !template.id) return;
        this.isApplyingTemplate = true;

        this.programService.getById(template.id).subscribe({
            next: (fullTemplate) => {
                const newSessions: any[] = [];
                const anchorDate = this.selectedDate || this.days[0];
                const preferredDays = this.athlete?.preferredTrainingDays || [0, 1, 2, 3, 4, 5, 6];

                let currentDate = new Date(anchorDate);
                fullTemplate.days.forEach(day => {
                    // Smart Mapping: Find next available preferred day
                    while (true) {
                        const dayOfWeek = (getDay(currentDate) + 6) % 7;
                        if (preferredDays.includes(dayOfWeek)) {
                            const sessionPayload = {
                                athleteId: this.athleteId,
                                coachId: fullTemplate.coachId,
                                date: format(currentDate, 'yyyy-MM-dd'),
                                title: day.title,
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

                // Batch create sessions (simulated via multiple calls for now, ideally one endpoint)
                // For simplicity in this demo, we'll just alert and reload
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
                }
            },
            error: () => this.isApplyingTemplate = false
        });
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
        return this.sessions.filter(s => isSameDay(new Date(s.date), day));
    }

    openWorkoutBuilder(day: Date): void {
        this.selectedDate = day;
        // Find existing session on this day
        this.selectedSession = this.sessions.find(s => isSameDay(new Date(s.date), day));
        this.showWorkoutBuilder = true;
    }

    onWorkoutSaved(newSession: any): void {
        // Find existing session on this day and replace it, or add new
        const index = this.sessions.findIndex(s => isSameDay(new Date(s.date), this.selectedDate!));
        if (index > -1 && !this.isMasterMode) {
            // In athlete mode, we might want to reload or update specific session
            this.loadSessions();
        } else {
            if (newSession) {
                // In master mode, we store dates relative to the view's start
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

        // Convert dummy Sessions back to ProgramDays
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

        // Filter out logic: only keep days that actually have exercises (if needed)
        // or just send all that were added to the calendar.

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

    isDayToday(day: Date): boolean {
        return isToday(day);
    }

    isDayAvailable(day: Date): boolean {
        // If not in athlete calendar mode (e.g. master planner), all days are visible
        if (!this.athleteId || this.isMasterMode) return true;

        // If athlete hasn't set preferences, all days available by default
        if (!this.athlete?.preferredTrainingDays || this.athlete.preferredTrainingDays.length === 0) return true;

        const dayOfWeek = (getDay(day) + 6) % 7; // Map to 0 (Mon) - 6 (Sun)
        return this.athlete.preferredTrainingDays.includes(dayOfWeek);
    }

    formatDateRange(): string {
        if (this.days.length === 0) return '';
        const start = this.days[0];
        const end = this.days[this.days.length - 1];
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
}
