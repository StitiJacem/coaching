import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { AuthService } from '../../../services/auth.service';
import { CoachService, CoachingRequest } from '../../../services/coach.service';
import { ChatService } from '../../../services/chat.service';

import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { InviteModalComponent } from './invite-modal/invite-modal.component';

@Component({
  selector: 'app-athletes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DashboardLayoutComponent, InviteModalComponent],
  templateUrl: './athletes.component.html',
  styleUrls: ['./athletes.component.css']
})
export class AthletesComponent implements OnInit {
  athletes: Athlete[] = [];
  isLoading = true;
  searchTerm = '';
  showInviteModal = false;

  constructor(
    public roleService: RoleService,
    private athleteService: AthleteService,
    private authService: AuthService,
    private coachService: CoachService,
    private chatService: ChatService,
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
    this.router.navigate(['/dashboard/athletes', athlete.id, 'overview']);
  }

  onDisconnect(athlete: Athlete): void {
    if (!athlete.id) return;
    if (confirm(`Are you sure you want to terminate your connection with ${athlete.user?.first_name}? This will remove them from your client list.`)) {
      this.coachService.disconnectAthlete(athlete.id).subscribe({
        next: () => {
          this.athletes = this.athletes.filter(a => a.id !== athlete.id);
          alert('Connection terminated successfully.');
        },
        error: (err: any) => {
          console.error('Error terminating connection:', err);
          alert('Failed to terminate connection.');
        }
      });
    }
  }
}
