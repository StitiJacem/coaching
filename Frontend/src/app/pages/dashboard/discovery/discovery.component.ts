import { Component, OnInit } from '@angular/core';
import { CoachService, Coach } from '../../../services/coach.service';

@Component({
  selector: 'app-discovery',
  standalone: false,
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.css']
})
export class DiscoveryComponent implements OnInit {
  activeFilter = 'ALL';
  isLoading = false;

  specializations = [
    { id: 'ALL', label: 'All Sports' },
    { id: 'PADEL', label: 'Padel' },
    { id: 'MUSCULATION', label: 'Musculation' },
    { id: 'CROSSFIT', label: 'CrossFit' }
  ];

  filteredCoaches: Coach[] = [];

  constructor(private coachService: CoachService) { }

  ngOnInit(): void {
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.isLoading = true;
    this.coachService.getCoaches(this.activeFilter).subscribe({
      next: (coaches) => {
        this.filteredCoaches = coaches;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading coaches:', err);
        this.isLoading = false;
      }
    });
  }

  setFilter(filterId: string): void {
    this.activeFilter = filterId;
    this.loadCoaches();
  }

  requestConnection(coach: Coach): void {
    if (confirm(`Do you want to send a connection request to ${coach.name}?`)) {
      this.coachService.sendConnectionRequest(coach.id).subscribe({
        next: (response) => {
          alert('Connection request sent matching! They will review your profile shortly.');
        },
        error: (err) => {
          alert(err.error?.message || 'Error sending request. Please try again.');
        }
      });
    }
  }
}
