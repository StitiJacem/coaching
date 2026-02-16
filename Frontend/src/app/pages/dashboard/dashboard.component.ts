import { RoleService } from '../../services/role.service';
import { DashboardService } from '../../services/dashboard.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-dashboard',
    standalone: false,
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    stats: any[] = [];
    todaySessions: any[] = [];
    recentAthletes: any[] = [];
    loading = true;
    error: string | null = null;

    constructor(
        public roleService: RoleService,
        private dashboardService: DashboardService
    ) { }

    ngOnInit() {
        this.loadDashboardData();
    }

    loadDashboardData() {
        this.loading = true;
        this.error = null;
        const role = this.roleService.currentRole;

        this.dashboardService.getStats(role).subscribe({
            next: (data) => {
                this.stats = data;
            },
            error: (err) => {
                console.error('Error loading stats', err);
                this.error = 'Failed to load statistics';
            }
        });

        this.dashboardService.getTodaySessions().subscribe({
            next: (data) => {
                this.todaySessions = data;
            },
            error: (err) => {
                console.error('Error loading sessions', err);
                // Don't set error here, just log it
            }
        });

        this.dashboardService.getRecentAthletes().subscribe({
            next: (data) => {
                this.recentAthletes = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading athletes', err);
                this.loading = false;
            }
        });
    }

    get currentStats() {
        return this.stats;
    }

    get dashboardTitle() {
        const titles: Record<string, string> = {
            coach: 'Your <span class="text-gosport-orange">Athletes</span>',
            athlete: 'Your <span class="text-gosport-orange">Progress</span>',
            doctor: 'Your <span class="text-gosport-orange">Patients</span>',
            nutritionist: 'Your <span class="text-gosport-orange">Clients</span>',
            manager: 'Your <span class="text-gosport-orange">Workspace</span>'
        };
        return titles[this.roleService.currentRole] || titles['coach'];
    }

    get dashboardLabel() {
        return this.roleService.currentRole.charAt(0).toUpperCase() + this.roleService.currentRole.slice(1) + ' Dashboard';
    }

    getIconName(iconPath: string): string {
        // Map icon paths to lucide-angular icon names
        const iconMap: Record<string, string> = {
            'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z': 'users',
            'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3': 'dumbbell',
            'M13 10V3L4 14h7v7l9-11h-7z': 'activity',
            'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6': 'trending-up'
        };
        return iconMap[iconPath] || 'activity';
    }

    getTrend(stat: any): 'up' | 'down' | 'neutral' {
        if (stat.subtext?.includes('+') || stat.subtext?.toLowerCase().includes('up')) return 'up';
        if (stat.subtext?.includes('-') || stat.subtext?.toLowerCase().includes('down')) return 'down';
        return 'neutral';
    }

    getAthleteStatus(athlete: any): 'online' | 'offline' | 'busy' {
        // Determine status based on lastActive or other logic
        if (athlete.status) return athlete.status;
        return 'offline';
    }

    formatLastActive(lastActive: any): string {
        if (typeof lastActive === 'string') return lastActive;
        if (lastActive instanceof Date) {
            const now = new Date();
            const diff = now.getTime() - lastActive.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            if (hours < 1) return 'Just now';
            if (hours < 24) return `${hours}h ago`;
            const days = Math.floor(hours / 24);
            if (days === 1) return 'Yesterday';
            return `${days} days ago`;
        }
        return 'Unknown';
    }

    onAddClient() {
        // Navigate to add athlete page
        console.log('Add athlete clicked');
    }
}
