import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService, ConfirmData } from '../../services/confirm.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div *ngIf="activeConfirm" class="fixed inset-0 z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div class="absolute inset-0 bg-black/80 backdrop-blur-md" (click)="onReject()"></div>
      
      <div class="relative bg-gosport-surface border border-gosport-border rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        <!-- Decoration -->
        <div class="absolute top-0 left-0 w-full h-1" 
             [ngClass]="{
               'bg-red-500': activeConfirm.type === 'danger',
               'bg-gosport-orange': activeConfirm.type === 'warning',
               'bg-blue-500': activeConfirm.type === 'info'
             }"></div>

        <div class="p-10 space-y-6">
          <div class="flex items-center gap-4">
            <div class="p-3 rounded-2xl bg-white/5 border border-white/10">
              <lucide-icon [name]="getIcon()" 
                           [ngClass]="{
                             'text-red-500': activeConfirm.type === 'danger',
                             'text-gosport-orange': activeConfirm.type === 'warning',
                             'text-blue-500': activeConfirm.type === 'info'
                           }"
                           class="w-6 h-6"></lucide-icon>
            </div>
            <h2 class="text-xl font-display font-black text-white uppercase italic tracking-tight">{{ activeConfirm.title }}</h2>
          </div>

          <p class="text-slate-400 font-medium leading-relaxed">{{ activeConfirm.message }}</p>

          <div class="flex gap-4 pt-4">
            <button (click)="onReject()" 
                    class="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] border border-white/5 text-slate-500 hover:text-white hover:bg-white/5 transition-all">
              {{ activeConfirm.cancelText }}
            </button>
            <button (click)="onConfirm()" 
                    [ngClass]="{
                      'bg-red-500 shadow-red-500/20': activeConfirm.type === 'danger',
                      'bg-gosport-orange shadow-gosport-orange/20': activeConfirm.type === 'warning',
                      'bg-blue-500 shadow-blue-500/20': activeConfirm.type === 'info'
                    }"
                    class="flex-[1.5] py-4 rounded-xl font-black uppercase tracking-widest text-[10px] text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all">
              {{ activeConfirm.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ConfirmComponent implements OnInit, OnDestroy {
  activeConfirm: ConfirmData | null = null;
  private subscription?: Subscription;

  constructor(private confirmService: ConfirmService) {}

  ngOnInit() {
    this.subscription = this.confirmService.confirm$.subscribe((data: ConfirmData) => {
      this.activeConfirm = data;
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  onConfirm() {
    if (this.activeConfirm) {
      this.activeConfirm.resolve(true);
      this.activeConfirm = null;
    }
  }

  onReject() {
    if (this.activeConfirm) {
      this.activeConfirm.resolve(false);
      this.activeConfirm = null;
    }
  }

  getIcon(): string {
    switch (this.activeConfirm?.type) {
      case 'danger': return 'alert-circle';
      case 'warning': return 'alert-triangle';
      default: return 'help-circle';
    }
  }
}
