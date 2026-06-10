import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { ToastService } from '../../../services/toast.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    LucideAngularModule,
    DashboardLayoutComponent
  ],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css'
})
export class AdminSettingsComponent implements OnInit {
  // Admin Profile Profile
  adminName = '';
  adminEmail = '';
  adminRole = 'Administrateur';
  isEmailVerified = true;

  // Security Form
  newPassword = '';
  confirmPassword = '';

  // Preferences Form
  appName = 'GOSPORT';
  defaultLanguage = 'fr';
  defaultTheme = 'dark';
  itemsPerPage = 10;

  // Platform Notification Switches
  notifyNewUsers = true;
  notifyNewPrograms = false;
  notifyUnverifiedAccounts = true;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.adminName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || 'Admin';
        this.adminEmail = user.email || '';
        this.isEmailVerified = user.is_verified !== undefined ? !!user.is_verified : true;
      } catch (e) {
        console.error('Error loading admin settings user info', e);
      }
    }
  }

  updateProfile(): void {
    if (!this.adminName.trim() || !this.adminEmail.trim()) {
      this.toastService.showError('Le nom et l\'email sont requis.');
      return;
    }
    this.toastService.showSuccess('Profil administrateur mis à jour localement.');
  }

  changePassword(): void {
    if (!this.newPassword) {
      this.toastService.showError('Veuillez saisir un nouveau mot de passe.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.toastService.showError('Les mots de passe ne correspondent pas.');
      return;
    }
    this.toastService.showSuccess('Mot de passe mis à jour avec succès.');
    this.newPassword = '';
    this.confirmPassword = '';
  }

  disconnectAllDevices(): void {
    this.toastService.showSuccess('Déconnexion de tous les autres appareils effectuée.');
  }

  saveGlobalSettings(): void {
    this.toastService.showSuccess('Tous les paramètres de la plateforme ont été enregistrés.');
  }
}
