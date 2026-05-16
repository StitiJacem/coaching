import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { AdminService } from '../../../services/admin.service';
import { ToastService } from '../../../services/toast.service';
import { ConfirmService } from '../../../services/confirm.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    DashboardLayoutComponent
  ],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.css'
})
export class UserManagementComponent implements OnInit {
  users: any[] = [];
  searchQuery = '';
  filterRole = '';

  constructor(
    private adminService: AdminService, 
    private toastService: ToastService,
    private confirmService: ConfirmService
  ) {}

  environment = environment;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.adminService.getUsers({ role: this.filterRole, search: this.searchQuery }).subscribe({
      next: (data: any[]) => this.users = data,
      error: (err: any) => console.error('Error loading users', err)
    });
  }

  async updateRole(user: any, newRole: string): Promise<void> {
    const confirmed = await this.confirmService.ask(`Voulez-vous vraiment changer le rôle de ${user.first_name} en ${newRole} ?`, 'warning');
    if (confirmed) {
      this.adminService.updateUserRole(user.id, newRole).subscribe({
        next: () => {
          user.role = newRole;
          this.toastService.showSuccess(`Rôle de ${user.first_name} mis à jour.`);
        },
        error: (err: any) => {
          console.error('Error updating role', err);
          this.toastService.showError('Erreur lors du changement de rôle.');
          this.loadUsers(); // Revert on error
        }
      });
    } else {
        this.loadUsers(); // Revert UI
    }
  }

  async deleteUser(user: any): Promise<void> {
    const confirmed = await this.confirmService.danger(
      `Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur ${user.first_name} ${user.last_name} ? Cette action est irréversible.`,
      'Supprimer Utilisateur'
    );
    
    if (confirmed) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.users = this.users.filter(u => u.id !== user.id);
          this.toastService.showSuccess('Utilisateur supprimé.');
        },
        error: (err: any) => {
          console.error('Error deleting user', err);
          this.toastService.showError(`Erreur lors de la suppression: ${err.error?.message || err.message}`);
        }
      });
    }
  }

  getRoleColor(role: string): string {
    switch (role) {
      case 'coach': return 'text-galio-orange';
      case 'athlete': return 'text-galio-lime';
      case 'nutritionist': return 'text-emerald-400';
      case 'admin': return 'text-purple-400';
      default: return 'text-slate-400';
    }
  }
}
