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
  isLoadingPrograms = false;


  athletes: Athlete[] = [];
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
    this.programService.getAll({ coachId: currentUser.id }).subscribe({
      next: (data) => {
        this.programs = data;
        this.isLoadingPrograms = false;
      },
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
    if (!this.assigningProgram || !this.assignModalAthleteId) return;
    this.isAssigning = true;
    const startDate = new Date().toISOString().split('T')[0];
    this.programService.update(this.assigningProgram.id!, {
      athleteId: this.assignModalAthleteId,
      status: 'assigned',
      isConfigured: false,
      startDate
    }).subscribe({
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
}
