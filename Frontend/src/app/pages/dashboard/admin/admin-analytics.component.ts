import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    DashboardLayoutComponent
  ],
  templateUrl: './admin-analytics.component.html',
  styleUrl: './admin-analytics.component.css'
})
export class AdminAnalyticsComponent implements OnInit {
  period = 'month';
  role = '';
  status = '';
  data: any = null;
  isLoading = true;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.isLoading = true;
    this.adminService.getAnalytics({
      period: this.period,
      role: this.role,
      status: this.status
    }).subscribe({
      next: (res) => {
        this.data = res;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading admin analytics', err);
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.loadAnalytics();
  }

  // --- SVG AREA CHART (EVOLUTION) CALCULATIONS ---
  getChartPoints(): any[] {
    if (!this.data || !this.data.monthlyRegistrations || this.data.monthlyRegistrations.length === 0) return [];
    const regs = this.data.monthlyRegistrations;
    const width = 500;
    const height = 150;
    const padding = 20;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    
    const maxVal = Math.max(...regs.map((r: any) => r.count), 1);
    const stepX = chartWidth / (regs.length - 1 || 1);
    
    return regs.map((r: any, i: number) => {
      const x = padding + i * stepX;
      const y = padding + chartHeight - (r.count / maxVal) * chartHeight;
      return {
        x,
        y,
        month: r.month,
        count: r.count
      };
    });
  }

  getLinePath(): string {
    const points = this.getChartPoints();
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }

  getAreaPath(): string {
    const points = this.getChartPoints();
    if (points.length === 0) return '';
    const linePath = this.getLinePath();
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const baseY = 150; // Bottom of SVG coordinate
    return `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }

  // --- SVG DONUT CHART (ROLE DISTRIBUTION) CALCULATIONS ---
  getDonutSlices(): any[] {
    if (!this.data || !this.data.cards) return [];
    const { totalCoaches, totalAthletes, totalNutritionists, totalUsers } = this.data.cards;
    const totalAdmins = Math.max(0, totalUsers - (totalCoaches + totalAthletes + totalNutritionists));
    
    const roles = [
      { name: 'Athlètes', count: totalAthletes || 0, color: '#a3e635' },      // lime
      { name: 'Coachs', count: totalCoaches || 0, color: '#f97316' },        // orange
      { name: 'Nutritionnistes', count: totalNutritionists || 0, color: '#10b981' }, // emerald
      { name: 'Admins', count: totalAdmins || 0, color: '#c084fc' }          // purple
    ];
    
    const sum = roles.reduce((acc, r) => acc + r.count, 0) || 1;
    let accumulatedOffset = 0;
    const circumference = 314.16; // 2 * PI * 50
    
    return roles.map(r => {
      const percentage = r.count / sum;
      const dashArray = `${(percentage * circumference).toFixed(2)} ${circumference}`;
      const dashOffset = accumulatedOffset.toFixed(2);
      accumulatedOffset -= percentage * circumference;
      
      return {
        ...r,
        percentage: Math.round(percentage * 100),
        dashArray,
        dashOffset
      };
    });
  }

  // --- ACTIVITY STATS FORMATTING HELPERS ---
  getActivityPercentage(val: number): number {
    if (!this.data || !this.data.activity) return 0;
    const act = this.data.activity;
    const maxVal = Math.max(
      act.programsCount || 1,
      act.sessionsCount || 1,
      act.completedWorkoutsCount || 1,
      act.goalsCount || 1,
      act.dietPlansCount || 1
    );
    return Math.round((val / maxVal) * 100);
  }
}
