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
import { AiService, FoodAnalysisResult } from '../../../services/ai.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-nutrition',
    standalone: false,
    templateUrl: './nutrition.component.html',
    styleUrls: ['./nutrition.component.css']
})
export class NutritionComponent implements OnInit {
    isLoading = true;
    activeTab: string = 'today';

    // ── Athlete ───────────────────────────────────────────────────────────────
    activePlan: DietPlan | null = null;
    todayDay: DietDay | null = null;
    todayLogs: MealLog[] = [];
    historyLogs: MealLog[] = [];
    selectedHistoryDate: string = this.getLocalISODate();
    selectedClientDate: string = this.getLocalISODate();
    historyCompliance: MacroCompliance | null = null;
    compliance: MacroCompliance | null = null;

    showLogModal = false;
    isSubmittingLog = false;
    mealForm = {
        foodName: '',
        calories: 0,
        protein: 0,
        carbs: 0,
        fats: 0,
        mealType: 'snack',
        imagePath: '' as string | undefined
    };

    // ── AI Scanner ───────────────────────────────────────────────────────────
    showAiScanner = false;
    isAnalyzing = false;
    aiResult: FoodAnalysisResult | null = null;
    selectedFile: File | null = null;
    imagePreview: string | null = null;
    aiError: string | null = null;

    // ── Nutritionist ──────────────────────────────────────────────────────────
    nutritionistProfile: any = null;
    clients: any[] = [];
    selectedClient: any = null;
    clientCompliance: ClientCompliance | null = null;
    clientPlan: DietPlan | null = null;
    isLoadingClient = false;

    successMessage: string | null = null;

    constructor(
        public roleService: RoleService,
        private nutritionService: NutritionService,
        private aiService: AiService,
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

    // ── Helper Methods for Templates ──────────────────────────────────────────
    
    getMacroValue(type: 'actual' | 'target', key: string): number {
        const source = this.compliance?.[type];
        return source ? (source as any)[key] || 0 : 0;
    }

    getPercentValue(key: string): number {
        const p = this.compliance?.percent;
        return p ? (p as any)[key] || 0 : 0;
    }

    getComplianceValue(type: 'actual' | 'target' | 'percent', key: string): number {
        if (!this.clientCompliance) return 0;
        const source = (this.clientCompliance as any)?.[type];
        if (!source) return 0;
        return source[key] || 0;
    }

    getHistoryVal(type: 'actual' | 'target' | 'percent', key: string): number {
        if (!this.historyCompliance) return 0;
        if (type === 'percent') {
            const actual = (this.historyCompliance.actual as any)[key] || 0;
            const target = (this.historyCompliance.target as any)[key] || 0;
            return this.getPercent(actual, target);
        }
        const source = (this.historyCompliance as any)?.[type];
        if (!source) return 0;
        return source[key] || 0;
    }

    // ── Athlete Methods ───────────────────────────────────────────────────────

    loadAthleteData(): void {
        this.isLoading = true;
        const athleteId = this.getAthleteId();
        if (!athleteId) { this.isLoading = false; return; }

        this.loadCompliance(athleteId);
        this.loadTodayLogs(athleteId);

        this.nutritionService.getAthleteActivePlan(athleteId).subscribe({
            next: (plan) => {
                this.activePlan = plan;
                if (plan?.days?.length) {
                    this.todayDay = this.findTodayDay(plan);
                }
            },
            error: () => { this.isLoading = false; }
        });
    }

    loadCompliance(athleteId: number): void {
        const localDate = this.getLocalISODate();
        this.nutritionService.getCompliance(athleteId, localDate).subscribe({
            next: (data) => {
                this.compliance = data;
                if (data.todayDay) this.todayDay = data.todayDay;
            },
            error: () => {}
        });
    }

    loadTodayLogs(athleteId: number): void {
        const localDate = this.getLocalISODate();
        this.nutritionService.getLogsByDate(athleteId, localDate).subscribe({
            next: (logs) => {
                this.todayLogs = logs;
                this.isLoading = false;
            },
            error: () => { this.isLoading = false; }
        });
    }

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
                
                if (this.selectedHistoryDate === this.getLocalISODate()) {
                    this.loadHistory();
                }
                
                this.isSubmittingLog = false;
                this.showSuccess('Repas enregistré avec succès !');
            },
            error: (err) => { 
                console.error('Submit meal error:', err);
                this.isSubmittingLog = false; 
            }
        });
    }

    showSuccess(msg: string): void {
        this.successMessage = msg;
        setTimeout(() => this.successMessage = null, 3000);
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
        this.mealForm = { foodName: '', calories: 0, protein: 0, carbs: 0, fats: 0, mealType: 'snack', imagePath: undefined };
    }

    isTabActive(tab: string): boolean {
        return this.activeTab === tab;
    }

    loadHistory(): void {
        const athleteId = this.getAthleteId();
        if (!athleteId) return;

        this.isLoading = true;
        this.nutritionService.getLogsByDate(athleteId, this.selectedHistoryDate).subscribe({
            next: (logs) => {
                this.historyLogs = logs;
                this.nutritionService.getCompliance(athleteId, this.selectedHistoryDate).subscribe({
                    next: (comp) => {
                        this.historyCompliance = comp;
                        this.isLoading = false;
                    },
                    error: () => { this.isLoading = false; }
                });
            },
            error: () => { this.isLoading = false; }
        });
    }

    onHistoryDateChange(date: string): void {
        this.selectedHistoryDate = date;
        this.loadHistory();
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

        this.loadClientHistory();
    }

    loadClientHistory(): void {
        if (!this.nutritionistProfile?.id || !this.selectedClient?.athlete?.id) return;

        this.isLoadingClient = true;
        this.nutritionService.getClientCompliance(
            this.nutritionistProfile.id, 
            this.selectedClient.athlete.id,
            this.selectedClientDate
        ).subscribe({
            next: (compliance) => {
                this.clientCompliance = compliance;
                this.isLoadingClient = false;
            },
            error: () => { this.isLoadingClient = false; }
        });
    }

    onClientDateChange(date: string): void {
        this.selectedClientDate = date;
        this.loadClientHistory();
    }

    goToDietBuilder(client?: any): void {
        const athleteId = client?.athlete?.id || '';
        this.router.navigate(['/dashboard/diet-builder'], { queryParams: { athleteId } });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    getAthleteId(): number | null {
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const u = JSON.parse(raw);
                return u.athleteId || u.id || null;
            }
        } catch {}
        return this.roleService.user?.id || null;
    }

    getLocalISODate(): string {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getPercent(actual: number, target: number): number {
        return this.nutritionService.getPercent(actual, target);
    }

    getRingOffset(actual: number, target: number): number {
        const circumference = 2 * Math.PI * 40; // r=40
        const pct = this.getPercent(actual, target) / 100;
        return circumference * (1 - Math.min(pct, 1));
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

    // ── AI Methods ────────────────────────────────────────────────────────────

    onFileSelected(event: any): void {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            this.aiError = null;
            this.aiResult = null;
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    triggerFileSelect(): void {
        const input = document.getElementById('ai-file-input');
        if (input) input.click();
    }

    analyzeImage(): void {
        if (!this.selectedFile) return;

        this.isAnalyzing = true;
        this.aiError = null;

        this.aiService.analyzeFood(this.selectedFile).subscribe({
            next: (result) => {
                this.aiResult = result;
                this.isAnalyzing = false;
                this.mealForm.foodName = result.detectedFoods.join(', ');
                this.mealForm.calories = result.nutrition.calories;
                this.mealForm.protein = result.nutrition.protein;
                this.mealForm.carbs = result.nutrition.carbs;
                this.mealForm.fats = result.nutrition.fat;
            },
            error: (err) => {
                console.error('AI Analysis Error:', err);
                this.aiError = err.error?.message || 'Erreur lors de l\'analyse de l\'image.';
                this.isAnalyzing = false;
            }
        });
    }

    confirmAiResult(): void {
        if (!this.aiResult) return;
        this.showAiScanner = false;
        this.showLogModal = true;
        if (this.aiResult.imagePath) {
            this.mealForm.imagePath = this.aiResult.imagePath;
        }
    }

    resetAiScanner(): void {
        this.selectedFile = null;
        this.imagePreview = null;
        this.aiResult = null;
        this.aiError = null;
        this.isAnalyzing = false;
    }
}
