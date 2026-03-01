import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { ProgramService, Program } from '../../../services/program.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-athletes',
  standalone: false,
  templateUrl: './athletes.component.html',
  styleUrls: ['./athletes.component.css']
})
export class AthletesComponent implements OnInit {
  athletes: Athlete[] = [];
  isLoading = true;
  searchTerm = '';
  showInviteModal = false;

  // Assign Program State
  showAssignModal = false;
  selectedAthlete: Athlete | null = null;
  draftPrograms: Program[] = [];
  selectedProgramId: number | null | undefined = null;
  isLoadingDrafts = false;
  isAssigning = false;

  constructor(
    public roleService: RoleService,
    private athleteService: AthleteService,
    private programService: ProgramService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    if (this.roleService.currentRole === 'athlete') {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.loadAthletes();
  }

  loadAthletes(): void {
    this.isLoading = true;
    this.athleteService.getAll({ search: this.searchTerm }).subscribe({
      next: (data) => {
        this.athletes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading athletes:', err);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    this.loadAthletes();
  }

  onInvite(): void {
    this.showInviteModal = true;
  }

  getInitials(athlete: Athlete): string {
    const name = athlete.user?.first_name || '';
    const last = athlete.user?.last_name || '';
    return (name.charAt(0) + last.charAt(0)).toUpperCase() || 'A';
  }

  openAssignModal(athlete: Athlete): void {
    this.selectedAthlete = athlete;
    this.showAssignModal = true;
    this.loadDraftPrograms();
  }

  loadDraftPrograms(): void {
    const coach = this.authService.getUser();
    if (!coach) return;
    this.isLoadingDrafts = true;
    this.programService.getAll({ coachId: coach.id, status: 'draft' }).subscribe({
      next: (programs) => {
        this.draftPrograms = programs;
        this.isLoadingDrafts = false;
      },
      error: () => this.isLoadingDrafts = false
    });
  }

  confirmAssignment(): void {
    if (!this.selectedAthlete || !this.selectedProgramId) return;
    this.isAssigning = true;
    this.programService.update(this.selectedProgramId, {
      athleteId: this.selectedAthlete.id,
      status: 'active'
    }).subscribe({
      next: () => {
        alert('Program assigned successfully!');
        this.closeAssignModal();
        this.loadAthletes();
      },
      error: () => {
        alert('Failed to assign program.');
        this.isAssigning = false;
      }
    });
  }

  createNewForAthlete(): void {
    if (!this.selectedAthlete) return;
    // Navigate to programs page with athlete pre-selected
    // Using a simple query param or state would be ideal
    this.router.navigate(['/dashboard/programs'], {
      queryParams: { athleteId: this.selectedAthlete.id }
    });
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedAthlete = null;
    this.selectedProgramId = null;
    this.draftPrograms = [];
  }
}
