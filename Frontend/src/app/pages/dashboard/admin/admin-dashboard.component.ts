import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { DashboardLayoutComponent } from '../../../components/dashboard-layout/dashboard-layout.component';
import { AdminService } from '../../../services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
    DashboardLayoutComponent
  ],
  template: `
    <app-dashboard-layout>
      <div class="space-y-8">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 class="text-3xl font-display font-bold text-white uppercase tracking-wider">
              Administration <span class="text-gosport-orange">Site</span>
            </h1>
            <p class="text-slate-400 mt-1">Gérer les utilisateurs et surveiller l'activité de la plateforme.</p>
          </div>
          <div class="flex gap-3">
            <button class="bg-gosport-orange hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-gosport-orange/20">
              Paramètres Système
            </button>
          </div>
        </div>

        <!-- Global Stats -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-gosport-surface border border-gosport-border p-6 rounded-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <lucide-angular name="users" size="64" class="text-white"></lucide-angular>
            </div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Total Utilisateurs</p>
            <h3 class="text-4xl font-display font-bold text-white">{{ stats?.totalUsers || 0 }}</h3>
            <p class="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span class="text-emerald-400 font-bold">+5%</span> cette semaine
            </p>
          </div>

          <div class="bg-gosport-surface border border-gosport-border p-6 rounded-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <lucide-angular name="award" size="64" class="text-white"></lucide-angular>
            </div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Coachs Actifs</p>
            <h3 class="text-4xl font-display font-bold text-white">{{ stats?.totalCoaches || 0 }}</h3>
            <p class="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <span class="text-emerald-400 font-bold">+2</span> nouveau coach
            </p>
          </div>

          <div class="bg-gosport-surface border border-gosport-border p-6 rounded-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <lucide-angular name="activity" size="64" class="text-white"></lucide-angular>
            </div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Athlètes</p>
            <h3 class="text-4xl font-display font-bold text-white">{{ stats?.totalAthletes || 0 }}</h3>
            <p class="text-xs text-slate-400 mt-2 flex items-center gap-1">
              {{ stats?.totalAthletes || 0 }} athlètes enregistrés
            </p>
          </div>

          <div class="bg-gosport-surface border border-gosport-border p-6 rounded-2xl relative overflow-hidden group">
            <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
               <lucide-angular name="layout" size="64" class="text-white"></lucide-angular>
            </div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Programmes</p>
            <h3 class="text-4xl font-display font-bold text-white">{{ stats?.totalPrograms || 0 }}</h3>
            <p class="text-xs text-slate-400 mt-2 flex items-center gap-1">
               {{ stats?.totalPrograms || 0 }} plans d'entraînement
            </p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gosport-surface border border-gosport-border p-8 rounded-3xl hover:border-gosport-orange/30 transition-all cursor-pointer group"
               [routerLink]="['/dashboard/admin/users']">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 rounded-2xl bg-gosport-orange/10 flex items-center justify-center text-gosport-orange group-hover:scale-110 transition-transform">
                   <lucide-angular name="users-round" size="32"></lucide-angular>
                </div>
                <div>
                   <h3 class="text-xl font-bold text-white mb-1">Gestion des Utilisateurs</h3>
                   <p class="text-slate-400 text-sm">Voir, modifier les rôles ou supprimer des comptes utilisateurs.</p>
                </div>
             </div>
          </div>

          <div class="bg-gosport-surface border border-gosport-border p-8 rounded-3xl hover:border-gosport-orange/30 transition-all cursor-pointer group">
             <div class="flex items-center gap-6">
                <div class="w-16 h-16 rounded-2xl bg-emerald-400/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                   <lucide-angular name="bar-chart-3" size="32"></lucide-angular>
                </div>
                <div>
                   <h3 class="text-xl font-bold text-white mb-1">Statistiques Globales</h3>
                   <p class="text-slate-400 text-sm">Analyser la croissance et l'utilisation de la plateforme GoSport.</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </app-dashboard-layout>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  stats: any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.adminService.getStats().subscribe({
      next: (data) => this.stats = data,
      error: (err) => console.error('Error loading admin stats', err)
    });
  }
}
