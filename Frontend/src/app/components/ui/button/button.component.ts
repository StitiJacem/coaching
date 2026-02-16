import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, Loader2 } from 'lucide-angular';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css']
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() isLoading: boolean = false;
  @Input() disabled: boolean = false;
  @Input() className: string = '';
  @Input() leftIcon: any = null; // For backward compatibility
  @Input() leftIconName?: string; // Icon name for lucide-angular
  @Input() rightIcon: any = null; // For backward compatibility
  @Input() rightIconName?: string; // Icon name for lucide-angular
  @Output() clicked = new EventEmitter<void>();

  get baseStyles(): string {
    return 'inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gosport-dark disabled:opacity-50 disabled:cursor-not-allowed';
  }

  get variantClasses(): string {
    const variants: Record<ButtonVariant, string> = {
      primary: 'bg-gosport-orange hover:bg-orange-600 text-white shadow-lg shadow-gosport-orange/25 focus:ring-gosport-orange',
      secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 focus:ring-slate-500',
      ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white focus:ring-slate-500',
      danger: 'bg-gosport-danger hover:bg-red-600 text-white shadow-lg shadow-gosport-danger/25 focus:ring-gosport-danger'
    };
    return variants[this.variant];
  }

  get sizeClasses(): string {
    const sizes: Record<ButtonSize, string> = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base'
    };
    return sizes[this.size];
  }

  onClick() {
    if (!this.disabled && !this.isLoading) {
      this.clicked.emit();
    }
  }
}
