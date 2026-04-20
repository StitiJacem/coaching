import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../services/role.service';
import {
    NutritionService,
    DietPlan,
    DietDay,
    MealLog,
    MacroCompliance,
    ClientCompliance,
    MacroTotals
} from '../../../services/nutrition.service';

@Component({
    selector: 'app-nutrition',
    standalone: false,
    templateUrl: './nutrition.component.html',
    styleUrls: ['./nutrition.component.css']
})
export class NutritionComponent implements OnInit {
    isLoading = true;
    activeTab: 'today' | 'plan' | 'clients' = 'today';

    // ── Athlete ───────────────────────────────────────────────────────────────
    activePlan: DietPlan | null = null;
    todayDay: DietDay | null = null;
    todayLogs: MealLog[] = [];
    compliance: MacroCompliance | null = null;

    showLogModal = false;
    isSubmittingLog = false;
    mealForm = {
        foodName: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        mealType: 'snack'
    };

    // ── Nutritionist ──────────────────────────────────────────────────────────
    nutritionistProfile: any = null;
    clients: any[] = [];
    selectedClient: any = null;
    clientCompliance: ClientCompliance | null = null;
    clientPlan: DietPlan | null = null;
    isLoadingClient = false;

    constructor(
        public roleService: RoleService,
        private nutritionService: NutritionService,
        private router: Router
    ) {}

    ngOnInit(): void {
        const role = this.roleService.currentRole;
        if (role === 'nutritionist') {
            this.activeTab = 'clients';
            this.loadNutritionistData();
        } else if (role === 'athlete') {
            this.activeTab = 'today';
            this.loadAthleteData();
        } else {
            this.isLoading = false;
        }
    }

    // ── Athlete Methods ───────────────────────────────────────────────────────

    loadAthleteData(): void {
        this.isLoading = true;
        const athleteId = this.getAthleteId();
        if (!athleteId) { this.isLoading = false; return; }

        this.nutritionService.getAthleteActivePlan(athleteId).subscribe({
            next: (plan) => {
                this.activePlan = plan;
                if (plan?.days?.length) {
                    this.todayDay = this.findTodayDay(plan);
                }
                this.loadCompliance(athleteId);
                this.loadTodayLogs(athleteId);
            },
            error: () => { this.isLoading = false; }
        });
    }

    loadCompliance(athleteId: number): void {
        this.nutritionService.getCompliance(athleteId).subscribe({
            next: (data) => {
                this.compliance = data;
                if (data.todayDay) this.todayDay = data.todayDay;
            },
            error: () => {}
        });
    }

    loadTodayLogs(athleteId: number): void {
        this.nutritionService.getTodayLogs(athleteId).subscribe({
            next: (logs) => {
                this.todayLogs = logs;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    // Find which DietDay corresponds to today 
    findTodayDay(plan: DietPlan): DietDay | null {
        if (!plan.days?.length) return null;
        if (plan.startDate) {
            const start = new Date(plan.startDate);
            start.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            const dayNumber = (diffDays % plan.days.length) + 1;
            return plan.days.find(d => d.day_number === dayNumber) || plan.days[0];
        }
        return plan.days[0];
    }

    submitMeal(): void {
        const athleteId = this.getAthleteId();
        if (!athleteId || !this.mealForm.foodName.trim()) return;

        this.isSubmittingLog = true;
        this.nutritionService.logMeal(athleteId, this.mealForm).subscribe({
            next: (log) => {
                this.todayLogs = [log, ...this.todayLogs];
                this.showLogModal = false;
                this.resetMealForm();
                this.loadCompliance(athleteId);
                this.isSubmittingLog = false;
            },
            error: () => { this.isSubmittingLog = false; }
        });
    }

    deleteLog(logId: string): void {
        const athleteId = this.getAthleteId();
        if (!athleteId || !logId) return;
        this.nutritionService.deleteMealLog(athleteId, logId).subscribe({
            next: () => {
                this.todayLogs = this.todayLogs.filter(l => l.id !== logId);
                this.loadCompliance(athleteId);
            }
        });
    }

    resetMealForm(): void {
        this.mealForm = { foodName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealType: 'snack' };
    }

    // ── Nutritionist Methods ──────────────────────────────────────────────────

    loadNutritionistData(): void {
        this.isLoading = true;
        this.nutritionService.getMyProfile().subscribe({
            next: (profile) => {
                this.nutritionistProfile = profile;
                if (profile?.id) this.loadClients(profile.id);
            },
            error: () => { this.isLoading = false; }
        });
    }

    loadClients(nutritionistProfileId: string): void {
        this.nutritionService.getClients(nutritionistProfileId).subscribe({
            next: (clients) => {
                this.clients = clients;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

    selectClient(client: any): void {
        this.selectedClient = client;
        this.clientCompliance = null;
        this.clientPlan = null;
        if (!this.nutritionistProfile?.id || !client?.athlete?.id) return;

        this.isLoadingClient = true;
        this.nutritionService.getClientCompliance(this.nutritionistProfile.id, client.athlete.id).subscribe({
            next: (compliance) => {
                this.clientCompliance = compliance;
                this.isLoadingClient = false;
            },
            error: () => { this.isLoadingClient = false; }
        });
    }

    goToDietBuilder(client?: any): void {
        const athleteId = client?.athlete?.id || '';
        this.router.navigate(['/dashboard/diet-builder'], { queryParams: { athleteId } });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    getAthleteId(): number | null {
        // RoleService.user doesn't expose athleteId, so we parse from localStorage
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const u = JSON.parse(raw);
                // Try athleteId first (set by backend on athlete profile), then fall back to user id
                return u.athleteId || u.id || null;
            }
        } catch {}
        return this.roleService.user?.id || null;
    }

    getPercent(actual: number, target: number): number {
        return this.nutritionService.getPercent(actual, target);
    }

    getRingOffset(actual: number, target: number): number {
        const circumference = 2 * Math.PI * 40; // r=40
        const pct = this.getPercent(actual, target) / 100;
        return circumference * (1 - Math.min(pct, 1));
    }

    getComplianceVal(type: 'actual' | 'target' | 'percent', key: string): number {
        if (!this.clientCompliance) return 0;
        const obj = this.clientCompliance[type];
        if (!obj) return 0;
        return (obj as any)[key] || 0;
    }

    computeTotals(logs: MealLog[]): MacroTotals {
        return logs.reduce((acc, l) => ({
            calories: acc.calories + (l.calories || 0),
            protein: acc.protein + (l.protein || 0),
            carbs: acc.carbs + (l.carbs || 0),
            fats: acc.fats + (l.fats || 0)
        }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    }

    getDayTotalCalories(day: any): number {
        if (!day?.meals?.length) return 0;
        return day.meals.reduce((acc: number, m: any) => acc + (Number(m.calories) || 0), 0);
    }

    getClientName(client: any): string {
        return `${client?.athlete?.user?.first_name || ''} ${client?.athlete?.user?.last_name || ''}`.trim() || 'Athlète';
    }

    getInitial(client: any): string {
        return client?.athlete?.user?.first_name?.charAt(0)?.toUpperCase() || 'A';
    }
}
