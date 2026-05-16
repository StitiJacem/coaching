import { Component, OnInit } from '@angular/core';
import { CoachService, Coach } from '../../../services/coach.service';
import { NutritionistService } from '../../../services/nutritionist.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmService } from '../../../services/confirm.service';

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
    { id: 'CROSSFIT', label: 'CrossFit' },
    { id: 'NUTRITION', label: 'Nutrition' }
  ];

  filteredCoaches: Coach[] = [];

  constructor(
    private coachService: CoachService,
    private nutritionistService: NutritionistService,
    private authService: AuthService,
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) { }

  ngOnInit(): void {
    this.loadCoaches();
  }

  loadCoaches(): void {
    this.isLoading = true;
    if (this.activeFilter === 'NUTRITION') {
      this.nutritionistService.getAllNutritionists().subscribe({
        next: (nutritionists: any[]) => {
          this.filteredCoaches = nutritionists.map(n => ({
            id: n.id,
            userId: n.userId,
            name: `${n.user?.first_name} ${n.user?.last_name}`,
            avatar: n.profilePicture || `https://ui-avatars.com/api/?name=${n.user?.first_name}+${n.user?.last_name}&background=random`,
            specializations: ['Nutritionist'],
            bio: n.bio || 'Professional Nutritionist',
            rating: n.rating,
            experience_years: n.experience_years,
            verified: n.verified || false,
            price: 50 // Default price for display
          }));
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading nutritionists:', err);
          this.isLoading = false;
        }
      });
    } else {
      this.coachService.getCoaches(this.activeFilter).subscribe({
        next: (coaches: Coach[]) => {
          this.filteredCoaches = coaches;
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading coaches:', err);
          this.isLoading = false;
        }
      });
    }
  }

  setFilter(filterId: string): void {
    this.activeFilter = filterId;
    this.loadCoaches();
  }

  async requestConnection(specialist: Coach): Promise<void> {
    const isNutritionist = this.activeFilter === 'NUTRITION' || specialist.specializations.includes('Nutritionist');
    const confirmed = await this.confirmService.ask(`Do you want to send a connection request to ${specialist.name}?`);
    
    if (confirmed) {
      if (isNutritionist) {
        const athleteId = this.authService.getUser()?.id;
        if (!athleteId) {
          this.toastService.showError('Error: Athlete ID not found. Please log in again.');
          return;
        }
        this.nutritionistService.sendConnectionRequest(athleteId, specialist.id).subscribe({
          next: () => {
            this.toastService.showSuccess('Nutritionist connection request sent! They will review your profile shortly.');
          },
          error: (err: any) => {
            this.toastService.showError(err.error?.message || 'Error sending request. Please try again.');
          }
        });
      } else {
        this.coachService.sendConnectionRequest(specialist.id).subscribe({
          next: (response: any) => {
            this.toastService.showSuccess('Connection request sent! They will review your profile shortly.');
          },
          error: (err: any) => {
            this.toastService.showError(err.error?.message || 'Error sending request. Please try again.');
          }
        });
      }
    }
  }
}
