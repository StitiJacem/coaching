import { Component } from '@angular/core';
import { RoleService } from '../../services/role.service';

import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent {
    mobileMenuOpen = false;

    badgeVariants: Record<string, string> = {
        coach: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
        athlete: 'bg-gosport-lime/10 text-gosport-lime border border-gosport-lime/20',
        doctor: 'bg-gosport-danger/10 text-gosport-danger border border-gosport-danger/20',
        nutritionist: 'bg-gosport-lime/10 text-gosport-lime border border-gosport-lime/20',
        manager: 'bg-transparent border border-slate-600 text-slate-400'
    };

    searchPlaceholders: Record<string, string> = {
        coach: 'Search athletes, programs...',
        athlete: 'Search workouts, goals...',
        doctor: 'Search patients, records...',
        nutritionist: 'Search clients, plans...',
        manager: 'Search members, reports...'
    };

    constructor(public roleService: RoleService) { }
}
