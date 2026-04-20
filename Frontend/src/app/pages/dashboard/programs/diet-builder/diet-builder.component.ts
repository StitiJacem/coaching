import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NutritionService, DietPlan, DietDay, Meal } from '../../../../services/nutrition.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';

@Component({
    selector: 'app-diet-builder',
    standalone: true,
    imports: [CommonModule, FormsModule, DashboardLayoutComponent, RouterLink],
    templateUrl: './diet-builder.component.html',
    styleUrls: ['./diet-builder.component.css']
})
export class DietBuilderComponent implements OnInit {
    planData: DietPlan = {
        name: 'Nouveau Plan Nutritionnel',
        description: '',
        goal: 'custom',
        isTemplate: false,
        days: []
    };

    athleteId: number | null = null;
    nutritionistProfileId: string | null = null;
    activeDayIndex: number = 0;

    isSaving = false;
    saveError: string | null = null;
    connectionError: string | null = null;

    readonly mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
    readonly goals = [
        { value: 'bulking', label: 'Prise de masse' },
        { value: 'cutting', label: 'Sèche' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'performance', label: 'Performance' },
        { value: 'custom', label: 'Personnalisé' }
    ];

    constructor(
        private nutritionService: NutritionService,
        private router: Router,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        // Read athleteId from query params (set when nutritionist navigates from client view)
        this.route.queryParams.subscribe(params => {
            if (params['athleteId']) {
                this.athleteId = Number(params['athleteId']);
                this.planData.athleteId = this.athleteId;
            }
        });

        // Load nutritionist profile to get their ID
        this.nutritionService.getMyProfile().subscribe({
            next: (profile) => {
                if (profile?.id) {
                    this.nutritionistProfileId = profile.id;
                    this.planData.nutritionistProfileId = profile.id;
                }
            },
            error: () => {} // Not a nutritionist — that's OK for template plans
        });

        // Start with a 7-day week
        if (this.planData.days.length === 0) {
            for (let i = 1; i <= 7; i++) {
                this.addDay();
            }
        }
        this.activeDayIndex = 0;
    }

    // ── Day Management ────────────────────────────────────────────────────────

    addDay() {
        const newDay: DietDay = {
            day_number: this.planData.days.length + 1,
            title: `Jour ${this.planData.days.length + 1}`,
            isRestDay: false,
            meals: []
        };
        this.planData.days.push(newDay);
        this.activeDayIndex = this.planData.days.length - 1;
    }

    removeDay(index: number) {
        this.planData.days.splice(index, 1);
        // Renumber days
        this.planData.days.forEach((d, i) => d.day_number = i + 1);
        if (this.activeDayIndex >= this.planData.days.length) {
            this.activeDayIndex = Math.max(0, this.planData.days.length - 1);
        }
    }

    toggleRestDay(dayIndex: number) {
        const day = this.planData.days[dayIndex];
        day.isRestDay = !day.isRestDay;
        if (day.isRestDay) day.meals = [];
    }

    // ── Meal Management ───────────────────────────────────────────────────────

    addMeal(dayIndex: number) {
        const newMeal: Meal = {
            mealType: 'snack',
            timeOfDay: '12:00',
            instructions: '',
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            order: this.planData.days[dayIndex].meals.length
        };
        this.planData.days[dayIndex].meals.push(newMeal);
    }

    removeMeal(dayIndex: number, mealIndex: number) {
        this.planData.days[dayIndex].meals.splice(mealIndex, 1);
    }

    // ── Computed Totals ───────────────────────────────────────────────────────

    dayCalories(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s, m) => s + (Number(m.calories) || 0), 0) || 0;
    }

    dayProtein(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s, m) => s + (Number(m.protein) || 0), 0) || 0;
    }

    dayCarbs(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s, m) => s + (Number(m.carbs) || 0), 0) || 0;
    }

    dayFats(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s, m) => s + (Number(m.fats) || 0), 0) || 0;
    }

    getTotalMeals(): number {
        return this.planData.days.reduce((total, day) => total + (day.meals?.length || 0), 0);
    }

    // ── Save Plan ─────────────────────────────────────────────────────────────

    savePlan() {
        if (!this.planData.name?.trim()) {
            this.saveError = 'Le plan doit avoir un nom.';
            return;
        }

        if (this.planData.days.some(d => !d.isRestDay && d.meals.length === 0)) {
            this.saveError = 'Chaque jour non-repos doit avoir au moins un repas.';
            return;
        }

        this.isSaving = true;
        this.saveError = null;
        this.connectionError = null;

        const planPayload: Partial<DietPlan> = {
            name: this.planData.name,
            description: this.planData.description,
            goal: this.planData.goal,
            isTemplate: false,
            startDate: this.planData.startDate,
            athleteId: this.athleteId || undefined,
            nutritionistProfileId: this.nutritionistProfileId || undefined
        };

        this.nutritionService.createPlan(planPayload).subscribe({
            next: (plan) => {
                if (plan.id) {
                    this.nutritionService.saveFullPlan(plan.id, this.planData.name, this.planData.days).subscribe({
                        next: () => {
                            this.isSaving = false;
                            this.router.navigate(['/dashboard/nutrition']);
                        },
                        error: (err) => {
                            this.isSaving = false;
                            this.saveError = 'Erreur lors de la sauvegarde de la structure du plan.';
                        }
                    });
                }
            },
            error: (err) => {
                this.isSaving = false;
                if (err.status === 403) {
                    this.connectionError = 'Connexion nutritionnelle non acceptée — l\'athlète doit d\'abord accepter votre invitation.';
                } else {
                    this.saveError = 'Erreur lors de la création du plan.';
                }
            }
        });
    }
}
