import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { RoleService } from '../../../services/role.service';
import { ToastService } from '../../../services/toast.service';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
    selector: 'app-athlete-schedule',
    standalone: true,
    imports: [CommonModule, DashboardLayoutComponent, HttpClientModule, LucideAngularModule],
    template: `
    <app-dashboard-layout>
      <div class="max-w-4xl mx-auto py-8 px-6">
        <div class="mb-8">
          <h1 class="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic mb-2">My Training Schedule</h1>
          <p class="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Select your availability. Your coach will plan accordingly.</p>
        </div>

        <div class="elevation-1 light-border rounded-[2rem] p-8 md:p-10 shadow-2xl">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <h3 class="text-gosport-orange font-black uppercase tracking-widest text-[9px] mb-6">Weekly Availability</h3>
              <div class="space-y-2.5">
                <button *ngFor="let day of days; let i = index"
                  (click)="toggleDay(i)"
                  [ngClass]="{
                    'bg-gosport-orange text-white shadow-lg shadow-gosport-orange/20': selectedDays.includes(i),
                    'bg-black/40 text-slate-500 border border-white/5': !selectedDays.includes(i)
                  }"
                  class="w-full flex items-center justify-between p-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all active:scale-[0.98]">
                  <span>{{ day }}</span>
                  <div *ngIf="selectedDays.includes(i)" class="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <lucide-icon name="check" class="w-3 h-3 text-white"></lucide-icon>
                  </div>
                </button>
              </div>
            </div>

            <div class="flex flex-col justify-center space-y-6 p-8 bg-black/20 rounded-[2rem] border border-white/5">
              <div class="text-center space-y-4">
                <div class="w-12 h-12 bg-gosport-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <lucide-icon name="calendar" class="w-6 h-6 text-gosport-orange"></lucide-icon>
                </div>
                <h4 class="text-lg font-black text-white uppercase tracking-tight">Why set this?</h4>
                <p class="text-slate-500 text-xs font-medium leading-relaxed">It ensures your coach only assigns workouts when you're available to train, maximizing consistency.</p>
              </div>

              <div class="pt-4">
                <button (click)="saveSchedule()" [disabled]="isSaving"
                  class="btn-premium bg-gosport-orange text-white w-full py-4 text-xs">
                  {{ isSaving ? 'Saving...' : 'Save My Schedule' }}
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
        private roleService: RoleService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        this.loadAthlete();
    }

    loadAthlete() {
        const user = this.roleService.user;
        if (!user || user.role !== 'athlete') return;




        this.athleteService.getAll().subscribe(athletes => {
            const found = athletes.find(a => a.userId === user.id);
            if (found) {
                this.athlete = found;
                // Default to Mon-Fri if no preference has been saved yet
                this.selectedDays = (found.preferredTrainingDays && found.preferredTrainingDays.length > 0)
                    ? found.preferredTrainingDays
                    : [0, 1, 2, 3, 4];
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
                this.toastService.showSuccess('Schedule updated successfully!');
            },
            error: () => {
                this.isSaving = false;
                this.toastService.showError('Failed to update schedule.');
            }
        });
    }
}
