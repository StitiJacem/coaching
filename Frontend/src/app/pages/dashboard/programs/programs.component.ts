import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { ExerciseService, Exercise } from '../../../services/exercise.service';
import { ProgramService, ProgramDay, ProgramExercise, Program } from '../../../services/program.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-programs',
  standalone: false,
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css']
})
export class ProgramsComponent implements OnInit {
  isCreating = false;
  programs: Program[] = [];
  isLoadingPrograms = false;
  editingProgramId: number | null = null;

  programTitle = '';

  // Athlete assignment
  athletes: Athlete[] = [];
  selectedAthleteId: number | null = null;
  isLoadingAthletes = false;

  // Assign modal state
  showAssignModal = false;
  assigningProgram: Program | null = null;
  assignModalAthleteId: number | null = null;
  isAssigning = false;

  // Multi-Day State
  days: ProgramDay[] = [];
  activeDayIndex = 0;

  // Exercise Library State
  exerciseLibrary: Exercise[] = [];
  searchQuery = '';
  activeMuscleFilter = 'ALL';
  isLoadingExercises = false;

  muscles = [
    { id: 'ALL', label: 'All' },
    { id: 'abs', label: 'Abs' },
    { id: 'back', label: 'Back' },
    { id: 'biceps', label: 'Biceps' },
    { id: 'chest', label: 'Chest' },
    { id: 'legs', label: 'Legs' },
    { id: 'shoulders', label: 'Shoulders' },
    { id: 'triceps', label: 'Triceps' }
  ];

  constructor(
    public roleService: RoleService,
    private exerciseService: ExerciseService,
    private programService: ProgramService,
    private athleteService: AthleteService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadInitialExercises();
    this.loadPrograms();
    this.loadAthletes();
  }

  loadPrograms(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) return;
    this.isLoadingPrograms = true;
    this.programService.getAll({ coachId: currentUser.id }).subscribe({
      next: (data) => { this.programs = data; this.isLoadingPrograms = false; },
      error: () => { this.isLoadingPrograms = false; }
    });
  }

  loadAthletes(): void {
    this.isLoadingAthletes = true;
    this.athleteService.getAll().subscribe({
      next: (data) => { this.athletes = data; this.isLoadingAthletes = false; },
      error: () => { this.isLoadingAthletes = false; }
    });
  }

  loadInitialExercises(): void {
    this.isLoadingExercises = true;
    this.exerciseService.getAllExercises(50).subscribe({
      next: (data) => { this.exerciseLibrary = data; this.isLoadingExercises = false; },
      error: () => { this.isLoadingExercises = false; }
    });
  }

  searchExercises(): void {
    if (!this.searchQuery.trim()) { this.loadInitialExercises(); return; }
    this.isLoadingExercises = true;
    this.exerciseService.searchExercises(this.searchQuery).subscribe({
      next: (data) => { this.exerciseLibrary = data; this.isLoadingExercises = false; },
      error: () => { this.isLoadingExercises = false; }
    });
  }

  filterByMuscle(muscle: string): void {
    this.activeMuscleFilter = muscle;
    if (muscle === 'ALL') { this.loadInitialExercises(); return; }
    this.isLoadingExercises = true;
    this.exerciseService.getByBodyPart(muscle).subscribe({
      next: (data) => { this.exerciseLibrary = data; this.isLoadingExercises = false; },
      error: () => { this.isLoadingExercises = false; }
    });
  }

  startNewProgram(): void {
    this.isCreating = true;
    this.editingProgramId = null;
    this.selectedAthleteId = null;
    this.programTitle = 'New Training Program';
    this.days = [{ day_number: 1, title: 'Day 1: Initial Session', exercises: [] }];
    this.activeDayIndex = 0;
  }

  addDay(): void {
    const nextNum = this.days.length + 1;
    this.days.push({ day_number: nextNum, title: `Day ${nextNum}`, exercises: [] });
    this.activeDayIndex = this.days.length - 1;
  }

  removeDay(index: number): void {
    if (this.days.length > 1) {
      this.days.splice(index, 1);
      this.days.forEach((day, i) => { day.day_number = i + 1; });
      if (this.activeDayIndex >= this.days.length) this.activeDayIndex = this.days.length - 1;
    }
  }

  setActiveDay(index: number): void { this.activeDayIndex = index; }

  addExercise(exercise: Exercise): void {
    const activeDay = this.days[this.activeDayIndex];
    if (!activeDay) return;
    activeDay.exercises.push({
      exercise_id: exercise.id,
      exercise_name: exercise.name,
      exercise_gif: exercise.gifUrl,
      sets: 3,
      reps: 12,
      order: activeDay.exercises.length
    });
  }

  removeExercise(index: number): void {
    const activeDay = this.days[this.activeDayIndex];
    if (activeDay) activeDay.exercises.splice(index, 1);
  }

  getAthleteName(athlete: Athlete): string {
    if (athlete.user) {
      const name = `${athlete.user.first_name || ''} ${athlete.user.last_name || ''}`.trim();
      return name || athlete.user.email;
    }
    return `Athlete #${athlete.id}`;
  }

  saveProgram(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) { alert('Not logged in.'); return; }
    if (!this.selectedAthleteId) { alert('Please select an athlete to assign this program to.'); return; }

    const programPayload: Partial<Program> = {
      name: this.programTitle,
      coachId: currentUser.id,
      athleteId: this.selectedAthleteId,
      startDate: new Date(),
      status: 'active',
      days: this.days
    };

    const request = this.editingProgramId
      ? this.programService.update(this.editingProgramId, programPayload)
      : this.programService.create(programPayload);

    request.subscribe({
      next: () => {
        alert(this.editingProgramId ? 'Program updated!' : 'Program saved & assigned!');
        this.isCreating = false;
        this.editingProgramId = null;
        this.loadPrograms();
      },
      error: (err: any) => {
        console.error('Save failed:', err);
        alert('Failed to save program.');
      }
    });
  }

  editProgram(program: Program): void {
    this.isCreating = true;
    this.editingProgramId = program.id || null;
    this.programTitle = program.name;
    this.selectedAthleteId = program.athleteId || null;
    this.days = JSON.parse(JSON.stringify(program.days)) || [];
    this.activeDayIndex = 0;
  }

  assignToAthlete(program: Program): void {
    this.assigningProgram = program;
    this.assignModalAthleteId = program.athleteId || null;
    this.showAssignModal = true;
  }

  confirmAssign(): void {
    if (!this.assigningProgram || !this.assignModalAthleteId) return;
    this.isAssigning = true;
    this.programService.update(this.assigningProgram.id!, { athleteId: this.assignModalAthleteId, status: 'active' }).subscribe({
      next: () => {
        this.isAssigning = false;
        this.showAssignModal = false;
        this.assigningProgram = null;
        this.loadPrograms();
      },
      error: (err: any) => { console.error('Assign failed:', err); this.isAssigning = false; }
    });
  }

  cancelAssign(): void {
    this.showAssignModal = false;
    this.assigningProgram = null;
  }

  cancel(): void {
    this.isCreating = false;
    this.editingProgramId = null;
  }
}
