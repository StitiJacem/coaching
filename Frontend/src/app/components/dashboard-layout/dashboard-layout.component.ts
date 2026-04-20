import { Component, OnInit } from '@angular/core';
import { RoleService } from '../../services/role.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { NutritionService } from '../../services/nutrition.service';

import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-dashboard-layout',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './dashboard-layout.component.html',
    styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
    mobileMenuOpen = false;
    notificationsOpen = false;
    notifications: Notification[] = [];
    unreadCount = 0;

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

    constructor(
        public roleService: RoleService,
        private notificationService: NotificationService,
        private nutritionService: NutritionService
    ) { }

    ngOnInit(): void {
        this.loadNotifications();
    }

    loadNotifications(): void {
        this.notificationService.getAll(10, 0).subscribe({
            next: (res) => {
                this.notifications = res.notifications;
                this.unreadCount = res.notifications.filter(n => !n.read).length;
            }
        });
    }

    toggleNotifications(): void {
        this.notificationsOpen = !this.notificationsOpen;
        if (this.notificationsOpen) this.loadNotifications();
    }

    markAsRead(notification: Notification): void {
        if (notification.read) return;
        this.notificationService.markRead([notification.id]).subscribe({
            next: () => {
                notification.read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
            }
        });
    }

    deleteNotification(event: Event, notification: Notification): void {
        event.stopPropagation();
        this.notificationService.deleteNotification(notification.id).subscribe({
            next: () => {
                this.notifications = this.notifications.filter(n => n.id !== notification.id);
                if (!notification.read) {
                    this.unreadCount = Math.max(0, this.unreadCount - 1);
                }
            }
        });
    }

    formatNotificationDate(date: string): string {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }

    acceptNutritionInvite(event: Event, notification: Notification): void {
        event.stopPropagation();
        
        let connId: string | undefined;
        if (typeof notification.payload === 'string') {
            try {
                connId = JSON.parse(notification.payload)['connectionId'];
            } catch (e) {}
        } else if (notification.payload) {
            connId = notification.payload['connectionId'] as string;
        }

        if (!connId) {
            console.error('No connectionId found in payload', notification.payload);
            return;
        }

        this.nutritionService.respondToConnectionRequest(connId, 'accepted').subscribe({
            next: () => {
                this.deleteNotification(event, notification);
            },
            error: (err) => console.error('Error accepting invite:', err)
        });
    }

    rejectNutritionInvite(event: Event, notification: Notification): void {
        event.stopPropagation();

        let connId: string | undefined;
        if (typeof notification.payload === 'string') {
            try {
                connId = JSON.parse(notification.payload)['connectionId'];
            } catch (e) {}
        } else if (notification.payload) {
            connId = notification.payload['connectionId'] as string;
        }

        if (!connId) {
            console.error('No connectionId found in payload', notification.payload);
            return;
        }

        this.nutritionService.respondToConnectionRequest(connId, 'rejected').subscribe({
            next: () => {
                this.deleteNotification(event, notification);
            },
            error: (err) => console.error('Error rejecting invite:', err)
        });
    }
}
