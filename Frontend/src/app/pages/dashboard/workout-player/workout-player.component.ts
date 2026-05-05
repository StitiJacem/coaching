import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
    showOverviewMap = true;
    isCompleting = false;
    showCompletionScreen = false;
    showQuizModal = false;
    quizDifficulty = 5; // RPE 1-10
    quizForm = 3;       // Form 1-5
    quizPain = false;
    isSubmittingQuiz = false;
    startTime: Date = new Date();
    elapsedSeconds = 0;
    timerInterval: any;
    overallRating = 5;
    completionNotes = '';

    isRestTimerActive = false;
    restSecondsRemaining = 0;
    restTimerInterval: any;

    currentSetLogs: { reps: number; weightKg: number; done?: boolean }[] = [];
    currentSetIndex = 0;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private workoutLogService: WorkoutLogService,
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        const id = parseInt(this.route.snapshot.paramMap.get('id') || '0');
        if (!id) { this.router.navigate(['/dashboard']); return; }
        this.loadWorkout(id);
    }

    ngOnDestroy(): void {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    }

    loadWorkout(id: number): void {
        this.workoutLogService.getById(id).subscribe({
            next: (log: any) => {
                this.workoutLog = log;
                
                // Load exercises from either programDay OR standalone session
                let rawExercises = [];
                if (log.programDay?.exercises) {
                    rawExercises = log.programDay.exercises;
                } else if (log.session?.workoutData?.exercises) {
                    rawExercises = log.session.workoutData.exercises;
                } else if (log.session?.workoutData) {
                    // Handle case where workoutData might be a string (though it should be JSON)
                    try {
                        const data = typeof log.session.workoutData === 'string' ? JSON.parse(log.session.workoutData) : log.session.workoutData;
                        rawExercises = data.exercises || [];
                    } catch (e) {
                        console.error('Error parsing workoutData:', e);
                    }
                }
                
                this.exercises = rawExercises.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)) || [];
                this.isLoading = false;
                
                // Do not start timer or init sets until they pick an exercise from the map
                
                if (log.status === 'scheduled') {
                    this.workoutLogService.triggerWorkoutStart(id).subscribe({
                        next: (updated) => { this.workoutLog = { ...this.workoutLog!, ...updated }; },
                        error: () => {}
                    });
                }
            },
            error: () => {
                this.isLoading = false;
                this.router.navigate(['/dashboard']);
            }
        });
    }

    startAtExercise(index: number): void {
        this.currentExerciseIndex = index;
        this.showOverviewMap = false;
        if (!this.timerInterval) {
            this.startTimer();
        }
        this.initSetLogs();
    }

    returnToMap(): void {
        this.showOverviewMap = true;
    }

    isVideo(url: string | null | undefined): boolean {
        if (!url) return false;
        return url.toLowerCase().endsWith('.mp4') || url.toLowerCase().endsWith('.webm') || url.toLowerCase().endsWith('.mov');
    }

    isYouTube(url: string | null | undefined): boolean {
        if (!url) return false;
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    getYouTubeEmbedUrl(exercise: any): SafeResourceUrl | null {
        if (!exercise) return null;
        
        const url = exercise.exercise_gif;
        let videoId = '';
        
        if (url) {
            if (url.includes('youtu.be/')) {
                videoId = url.split('youtu.be/')[1].split('?')[0];
            } else if (url.includes('youtube.com/watch')) {
                try { videoId = new URL(url).searchParams.get('v') || ''; } catch(e){}
            } else if (url.includes('youtube.com/embed/')) {
                videoId = url.split('youtube.com/embed/')[1].split('?')[0];
            } else if (url.includes('youtube.com/shorts/')) {
                videoId = url.split('youtube.com/shorts/')[1].split('?')[0];
            }
        }
        
        if (videoId) {
            return this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`);
        }
        
        return null;
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
        this.currentSetIndex = 0;
        this.currentSetLogs = Array.from({ length: ex.sets || 3 }, (_, i) => ({ 
            reps: ex.reps || 12, 
            weightKg: ex.targetWeights && ex.targetWeights[i] ? ex.targetWeights[i] : 0, 
            done: false 
        }));
    }

    get targetReps(): number {
        return this.currentExercise?.reps ?? 12;
    }

    get currentSetLog(): { reps: number; weightKg: number } | null {
        return this.currentSetLogs[this.currentSetIndex] ?? null;
    }

    get allSetsDoneForExercise(): boolean {
        return this.currentSetLogs.every(s => s.done);
    }

    markSetDone(): void {
        if (this.currentSetIndex >= this.currentSetLogs.length) return;
        this.currentSetLogs[this.currentSetIndex].done = true;
        
        if (this.currentSetIndex === 0 && this.currentSetLogs.length > 1) {
            this.quizDifficulty = 5;
            this.quizForm = 3;
            this.quizPain = false;
            this.showQuizModal = true;
        } else if (this.currentSetIndex < this.currentSetLogs.length - 1) {
            this.startRestTimer();
        }
    }

    startRestTimer(): void {
        if (this.currentSetIndex < this.currentSetLogs.length - 1) {
            this.currentSetIndex++;
            this.restSecondsRemaining = this.currentExercise?.rest_seconds || 60;
            this.isRestTimerActive = true;
            this.restTimerInterval = setInterval(() => {
                this.restSecondsRemaining--;
                if (this.restSecondsRemaining <= 0) {
                    this.skipRestTimer();
                }
            }, 1000);
        }
    }
    
    skipRestTimer(): void {
        if (this.restTimerInterval) clearInterval(this.restTimerInterval);
        this.isRestTimerActive = false;
        this.restSecondsRemaining = 0;
    }

    prevSet(): void {
        if (this.currentSetIndex > 0) {
            this.currentSetLogs[this.currentSetIndex].done = false;
            this.currentSetIndex--;
        }
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
        if (!this.allSetsDoneForExercise && this.currentSetLogs.length > 1) return;
        this.saveCurrentExerciseLog();

        if (this.currentExerciseIndex < this.exercises.length - 1) {
            this.currentExerciseIndex++;
            this.initSetLogs();
        } else {
            this.showCompletionScreen = true;
            if (this.timerInterval) clearInterval(this.timerInterval);
        }
    }

    submitQuizAndProceed(): void {
        if (!this.workoutLog?.id || !this.currentExercise) return;
        this.isSubmittingQuiz = true;
        this.workoutLogService.emitWorkoutEvent(this.workoutLog.id, 'quiz_answer', {
            programExerciseId: this.currentExercise.id,
            exercise_name: this.currentExercise.exercise_name,
            rpe: this.quizDifficulty,
            form: this.quizForm,
            pain: this.quizPain
        }).subscribe({
            next: () => {
                this.showQuizModal = false;
                this.isSubmittingQuiz = false;
                this.startRestTimer();
            },
            error: () => { this.isSubmittingQuiz = false; }
        });
    }

    prevExercise(): void {
        if (this.currentExerciseIndex > 0) {
            this.currentExerciseIndex--;
            this.initSetLogs();
        } else if (this.currentSetIndex > 0) {
            this.prevSet();
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
