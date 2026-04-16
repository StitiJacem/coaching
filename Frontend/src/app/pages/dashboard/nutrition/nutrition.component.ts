import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { NutritionService, NutritionPlan, MealLog, MacroCompliance } from '../../../services/nutrition.service';
import { AthleteService, Athlete } from '../../../services/athlete.service';

@Component({
  selector: 'app-nutrition',
  standalone: false,
  templateUrl: './nutrition.component.html',
  styleUrls: ['./nutrition.component.css']
})
export class NutritionComponent implements OnInit {

  isLoading = true;
  

  activePlan: NutritionPlan | null = null;
  todayCompliance: MacroCompliance | null = null;
  recentLogs: MealLog[] = [];
  showLogModal = false;
  

  clients: Athlete[] = [];
  selectedAthlete: Athlete | null = null;
  clientPlan: NutritionPlan | null = null;
  clientCompliance: MacroCompliance | null = null;
  showPlanModal = false;


  mealForm = {
    mealName: '',
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    foodItems: ''
  };

  constructor(
    public roleService: RoleService,
    private nutritionService: NutritionService,
    private athleteService: AthleteService
  ) {}

  ngOnInit(): void {
    if (this.roleService.currentRole === 'nutritionist') {
      this.loadClients();
    } else if (this.roleService.currentRole === 'athlete') {
      this.loadAthleteData();
    } else {
      this.isLoading = false;
    }
  }


  loadAthleteData(): void {
    this.isLoading = true;
    this.nutritionService.getMyActivePlan().subscribe({
      next: (plan) => {
        this.activePlan = plan;
        this.loadRecentLogs();
        this.loadCompliance(this.roleService.user.id);
      },
      error: (err) => {
        console.error('Error loading plan:', err);
        this.isLoading = false;
      }
    });
  }

  loadRecentLogs(): void {
    this.nutritionService.getLogs().subscribe({
      next: (logs) => {
        this.recentLogs = logs;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading logs:', err);
        this.isLoading = false;
      }
    });
  }

  loadCompliance(athleteId: number): void {
    this.nutritionService.getCompliance(athleteId).subscribe({
      next: (compliance) => {
        if (this.roleService.currentRole === 'athlete') {
          this.todayCompliance = compliance;
        } else {
          this.clientCompliance = compliance;
        }
      },
      error: (err) => console.error('Error loading compliance:', err)
    });
  }

  submitMeal(): void {
    const log: MealLog = {
      ...this.mealForm,
      logTime: new Date()
    };

    this.nutritionService.logMeal(log).subscribe({
      next: () => {
        this.showLogModal = false;
        this.resetMealForm();
        this.loadAthleteData();
      },
      error: (err) => alert('Error logging meal: ' + err.message)
    });
  }

  resetMealForm(): void {
    this.mealForm = {
      mealName: '',
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      foodItems: ''
    };
  }


  loadClients(): void {
    this.isLoading = true;
    this.athleteService.getAll().subscribe({
      next: (data) => {
        this.clients = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.isLoading = false;
      }
    });
  }

  selectAthlete(athlete: Athlete): void {
    this.selectedAthlete = athlete;
    if (athlete.id) {
      this.loadCompliance(athlete.id);

    }
  }

  getPercent(actual: number, target: number): number {
    if (!target) return 0;
    return Math.min(Math.round((actual / target) * 100), 100);
  }
}
