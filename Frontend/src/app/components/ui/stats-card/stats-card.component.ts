import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type TrendType = 'up' | 'down' | 'neutral';

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './stats-card.component.html',
  styleUrls: ['./stats-card.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('400ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class StatsCardComponent {
  @Input() label: string = '';
  @Input() value: string = '';
  @Input() subtext?: string;
  @Input() icon: any;
  @Input() iconName?: string;
  @Input() trend: TrendType = 'neutral';
  @Input() delay: number = 0;
}
