import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Program, ProgramService } from '../../../services/program.service';

@Component({
    selector: 'app-program-config-modal',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/90 backdrop-blur-md" (click)="onClose()"></div>
      <div class="relative bg-gosport-surface border border-gosport-border rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <!-- Top Banner -->
        <div class="h-32 bg-gradient-to-br from-gosport-orange to-orange-700 relative overflow-hidden">
          <div class="absolute inset-0 opacity-20">
            <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 0 L100 0 L100 100 Z" fill="white"></path>
            </svg>
          </div>
          <div class="absolute inset-0 flex items-center justify-center">
            <div class="text-center">
              <span class="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest mb-2">New Program Assignment</span>
              <h2 class="text-4xl font-display font-black text-white uppercase italic tracking-tight">{{ program.name }}</h2>
            </div>
          </div>
          <button (click)="onClose()" class="absolute top-6 right-6 p-2 rounded-full bg-black/20 text-white/70 hover:text-white hover:bg-black/40 transition-all">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-10 space-y-10">
          <!-- Program Info -->
          <div class="bg-black/20 rounded-3xl p-6 border border-white/5 flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-gosport-orange/10 flex items-center justify-center text-gosport-orange">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <div>
              <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Coach Note</p>
              <p class="text-slate-300 italic text-sm">"{{ program.description || 'Follow this program closely to reach your goals.' }}"</p>
            </div>
          </div>

          <!-- Configuration -->
          <div class="space-y-8">
            <div>
              <div class="flex items-center justify-between mb-6">
                <label class="text-xs font-black text-white uppercase tracking-[0.2em]">Select Your Training Days</label>
                <span class="text-[10px] font-bold text-gosport-orange uppercase tracking-widest">{{ selectedDays.length }} Days Selected</span>
              </div>
              <div class="grid grid-cols-7 gap-3">
                <button *ngFor="let day of days; let i = index"
                  (click)="toggleDay(i)"
                  [class.bg-gosport-orange]="selectedDays.includes(i)"
                  [class.text-white]="selectedDays.includes(i)"
                  [class.border-gosport-orange]="selectedDays.includes(i)"
                  [class.bg-slate-800]="!selectedDays.includes(i)"
                  [class.text-slate-500]="!selectedDays.includes(i)"
                  [class.border-slate-700]="!selectedDays.includes(i)"
                  class="aspect-square flex flex-col items-center justify-center rounded-2xl border-2 font-black transition-all duration-300 transform active:scale-90 group">
                  <span class="text-[10px] opacity-50 mb-1">{{ day.short }}</span>
                  <span class="text-lg">{{ day.initial }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-8">
              <div class="space-y-4">
                <label class="block text-xs font-black text-white uppercase tracking-[0.2em]">Start Date</label>
                <input type="date" [(ngModel)]="startDate"
                  class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-gosport-orange transition-all">
              </div>
              <div class="space-y-4">
                <label class="block text-xs font-black text-white uppercase tracking-[0.2em]">Daily Reminder</label>
                <input type="time" [disabled]="true" value="08:00"
                  class="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-4 text-slate-500 font-bold opacity-50 cursor-not-allowed">
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex gap-4 pt-4">
            <button (click)="onClose()"
              class="flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-sm border-2 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all">
              Later
            </button>
            <button (click)="onAccept()" [disabled]="isSubmitting || selectedDays.length === 0"
              class="flex-[2] py-5 rounded-2xl font-black uppercase tracking-widest text-sm bg-gosport-orange hover:bg-orange-600 text-white shadow-2xl shadow-gosport-orange/40 transition-all active:scale-[0.98] disabled:opacity-50">
              {{ isSubmitting ? 'Activating...' : 'Activate Program' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
    .animate-in { animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes zoomIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class ProgramConfigModalComponent {
    @Input() program!: Program;
    @Output() accepted = new EventEmitter<any>();
    @Output() close = new EventEmitter<void>();

    days = [
        { initial: 'M', short: 'Mon' },
        { initial: 'T', short: 'Tue' },
        { initial: 'W', short: 'Wed' },
        { initial: 'T', short: 'Thu' },
        { initial: 'F', short: 'Fri' },
        { initial: 'S', short: 'Sat' },
        { initial: 'S', short: 'Sun' }
    ];

    selectedDays: number[] = [];
    startDate: string = new Date().toISOString().split('T')[0];
    isSubmitting = false;

    constructor(private programService: ProgramService) { }

    toggleDay(index: number) {
        const idx = this.selectedDays.indexOf(index);
        if (idx > -1) {
            this.selectedDays.splice(idx, 1);
        } else {
            this.selectedDays.push(index);
            this.selectedDays.sort();
        }
    }

    onAccept() {
        if (this.selectedDays.length === 0) return;

        this.isSubmitting = true;
        const config = {
            scheduleConfig: { daysOfWeek: this.selectedDays },
            startDate: this.startDate
        };

        this.programService.acceptProgram(this.program.id!, config).subscribe({
            next: (updatedProgram) => {
                this.isSubmitting = false;
                this.accepted.emit(updatedProgram);
            },
            error: (err) => {
                console.error('Error accepting program:', err);
                this.isSubmitting = false;
                alert('Failed to activate program. Please try again.');
            }
        });
    }

    onClose() {
        this.close.emit();
    }
}
