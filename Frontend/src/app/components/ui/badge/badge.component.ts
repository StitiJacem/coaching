import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'outline';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.css']
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'default';
  @Input() className: string = '';

  get variantClasses(): string {
    const variants: Record<BadgeVariant, string> = {
      default: 'bg-slate-800 text-slate-300',
      success: 'bg-gosport-lime/10 text-gosport-lime border border-gosport-lime/20',
      warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      danger: 'bg-gosport-danger/10 text-gosport-danger border border-gosport-danger/20',
      outline: 'bg-transparent border border-slate-600 text-slate-400'
    };
    return variants[this.variant];
  }
}
