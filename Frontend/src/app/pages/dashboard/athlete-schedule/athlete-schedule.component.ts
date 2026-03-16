import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { RoleService } from '../../../services/role.service';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';

@Component({
    selector: 'app-athlete-schedule',
    standalone: true,
    imports: [CommonModule, DashboardLayoutComponent, HttpClientModule],
    template: `
    <app-dashboard-layout>
      <div class="max-w-4xl mx-auto py-12 px-6">
        <div class="mb-12">
          <h1 class="text-4xl font-display font-black text-white uppercase italic mb-4">My Training Schedule</h1>
          <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Select the days you are ready and available to train. Your coach will use this to plan your workouts.</p>
        </div>

        <div class="bg-gosport-surface border border-gosport-border rounded-[2.5rem] p-10 shadow-2xl">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 class="text-gosport-orange font-black uppercase tracking-[0.2em] text-[10px] mb-6">Availability</h3>
              <div class="space-y-3">
                <button *ngFor="let day of days; let i = index" 
                  (click)="toggleDay(i)"
                  [ngClass]="{
                    'bg-gosport-orange text-white shadow-gosport-orange/20': selectedDays.includes(i),
                    'bg-black/40 text-slate-500 border border-white/5': !selectedDays.includes(i)
                  }"
                  class="w-full flex items-center justify-between p-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all transform active:scale-[0.98] hover:shadow-xl">
                  <span>{{ day }}</span>
                  <div *ngIf="selectedDays.includes(i)" class="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>

            <div class="flex flex-col justify-center space-y-8 p-8 bg-black/20 rounded-3xl border border-white/5">
              <div class="text-center space-y-4">
                <div class="w-16 h-16 bg-gosport-orange/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg class="w-8 h-8 text-gosport-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 class="text-xl font-display font-black text-white uppercase italic">Why this matters?</h4>
                <p class="text-slate-400 text-sm font-medium leading-relaxed">By setting your training days, you ensure that your coach only assigns workouts when you're actually ready to put in the work.</p>
              </div>

              <div class="pt-8">
                <button (click)="saveSchedule()" [disabled]="isSaving"
                  class="w-full py-5 bg-gosport-orange text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-gosport-orange/30 hover:bg-orange-600 transition-all transform active:scale-95 disabled:opacity-50">
                  {{ isSaving ? 'Saving Changes...' : 'Save My Schedule' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-dashboard-layout>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class AthleteScheduleComponent implements OnInit {
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    selectedDays: number[] = [];
    athlete: Athlete | null = null;
    isSaving = false;

    constructor(
        private athleteService: AthleteService,
        private roleService: RoleService
    ) { }

    ngOnInit() {
        this.loadAthlete();
    }

    loadAthlete() {
        const user = this.roleService.user;
        if (!user || user.role !== 'athlete') return;

        // We need to find the athlete ID for this user.
        // Assuming getById for an athlete uses the athlete's ID, but we might need a "getByUserId" or similar.
        // For now, let's look at the current user object which usually has the profile info.
        this.athleteService.getAll().subscribe(athletes => {
            const found = athletes.find(a => a.userId === user.id);
            if (found) {
                this.athlete = found;
                this.selectedDays = found.preferredTrainingDays || [];
            }
        });
    }

    toggleDay(index: number) {
        const idx = this.selectedDays.indexOf(index);
        if (idx > -1) {
            this.selectedDays.splice(idx, 1);
        } else {
            this.selectedDays.push(index);
        }
        this.selectedDays.sort();
    }

    saveSchedule() {
        if (!this.athlete?.id) return;
        this.isSaving = true;

        this.athleteService.update(this.athlete.id, {
            preferredTrainingDays: this.selectedDays
        }).subscribe({
            next: () => {
                this.isSaving = false;
                alert('Schedule updated successfully!');
            },
            error: () => {
                this.isSaving = false;
                alert('Failed to update schedule.');
            }
        });
    }
}
