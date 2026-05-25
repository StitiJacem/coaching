import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { NutritionService, DietPlan, DietDay, Meal } from '../../../../services/nutrition.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { ToastService } from '../../../../services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-diet-builder',
    standalone: true,
    imports: [CommonModule, FormsModule, DashboardLayoutComponent, RouterLink, LucideAngularModule],
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
    athleteProfile: any = null;
    nutritionistProfileId: string | null = null;
    activeDayIndex: number = 0;
    isSaving = false;

    // Mode: 'athlete' = plan direct pour un athlète, 'template' = plan réutilisable
    planMode: 'athlete' | 'template' = 'athlete';

    // Multi-athlete assignment modal
    showAssignModal = false;
    isAssigning = false;
    assignStartDate: string = this.getTodayDate();
    clients: any[] = [];
    selectedAthleteIds: number[] = [];
    assignResults: { athleteId: number; name: string; status: string }[] = [];

    // Copy Day State
    showCopyDayDropdown = false;
    copyTargetIndices: number[] = [];

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
        private route: ActivatedRoute,
        private toastService: ToastService
    ) {}

    ngOnInit() {
        this.route.queryParams.subscribe((params: any) => {
            if (params['athleteId']) {
                this.athleteId = Number(params['athleteId']);
                this.planData.athleteId = this.athleteId;
                this.planMode = 'athlete';

                this.nutritionService.getAthleteDietaryProfile(this.athleteId).subscribe({
                    next: (profile) => this.athleteProfile = profile,
                    error: () => console.log('No dietary profile found')
                });
            }
            if (params['template'] === 'true') {
                this.planMode = 'template';
                this.planData.isTemplate = true;
                this.planData.name = 'Nouveau Template';
            }
        });

        // Load nutritionist profile
        this.nutritionService.getMyProfile().subscribe({
            next: (profile: any) => {
                if (profile?.id) {
                    this.nutritionistProfileId = profile.id;
                    this.planData.nutritionistProfileId = profile.id;
                    // Load clients for assignment
                    this.nutritionService.getClients(profile.id).subscribe({
                        next: (clients: any[]) => { this.clients = clients; },
                        error: () => {}
                    });
                }
            },
            error: () => {}
        });

        if (this.planData.days.length === 0) {
            for (let i = 1; i <= 7; i++) this.addDay();
        }
        this.activeDayIndex = 0;
    }

    onModeChange() {
        this.planData.isTemplate = this.planMode === 'template';
        if (this.planMode === 'template') {
            this.athleteId = null;
            this.planData.athleteId = undefined;
        }
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
        this.planData.days.forEach((d: DietDay, i: number) => d.day_number = i + 1);
        if (this.activeDayIndex >= this.planData.days.length) {
            this.activeDayIndex = Math.max(0, this.planData.days.length - 1);
        }
    }

    toggleRestDay(dayIndex: number) {
        const day = this.planData.days[dayIndex];
        day.isRestDay = !day.isRestDay;
        if (day.isRestDay) day.meals = [];
    }

    // ── Copy Day Feature Methods ──────────────────────────────────────────────

    toggleCopyDayDropdown() {
        this.showCopyDayDropdown = !this.showCopyDayDropdown;
        if (this.showCopyDayDropdown) {
            this.copyTargetIndices = [];
        }
    }

    toggleDaySelectionForCopy(dayIndex: number) {
        const idx = this.copyTargetIndices.indexOf(dayIndex);
        if (idx > -1) {
            this.copyTargetIndices.splice(idx, 1);
        } else {
            this.copyTargetIndices.push(dayIndex);
        }
    }

    isDaySelectedForCopy(dayIndex: number): boolean {
        return this.copyTargetIndices.includes(dayIndex);
    }

    applyCopyDay() {
        if (this.copyTargetIndices.length === 0) {
            this.toastService.showWarning('Sélectionnez au moins un jour cible.');
            return;
        }

        const sourceDay = this.planData.days[this.activeDayIndex];
        if (!sourceDay) return;

        for (const idx of this.copyTargetIndices) {
            if (idx === this.activeDayIndex) continue;
            const targetDay = this.planData.days[idx];
            if (targetDay) {
                targetDay.isRestDay = sourceDay.isRestDay;
                // Deep clone meals
                targetDay.meals = sourceDay.meals.map((m: Meal, orderIndex: number) => ({
                    mealType: m.mealType,
                    timeOfDay: m.timeOfDay,
                    instructions: m.instructions,
                    calories: Number(m.calories) || 0,
                    protein: Number(m.protein) || 0,
                    carbs: Number(m.carbs) || 0,
                    fats: Number(m.fats) || 0,
                    order: orderIndex
                }));
            }
        }

        this.showCopyDayDropdown = false;
        this.toastService.showSuccess(`Plan du jour copié sur ${this.copyTargetIndices.length} jour(s) !`);
    }

    // ── Quick Preset Meals ────────────────────────────────────────────────────

    addPresetMeal(type: 'breakfast' | 'lunch' | 'snack') {
        const presets = {
            breakfast: {
                mealType: 'breakfast' as const,
                timeOfDay: '08:00',
                instructions: 'Petit-déjeuner type : Flocons d\'avoine (80g) + 3 œufs entiers + 1 banane + 15g d\'amandes',
                calories: 600,
                protein: 35,
                carbs: 70,
                fats: 20
            },
            lunch: {
                mealType: 'lunch' as const,
                timeOfDay: '13:00',
                instructions: 'Repas principal type : Escalope de dinde (150g) + Riz basmati (100g pesé cru) + Haricots verts (150g) + 1 c.à.s d\'huile d\'olive',
                calories: 720,
                protein: 50,
                carbs: 80,
                fats: 18
            },
            snack: {
                mealType: 'snack' as const,
                timeOfDay: '16:30',
                instructions: 'Collation type : Whey isolate (30g) + Beurre de cacahuète (20g) + 1 pomme',
                calories: 350,
                protein: 30,
                carbs: 30,
                fats: 12
            }
        };

        const config = presets[type];
        const newMeal: Meal = {
            mealType: config.mealType,
            timeOfDay: config.timeOfDay,
            instructions: config.instructions,
            calories: config.calories,
            protein: config.protein,
            carbs: config.carbs,
            fats: config.fats,
            order: this.planData.days[this.activeDayIndex].meals.length
        };

        this.planData.days[this.activeDayIndex].meals.push(newMeal);
        this.toastService.showSuccess('Repas type ajouté avec succès ! Vous pouvez le modifier.');
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
        return this.planData.days[dayIndex]?.meals?.reduce((s: number, m: Meal) => s + (Number(m.calories) || 0), 0) || 0;
    }
    dayProtein(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s: number, m: Meal) => s + (Number(m.protein) || 0), 0) || 0;
    }
    dayCarbs(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s: number, m: Meal) => s + (Number(m.carbs) || 0), 0) || 0;
    }
    dayFats(dayIndex: number): number {
        return this.planData.days[dayIndex]?.meals?.reduce((s: number, m: Meal) => s + (Number(m.fats) || 0), 0) || 0;
    }
    getTotalMeals(): number {
        return this.planData.days.reduce((total: number, day: DietDay) => total + (day.meals?.length || 0), 0);
    }
    getTotalCalories(): number {
        return this.planData.days.reduce((total: number, day: DietDay) =>
            total + (day.meals?.reduce((s: number, m: Meal) => s + (Number(m.calories) || 0), 0) || 0), 0
        );
    }

    // ── Multi-athlete Assignment ──────────────────────────────────────────────

    toggleAthleteSelection(athleteId: number) {
        const idx = this.selectedAthleteIds.indexOf(athleteId);
        if (idx > -1) {
            this.selectedAthleteIds.splice(idx, 1);
        } else {
            this.selectedAthleteIds.push(athleteId);
        }
    }

    isAthleteSelected(athleteId: number): boolean {
        return this.selectedAthleteIds.includes(athleteId);
    }

    openAssignModal() {
        if (!this.planData.id) {
            this.toastService.showWarning('Sauvegardez d\'abord le plan avant de l\'assigner.');
            return;
        }
        this.selectedAthleteIds = [];
        this.assignResults = [];
        this.assignStartDate = this.getTodayDate();
        this.showAssignModal = true;
    }

    executeAssign() {
        if (!this.planData.id || this.selectedAthleteIds.length === 0) return;
        this.isAssigning = true;

        this.nutritionService.assignPlanToAthletes(
            this.planData.id,
            this.selectedAthleteIds,
            this.assignStartDate || undefined
        ).subscribe({
            next: (response: any) => {
                this.isAssigning = false;
                this.assignResults = response.results.map((r: any) => {
                    const client = this.clients.find((c: any) => c.athlete?.id === r.athleteId);
                    const name = client
                        ? `${client.athlete?.user?.first_name || ''} ${client.athlete?.user?.last_name || ''}`.trim()
                        : `Athlète #${r.athleteId}`;
                    return { athleteId: r.athleteId, name, status: r.status };
                });
                const assigned = this.assignResults.filter((r: any) => r.status === 'assigned').length;
                const failed = this.assignResults.filter((r: any) => r.status === 'no_connection').length;
                if (assigned > 0) this.toastService.showSuccess(`${assigned} plan(s) assigné(s) avec succès.`);
                if (failed > 0) this.toastService.showWarning(`${failed} athlète(s) sans connexion acceptée.`);
            },
            error: () => {
                this.isAssigning = false;
                this.toastService.showError('Erreur lors de l\'assignation.');
            }
        });
    }

    getClientName(client: any): string {
        return `${client?.athlete?.user?.first_name || ''} ${client?.athlete?.user?.last_name || ''}`.trim() || 'Athlète';
    }

    getClientInitial(client: any): string {
        return client?.athlete?.user?.first_name?.charAt(0)?.toUpperCase() || 'A';
    }

    // ── Save Plan ─────────────────────────────────────────────────────────────

    savePlan() {
        if (!this.planData.name?.trim()) {
            this.toastService.showWarning('Le plan doit avoir un nom.');
            return;
        }
        if (this.planData.days.some((d: DietDay) => !d.isRestDay && d.meals.length === 0)) {
            this.toastService.showWarning('Chaque jour non-repos doit avoir au moins un repas.');
            return;
        }

        this.isSaving = true;

        const planPayload: Partial<DietPlan> = {
            name: this.planData.name,
            description: this.planData.description,
            goal: this.planData.goal,
            isTemplate: this.planMode === 'template',
            startDate: this.planData.startDate,
            athleteId: this.planMode === 'athlete' ? (this.athleteId || undefined) : undefined,
            nutritionistProfileId: this.nutritionistProfileId || undefined
        };

        this.nutritionService.createPlan(planPayload).subscribe({
            next: (plan: DietPlan) => {
                this.planData.id = plan.id;
                if (plan.id) {
                    this.nutritionService.saveFullPlan(plan.id, this.planData.name, this.planData.days).subscribe({
                        next: () => {
                            this.isSaving = false;
                            if (this.planMode === 'template') {
                                this.toastService.showSuccess('Template sauvegardé ! Vous pouvez maintenant l\'assigner.');
                            } else {
                                this.toastService.showSuccess('Plan sauvegardé avec succès !');
                                this.router.navigate(['/dashboard/nutrition']);
                            }
                        },
                        error: () => {
                            this.isSaving = false;
                            this.toastService.showError('Erreur lors de la sauvegarde de la structure du plan.');
                        }
                    });
                }
            },
            error: (err: any) => {
                this.isSaving = false;
                if (err.status === 403) {
                    this.toastService.showError('Connexion nutritionnelle non acceptée — l\'athlète doit d\'abord accepter votre invitation.');
                } else {
                    this.toastService.showError('Erreur lors de la création du plan.');
                }
            }
        });
    }

    getTodayDate(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}
