import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NutritionService, DietPlan, DietDay, Meal } from '../../../../services/nutrition.service';
import { DashboardLayoutComponent } from '../../../../components/dashboard-layout/dashboard-layout.component';
import { ToastService } from '../../../../services/toast.service';

@Component({
    selector: 'app-nutritionist-plans',
    standalone: true,
    imports: [CommonModule, FormsModule, DashboardLayoutComponent, RouterLink],
    templateUrl: './nutritionist-plans.component.html',
    styleUrls: ['./nutritionist-plans.component.css']
})
export class NutritionistPlansComponent implements OnInit {
    isLoading = true;
    activeTab: 'templates' | 'assigned' = 'templates';

    allPlans: DietPlan[] = [];
    templates: DietPlan[] = [];
    assignedPlans: DietPlan[] = [];
    clients: any[] = [];

    nutritionistProfileId: string | null = null;

    // Assignment modal state (reuse from DietBuilder concept)
    showAssignModal = false;
    selectedPlan: DietPlan | null = null;
    isAssigning = false;
    selectedAthleteIds: number[] = [];
    assignStartDate: string = this.getTodayDate();
    assignResults: { athleteId: number; name: string; status: string }[] = [];

    constructor(
        private nutritionService: NutritionService,
        private router: Router,
        private toastService: ToastService
    ) {}

    ngOnInit(): void {
        this.nutritionService.getMyProfile().subscribe({
            next: (profile: any) => {
                if (profile?.id) {
                    this.nutritionistProfileId = profile.id;
                    this.loadAll(profile.id);
                } else {
                    this.isLoading = false;
                }
            },
            error: () => { this.isLoading = false; }
        });
    }

    loadAll(nutritionistProfileId: string): void {
        this.nutritionService.getMyNutritionistPlans().subscribe({
            next: (plans: DietPlan[]) => {
                this.allPlans = plans;
                this.templates = plans.filter((p: DietPlan) => p.isTemplate);
                this.assignedPlans = plans.filter((p: DietPlan) => !p.isTemplate && p.athleteId);
            },
            error: () => {}
        });

        this.nutritionService.getClients(nutritionistProfileId).subscribe({
            next: (clients: any[]) => { this.clients = clients; this.isLoading = false; },
            error: () => { this.isLoading = false; }
        });
    }

    goToNewTemplate(): void {
        this.router.navigate(['/dashboard/diet-builder'], { queryParams: { template: 'true' } });
    }

    goToNewPlan(): void {
        this.router.navigate(['/dashboard/diet-builder']);
    }

    // ── Assignment ────────────────────────────────────────────────────────────

    openAssignModal(plan: DietPlan): void {
        this.selectedPlan = plan;
        this.selectedAthleteIds = [];
        this.assignResults = [];
        this.assignStartDate = this.getTodayDate();
        this.showAssignModal = true;
    }

    toggleAthleteSelection(athleteId: number): void {
        const idx = this.selectedAthleteIds.indexOf(athleteId);
        if (idx > -1) this.selectedAthleteIds.splice(idx, 1);
        else this.selectedAthleteIds.push(athleteId);
    }

    isAthleteSelected(athleteId: number): boolean {
        return this.selectedAthleteIds.includes(athleteId);
    }

    executeAssign(): void {
        if (!this.selectedPlan?.id || this.selectedAthleteIds.length === 0) return;
        this.isAssigning = true;

        this.nutritionService.assignPlanToAthletes(
            this.selectedPlan.id,
            this.selectedAthleteIds,
            this.assignStartDate || undefined
        ).subscribe({
            next: (response: any) => {
                this.isAssigning = false;
                this.assignResults = response.results.map((r: any) => {
                    const client = this.clients.find(c => c.athlete?.id === r.athleteId);
                    const name = client
                        ? `${client.athlete?.user?.first_name || ''} ${client.athlete?.user?.last_name || ''}`.trim()
                        : `Athlète #${r.athleteId}`;
                    return { athleteId: r.athleteId, name, status: r.status };
                });
                const assigned = this.assignResults.filter(r => r.status === 'assigned').length;
                const failed = this.assignResults.filter(r => r.status === 'no_connection').length;
                if (assigned > 0) {
                    this.toastService.showSuccess(`${assigned} plan(s) assigné(s) avec succès !`);
                    // Refresh plans list
                    if (this.nutritionistProfileId) this.loadAll(this.nutritionistProfileId);
                }
                if (failed > 0) this.toastService.showWarning(`${failed} athlète(s) ignoré(s) — pas de connexion acceptée.`);
            },
            error: () => {
                this.isAssigning = false;
                this.toastService.showError('Erreur lors de l\'assignation du plan.');
            }
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    getClientName(client: any): string {
        return `${client?.athlete?.user?.first_name || ''} ${client?.athlete?.user?.last_name || ''}`.trim() || 'Athlète';
    }

    getClientInitial(client: any): string {
        return client?.athlete?.user?.first_name?.charAt(0)?.toUpperCase() || 'A';
    }

    getAthleteNameFromPlan(plan: DietPlan): string {
        const u = (plan as any).athlete?.user;
        if (u) return `${u.first_name || ''} ${u.last_name || ''}`.trim();
        return plan.athleteId ? `Athlète #${plan.athleteId}` : '—';
    }

    getPlanDaysCount(plan: DietPlan): number {
        return plan.days?.length || 0;
    }

    getPlanTotalCalories(plan: DietPlan): number {
        if (!plan.days?.length) return 0;
        const activeDays = plan.days.filter((d: DietDay) => !d.isRestDay);
        if (!activeDays.length) return 0;
        const total = activeDays.reduce((sum: number, day: DietDay) =>
            sum + (day.meals?.reduce((s: number, m: Meal) => s + (Number(m.calories) || 0), 0) || 0), 0
        );
        return Math.round(total / activeDays.length);
    }

    getGoalLabel(goal: string): string {
        const labels: Record<string, string> = {
            bulking: 'Prise de masse', cutting: 'Sèche',
            maintenance: 'Maintenance', performance: 'Performance', custom: 'Personnalisé'
        };
        return labels[goal] || goal;
    }

    getGoalClass(goal: string): string {
        const classes: Record<string, string> = {
            bulking: 'goal-bulking', cutting: 'goal-cutting',
            maintenance: 'goal-maintenance', performance: 'goal-perf', custom: 'goal-custom'
        };
        return classes[goal] || 'goal-custom';
    }

    getTodayDate(): string {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
}
