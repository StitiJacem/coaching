import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExerciseService, Exercise } from '../../services/exercise.service';
import { SessionService, Session } from '../../services/session.service';
import { AthleteService } from '../../services/athlete.service';
import { format } from 'date-fns';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-workout-builder-modal',
    templateUrl: './workout-builder-modal.component.html',
    styleUrls: ['./workout-builder-modal.component.css'],
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule]
})
export class WorkoutBuilderModalComponent implements OnInit {
    @Input() athleteId: number | null = null;
    @Input() date!: Date | null;
    @Input() existingSession: any = null;
    @Input() isDraft: boolean = false;
    @Output() close = new EventEmitter<void>();
    @Output() saved = new EventEmitter<any>();

    workoutTitle = 'New Workout';
    workoutType = 'Strength';
    workoutDuration = 45;
    workoutNotes = '';


    exercises: any[] = [];


    library: Exercise[] = [];
    searchQuery = '';
    activeBodyPart = 'ALL';
    isLoadingLibrary = false;
    isSaving = false;

    bodyParts = [
        { id: 'ALL', label: 'All' },
        { id: 'back', label: 'Back' },
        { id: 'cardio', label: 'Cardio' },
        { id: 'chest', label: 'Chest' },
        { id: 'lower arms', label: 'Arms' },
        { id: 'lower legs', label: 'Legs' },
        { id: 'neck', label: 'Neck' },
        { id: 'shoulders', label: 'Shoulders' },
        { id: 'upper arms', label: 'Triceps' },
        { id: 'upper legs', label: 'Glutes' },
        { id: 'waist', label: 'Abs' }
    ];


    playingVideoId: string | null = null;
    athleteWeight: number = 0;

    get safeVideoUrl(): SafeResourceUrl | null {
        if (!this.playingVideoId) return null;
        const url = `https://www.youtube.com/embed/${this.playingVideoId}?autoplay=1&rel=0&modestbranding=1`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }

    toggleVideo(exercise: any): void {
        if (this.playingVideoId === exercise.videoId) {
            this.playingVideoId = null;
        } else {
            this.playingVideoId = exercise.videoId || null;
        }
    }

    constructor(
        private exerciseService: ExerciseService,
        private sessionService: SessionService,
        private athleteService: AthleteService, // Injected for smart weight calc
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.loadLibrary();
        if (this.existingSession) {
            this.loadExistingSession();
        }
        
        // Fetch athlete body metrics for smart target weight auto-fill
        if (this.athleteId) {
            this.athleteService.getById(this.athleteId).subscribe({
                next: (athlete) => {
                    if (athlete && athlete.weight) {
                        this.athleteWeight = athlete.weight;
                    }
                },
                error: (err) => console.error('Could not fetch athlete weight:', err)
            });
        }
    }

    loadExistingSession(): void {
        this.workoutTitle = this.existingSession.title || 'New Workout';
        this.workoutType = this.existingSession.type || 'Strength';
        this.workoutDuration = this.existingSession.duration || 45;
        this.workoutNotes = this.existingSession.notes || '';
        if (this.existingSession.workoutData?.exercises) {
            this.exercises = JSON.parse(JSON.stringify(this.existingSession.workoutData.exercises));
            this.exercises.forEach(ex => {
                if (!ex.targetWeights) ex.targetWeights = [];
                const sets = ex.sets || 1;
                while(ex.targetWeights.length < sets) {
                    ex.targetWeights.push(0);
                }
                if(ex.targetWeights.length > sets) {
                    ex.targetWeights.length = sets;
                }
            });
        }
    }

    loadLibrary(): void {
        this.isLoadingLibrary = true;
        this.exerciseService.getAllExercises(50).subscribe({
            next: (data) => {
                this.library = data;
                this.isLoadingLibrary = false;
            },
            error: () => this.isLoadingLibrary = false
        });
    }

    onSearch(): void {
        if (!this.searchQuery.trim()) {
            this.loadLibrary();
            return;
        }
        this.isLoadingLibrary = true;
        this.exerciseService.searchExercises(this.searchQuery).subscribe({
            next: (data) => {
                this.library = data;
                this.isLoadingLibrary = false;
            },
            error: () => this.isLoadingLibrary = false
        });
    }

    filterByBodyPart(part: string): void {
        this.activeBodyPart = part;
        if (part === 'ALL') {
            this.loadLibrary();
            return;
        }
        this.isLoadingLibrary = true;
        this.exerciseService.getByBodyPart(part).subscribe({
            next: (data) => {
                this.library = data;
                this.isLoadingLibrary = false;
            },
            error: () => this.isLoadingLibrary = false
        });
    }

    addToWorkout(exercise: Exercise): void {
        const alreadyAdded = this.exercises.some(e => e.id === exercise.id);
        if (alreadyAdded) return;

        // Auto-calculate smart target weight based on body weight if available
        let targetWeight = 0;
        if (this.athleteWeight && this.athleteWeight > 0) {
            const exerciseName = exercise.name.toLowerCase();
            // Basic estimation logic based on body weight percentages for beginners/intermediates
            if (exerciseName.includes('squat')) {
                targetWeight = Math.round(this.athleteWeight * 0.7); // 70% BW
            } else if (exerciseName.includes('bench press') || exerciseName.includes('chest press')) {
                targetWeight = Math.round(this.athleteWeight * 0.6); // 60% BW
            } else if (exerciseName.includes('deadlift')) {
                targetWeight = Math.round(this.athleteWeight * 0.8); // 80% BW
            } else if (exerciseName.includes('overhead press') || exerciseName.includes('military press')) {
                targetWeight = Math.round(this.athleteWeight * 0.4); // 40% BW
            } else if (exerciseName.includes('curl') || exerciseName.includes('extension')) {
                targetWeight = Math.round(this.athleteWeight * 0.15); // 15% BW
            } else if (exerciseName.includes('row') || exerciseName.includes('pull-down')) {
                targetWeight = Math.round(this.athleteWeight * 0.5); // 50% BW
            }
        }

        this.exercises.push({
            id: exercise.id,
            name: exercise.name,
            gifUrl: exercise.gifUrl,
            bodyPart: exercise.bodyPart,
            videoId: exercise.videoId,
            videoTitle: exercise.videoTitle,
            sets: 3,
            reps: 12,
            rest: 60,
            targetWeights: [targetWeight, targetWeight, targetWeight],
            notes: ''
        });
    }

    onSetsChange(item: any): void {
        const newSets = item.sets || 1;
        if (!item.targetWeights) item.targetWeights = [];
        
        while (item.targetWeights.length < newSets) {
            item.targetWeights.push(0);
        }
        if (item.targetWeights.length > newSets) {
            item.targetWeights.length = newSets;
        }
    }

    removeExercise(index: number): void {
        this.exercises.splice(index, 1);
    }

    saveWorkout(): void {
        if (this.exercises.length === 0) {
            alert('Please add at least one exercise.');
            return;
        }

        const coach = JSON.parse(localStorage.getItem('user') || '{}');

        const sessionData: any = {
            athleteId: this.athleteId,
            coachId: coach.id,
            date: this.date ? format(this.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
            time: '08:00',
            type: this.workoutType,
            title: this.workoutTitle,
            notes: this.workoutNotes,
            duration: this.workoutDuration,
            status: 'upcoming',
            workoutData: {
                exercises: this.exercises
            }
        };

        if (this.athleteId && !this.isDraft) {
            this.isSaving = true;
            const request = this.existingSession?.id
                ? this.sessionService.update(this.existingSession.id, sessionData)
                : this.sessionService.create(sessionData);

            request.subscribe({
                next: (res) => {
                    this.isSaving = false;
                    this.saved.emit(res);
                },
                error: (err) => {
                    console.error('Error saving workout:', err);
                    this.isSaving = false;
                    const errorMsg = err.error?.message || 'Failed to save workout.';
                    alert(errorMsg);
                }
            });
        } else {
            // Emitting to parent for local staging
            this.saved.emit(sessionData);
        }
    }
}
