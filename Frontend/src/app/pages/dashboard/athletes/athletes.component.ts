import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';

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

  constructor(
    public roleService: RoleService,
    private athleteService: AthleteService,
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
}
