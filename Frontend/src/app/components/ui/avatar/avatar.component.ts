import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css']
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() alt?: string;
  @Input() fallback: string = '';
  @Input() size: AvatarSize = 'md';
  @Input() status?: AvatarStatus;
  @Input() className: string = '';

  get sizeClasses(): string {
    const sizes: Record<AvatarSize, string> = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-12 h-12 text-base',
      xl: 'w-16 h-16 text-lg'
    };
    return sizes[this.size];
  }

  get statusColors(): string {
    if (!this.status) return '';
    const colors: Record<AvatarStatus, string> = {
      online: 'bg-gosport-lime',
      offline: 'bg-slate-500',
      busy: 'bg-gosport-danger'
    };
    return colors[this.status];
  }
}
