import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';

@Component({
  selector: 'app-goals',
  standalone: false,
  templateUrl: './goals.component.html',
  styleUrls: ['./goals.component.css']
})
export class GoalsComponent implements OnInit {
  isLoading = true;
  isSaving = false;
  athlete: Athlete | null = null;
  saveMessage = '';

  athletesList: Athlete[] = [];
  selectedAthleteIdForCoach: number | null = null;

  athleteFormData: any = {
    primaryObjective: '',
    targetMetric: '',
    deadline: '',
    timePerSession: '',
    injuries: '',
    experienceLevel: '',
    equipment: '',
    preferredTrainingDays: [] as number[]
  };

  constructor(
    public roleService: RoleService,
    private athleteService: AthleteService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.roleService.currentRole === 'coach') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadAthleteProfile();
  }

  loadAllAthletesForCoach() {
    this.athleteService.getAll().subscribe({
      next: (athletes) => {
        this.athletesList = athletes;
        if (athletes.length > 0) {
          this.selectedAthleteIdForCoach = athletes[0].id!;
          this.loadAthleteProfileForCoach(this.selectedAthleteIdForCoach);
        } else {
          this.isLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading athletes', err);
        this.isLoading = false;
      }
    });
  }

  loadAthleteProfileForCoach(id: number) {
    this.isLoading = true;
    this.athleteService.getById(id).subscribe({
      next: (athlete) => {
        this.athlete = athlete;
        this.populateFormData(athlete);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading athlete profile', err);
        this.isLoading = false;
      }
    });
  }

  onSelectAthlete(event: Event) {
    const id = +(event.target as HTMLSelectElement).value;
    if (id) {
      this.selectedAthleteIdForCoach = id;
      this.loadAthleteProfileForCoach(id);
    }
  }

  loadAthleteProfile() {
    this.athleteService.getAll().subscribe({
      next: (athletes) => {
        if (athletes.length > 0) {
          this.athlete = athletes[0];
          this.populateFormData(this.athlete);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading profile', err);
        this.isLoading = false;
      }
    });
  }

  populateFormData(athlete: Athlete) {
    this.athleteFormData = {
      primaryObjective: athlete.primaryObjective || '',
      targetMetric: athlete.targetMetric || '',
      deadline: athlete.deadline ? new Date(athlete.deadline).toISOString().split('T')[0] : '',
      timePerSession: athlete.timePerSession || '',
      injuries: athlete.injuries || '',
      experienceLevel: athlete.experienceLevel || '',
      equipment: athlete.equipment || '',
      preferredTrainingDays: athlete.preferredTrainingDays || []
    };
  }

  onSubmit() {
    if (!this.athlete?.id) return;
    this.isSaving = true;
    this.saveMessage = '';
    
    this.athleteService.update(this.athlete.id, this.athleteFormData).subscribe({
      next: () => {
        this.isSaving = false;
        this.saveMessage = 'Goals updated successfully! Your coach has been notified.';
        setTimeout(() => this.saveMessage = '', 3000);
      },
      error: (err) => {
        console.error('Error saving goals', err);
        this.isSaving = false;
      }
    });
  }

  toggleDay(dayNumber: number) {
    const currentDays = this.athleteFormData.preferredTrainingDays || [];
    const index = currentDays.indexOf(dayNumber);
    if (index === -1) {
      currentDays.push(dayNumber);
    } else {
      currentDays.splice(index, 1);
    }
    this.athleteFormData.preferredTrainingDays = currentDays;
  }

  hasDay(dayNumber: number): boolean {
    const currentDays = this.athleteFormData.preferredTrainingDays || [];
    return currentDays.includes(dayNumber);
  }
}
