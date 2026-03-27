import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { ProgramService, Program } from '../../../services/program.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { AuthService } from '../../../services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';

@Component({
  selector: 'app-programs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DashboardLayoutComponent],
  templateUrl: './programs.component.html',
  styleUrls: ['./programs.component.css']
})
export class ProgramsComponent implements OnInit {
  programs: Program[] = [];
  athletePendingPrograms: Program[] = [];
  athleteActivePrograms: Program[] = [];
  isLoadingPrograms = false;

  athletes: Athlete[] = [];
  athlete: Athlete | null = null;
  isLoadingAthletes = false;


  showAssignModal = false;
  assigningProgram: Program | null = null;
  assignModalAthleteId: number | null = null;
  isAssigning = false;

  constructor(
    public roleService: RoleService,
    private programService: ProgramService,
    private athleteService: AthleteService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPrograms();
    this.loadAthletes();
    this.checkQueryParameters();
  }

  checkQueryParameters(): void {
    this.route.queryParams.subscribe(params => {
      if (params['athleteId']) {

      }
    });
  }

  loadPrograms(): void {
    const currentUser = this.authService.getUser();
    if (!currentUser) return;
    this.isLoadingPrograms = true;

    if (this.roleService.currentRole === 'coach') {
      this.fetchProgramsWithFilters({ coachId: currentUser.id });
    } else {
      // Find athlete record for current user
      this.athleteService.getAll().subscribe({
        next: (athletes) => {
          const found = athletes.find(a => a.userId === currentUser.id);
          if (found && found.id) {
            this.athlete = found;
            this.fetchProgramsWithFilters({ athleteId: found.id });
          } else {
            this.isLoadingPrograms = false;
          }
        },
        error: () => { this.isLoadingPrograms = false; }
      });
    }
  }

  private fetchProgramsWithFilters(filters: any): void {
    this.programService.getAll(filters).subscribe({
      next: (data) => {
        if (this.roleService.currentRole === 'athlete') {
            // For athletes, don't show draft or replaced programs in the main lists
            this.athletePendingPrograms = data.filter(p => p.status === 'assigned');
            this.athleteActivePrograms = data.filter(p => p.status === 'active');
            this.programs = data.filter(p => p.status !== 'draft' && p.status !== 'replaced' && p.status !== 'active' && p.status !== 'assigned');
        } else {
            this.programs = data;
        }
        this.isLoadingPrograms = false;
      },
      error: () => { this.isLoadingPrograms = false; }
    });
  }

  loadAthletes(): void {
    if (this.roleService.currentRole !== 'coach') return;
    this.isLoadingAthletes = true;
    this.athleteService.getAll().subscribe({
      next: (data) => { this.athletes = data; this.isLoadingAthletes = false; },
      error: () => { this.isLoadingAthletes = false; }
    });
  }

  viewProgram(program: Program): void {
      if (!program.id) return;

      if (program.status === 'assigned') {
          this.router.navigate(['/dashboard/program-preview', program.id]);
      } else {
          // If active or archived, go to the actual calendar
          const targetAthleteId = this.roleService.currentRole === 'athlete' ? this.athlete?.id : program.athleteId;
          if (targetAthleteId) {
              this.router.navigate(['/dashboard/athletes/training-calendar', targetAthleteId]);
          }
      }
  }


  declineProgram(program: Program): void {
      if (!program.id) return;
      if (confirm('Are you sure you want to decline this program?')) {
          this.programService.quitProgram(program.id).subscribe({
              next: () => {
                  alert('Program declined.');
                  this.loadPrograms();
              },
              error: (err: any) => console.error('Error declining program', err)
          });
      }
  }

  startNewProgram(): void {
    this.router.navigate(['/dashboard/master-planner']);
  }

  editProgram(program: Program): void {
    if (program.id) {
      this.router.navigate(['/dashboard/master-planner', program.id]);
    }
  }

  getAthleteName(athlete: Athlete): string {
    if (athlete.user) {
      const name = `${athlete.user.first_name || ''} ${athlete.user.last_name || ''}`.trim();
      return name || athlete.user.email;
    }
    return `Athlete #${athlete.id}`;
  }

  assignToAthlete(program: Program): void {
    this.assigningProgram = program;
    this.assignModalAthleteId = program.athleteId || null;
    this.showAssignModal = true;
  }

  confirmAssign(): void {
    if (!this.assigningProgram?.id || !this.assignModalAthleteId) return;
    this.isAssigning = true;
    this.programService.assign(this.assigningProgram.id, this.assignModalAthleteId).subscribe({
      next: () => {
        this.isAssigning = false;
        this.showAssignModal = false;
        this.assigningProgram = null;
        alert('Program assigned! The athlete has been notified and can accept it.');
        this.loadPrograms();
      },
      error: (err: any) => {
        console.error('Assign failed:', err);
        alert('Failed to assign program: ' + (err?.error?.message || 'Unknown error'));
        this.isAssigning = false;
      }
    });
  }

  cancelAssign(): void {
    this.showAssignModal = false;
    this.assigningProgram = null;
  }
}
