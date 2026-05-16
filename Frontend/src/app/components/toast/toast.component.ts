import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <div *ngFor="let toast of toasts; let i = index" 
           class="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-xl animate-slide-in"
           [ngClass]="{
             'bg-emerald-500/10 border-emerald-500/20 text-emerald-500': toast.type === 'success',
             'bg-red-500/10 border-red-500/20 text-red-500': toast.type === 'error',
             'bg-gosport-orange/10 border-gosport-orange/20 text-gosport-orange': toast.type === 'warning',
             'bg-blue-500/10 border-blue-500/20 text-blue-500': toast.type === 'info'
           }">
        
        <lucide-icon [name]="getIcon(toast.type)" class="w-5 h-5"></lucide-icon>
        
        <p class="text-[11px] font-black uppercase tracking-widest">{{ toast.message }}</p>

        <button (click)="removeToast(i)" class="ml-4 hover:opacity-70 transition-opacity">
            <lucide-icon name="x" class="w-4 h-4"></lucide-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in {
      animation: slide-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private subscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toasts$.subscribe((toast: Toast) => {
      this.toasts.push(toast);
      setTimeout(() => {
        this.removeToast(0);
      }, toast.duration || 3000);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  removeToast(index: number) {
    this.toasts.splice(index, 1);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success': return 'check-circle';
      case 'error': return 'x-circle';
      case 'warning': return 'alert-triangle';
      default: return 'info';
    }
  }
}
