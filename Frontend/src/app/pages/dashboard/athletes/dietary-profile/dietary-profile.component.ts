import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DietService, DietaryProfile } from '../../../../services/diet.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { RoleService } from '../../../../services/role.service';

@Component({
  selector: 'app-dietary-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, DashboardLayoutComponent, RouterLink],
  templateUrl: './dietary-profile.component.html',
  styleUrls: ['./dietary-profile.component.css'],
})
export class DietaryProfileComponent implements OnInit {
  athleteId!: number;
  profile: DietaryProfile | null = null;
  loading = true;
  isCustomizing = false;
  

  bmr: number | null = null;
  tdee: number | null = null;
  proteinTarget: number | null = null;
  carbsTarget: number | null = null;
  fatsTarget: number | null = null;
  dailyCalories: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dietService: DietService,
    public roleService: RoleService
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params: any) => {
      this.athleteId = +params['id'];
      this.loadProfile();
    });
  }

  loadProfile() {
    this.loading = true;
    this.dietService.getAthleteDietaryProfile(this.athleteId).subscribe({
      next: (data: DietaryProfile) => {
        this.profile = data;
        if (data) {
          this.bmr = data.bmr ?? null;
          this.tdee = data.tdee ?? null;
          this.dailyCalories = data.targetCalories ?? null;
          this.proteinTarget = data.targetProtein ?? null;
          this.carbsTarget = data.targetCarbs ?? null;
          this.fatsTarget = data.targetFats ?? null;
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading dietary profile', err);
        this.isCustomizing = true;
        this.loading = false;
      }
    });
  }

  startCustomization() {
    this.isCustomizing = true;
  }
  
  cancelCustomization() {
    this.isCustomizing = false;
    this.loadProfile();
  }

  saveProfile() {
    const data: Partial<DietaryProfile> = {
      bmr: this.bmr || undefined,
      tdee: this.tdee || undefined,
      targetCalories: this.dailyCalories || undefined,
      targetProtein: this.proteinTarget || undefined,
      targetCarbs: this.carbsTarget || undefined,
      targetFats: this.fatsTarget || undefined
    };

    this.dietService.updateAthleteDietaryProfile(this.athleteId, data).subscribe({
      next: (res: DietaryProfile) => {
        this.profile = res;
        this.isCustomizing = false;
        alert('Dietary Profile updated!');
      },
      error: (err: any) => {
        console.error('Error saving profile', err);
        alert('Failed to save profile');
      }
    });
  }
}
