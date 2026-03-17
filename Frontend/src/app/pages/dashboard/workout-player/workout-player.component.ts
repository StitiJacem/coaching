import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { WorkoutLogService, WorkoutLog, ExerciseLog } from '../../../services/workout-log.service';

@Component({
    selector: 'app-workout-player',
    standalone: false,
    templateUrl: './workout-player.component.html',
    styleUrls: ['./workout-player.component.css']
})
export class WorkoutPlayerComponent implements OnInit, OnDestroy {
    workoutLog: (WorkoutLog & { exerciseLogs?: ExerciseLog[] }) | null = null;
    exercises: any[] = [];
    currentExerciseIndex = 0;
    isLoading = true;
    isCompleting = false;
    showCompletionScreen = false;
    startTime: Date = new Date();
    elapsedSeconds = 0;
    timerInterval: any;
    overallRating = 5;
    completionNotes = '';


    currentSetLogs: { reps: number; weightKg: number }[] = [];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private workoutLogService: WorkoutLogService
    ) { }

    ngOnInit(): void {
        const id = parseInt(this.route.snapshot.paramMap.get('id') || '0');
        if (!id) { this.router.navigate(['/dashboard']); return; }
        this.loadWorkout(id);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    loadWorkout(id: number): void {
        this.workoutLogService.getById(id).subscribe({
            next: (log: any) => {
                this.workoutLog = log;
                this.exercises = log.programDay?.exercises?.sort((a: any, b: any) => a.order - b.order) || [];
                this.isLoading = false;
                this.startTimer();
                this.initSetLogs();
            },
            error: () => {
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            }
        });
    }

    startTimer(): void {
        this.startTime = new Date();
        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000);
        }, 1000);
    }

    initSetLogs(): void {
        const ex = this.currentExercise;
        if (!ex) return;
        this.currentSetLogs = Array.from({ length: ex.sets || 3 }, () => ({ reps: ex.reps || 12, weightKg: 0 }));
    }

    get currentExercise(): any {
        return this.exercises[this.currentExerciseIndex];
    }

    get progressPercent(): number {
        if (!this.exercises.length) return 0;
        return Math.round(((this.currentExerciseIndex + 1) / this.exercises.length) * 100);
    }

    get formattedTime(): string {
        const m = Math.floor(this.elapsedSeconds / 60).toString().padStart(2, '0');
        const s = (this.elapsedSeconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    nextExercise(): void {
        this.saveCurrentExerciseLog();
        if (this.currentExerciseIndex < this.exercises.length - 1) {
            this.currentExerciseIndex++;
            this.initSetLogs();
        } else {
            this.showCompletionScreen = true;
            if (this.timerInterval) clearInterval(this.timerInterval);
        }
    }

    prevExercise(): void {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.initSetLogs();
        }
    }

    saveCurrentExerciseLog(): void {
        if (!this.workoutLog?.id || !this.currentExercise) return;
        const data: Partial<ExerciseLog> = {
            programExerciseId: this.currentExercise.id,
            exercise_name: this.currentExercise.exercise_name,
            exercise_id: this.currentExercise.exercise_id,
            setsCompleted: this.currentSetLogs.length,
            repsPerSet: this.currentSetLogs.map(s => s.reps),
            weightKgPerSet: this.currentSetLogs.map(s => s.weightKg),
        };
        this.workoutLogService.logExercise(this.workoutLog.id!, data).subscribe({
            error: (err) => console.error('Error logging exercise:', err)
        });
    }

    completeWorkout(): void {
        if (!this.workoutLog?.id) return;
        this.isCompleting = true;
        const durationMinutes = Math.round(this.elapsedSeconds / 60);
        this.workoutLogService.completeWorkout(this.workoutLog.id, durationMinutes, this.completionNotes, this.overallRating).subscribe({
            next: () => {
                this.isCompleting = false;
                this.router.navigate(['/dashboard/workout-history']);
            },
            error: (err: any) => {
                console.error('Error completing workout:', err);
                this.isCompleting = false;
            }
        });
    }

    trackByIndex(index: number): number { return index; }
}
