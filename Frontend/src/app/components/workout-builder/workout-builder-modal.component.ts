import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ExerciseService, Exercise } from '../../services/exercise.service';
import { SessionService, Session } from '../../services/session.service';
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
        private sanitizer: DomSanitizer
    ) { }

    ngOnInit(): void {
        this.loadLibrary();
        if (this.existingSession) {
            this.loadExistingSession();
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
            targetWeights: [0, 0, 0],
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
                    alert('Failed to save workout.');
                }
            });
        } else {

            this.saved.emit(sessionData);
        }
    }
}
