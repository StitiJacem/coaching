import { Component, OnInit } from '@angular/core';
import { CoachService, CoachingRequest } from '../../../services/coach.service';

@Component({
    selector: 'app-my-coaches',
    standalone: false,
    template: `
    <div class="p-8 space-y-10 animate-in fade-in duration-700">
      <!-- Header Section -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="space-y-2">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-gosport-orange/10 text-gosport-orange text-[10px] font-black uppercase tracking-widest border border-gosport-orange/20">Active Management</span>
          </div>
          <h1 class="text-5xl font-display font-black text-white uppercase italic tracking-tighter">
            My <span class="text-gosport-orange">Specialists</span>
          </h1>
          <p class="text-slate-400 font-medium max-w-lg">Manage your active coaching relationships and specialists monitoring your performance.</p>
        </div>
      </header>

      <!-- Skeleton or Empty State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let i of [1,2,3]" class="h-80 rounded-[2.5rem] bg-gosport-surface/50 border border-gosport-border animate-pulse"></div>
      </div>

      <div *ngIf="!isLoading && connectedRequests.length === 0" 
        class="bg-gosport-surface border-2 border-dashed border-gosport-border rounded-[3rem] p-20 text-center space-y-6">
        <div class="w-24 h-24 bg-gosport-orange/5 rounded-full flex items-center justify-center mx-auto text-gosport-orange/20">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <div class="space-y-2">
          <h3 class="text-2xl font-display font-bold text-white uppercase mt-4">No Coaches Connected</h3>
          <p class="text-slate-500 max-w-sm mx-auto font-medium">Connect with elite specialists to elevate your performance to the next level.</p>
        </div>
        <button routerLink="/dashboard/discovery" 
          class="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-gosport-orange hover:text-white transition-all transform active:scale-95 shadow-xl">
          Browse Marketplace
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
        </button>
      </div>

      <!-- Coaches Grid -->
      <div *ngIf="!isLoading && connectedRequests.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let req of connectedRequests" 
          class="group relative bg-gosport-surface border border-gosport-border rounded-[2.5rem] overflow-hidden hover:border-gosport-orange/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gosport-orange/10 transform hover:-translate-y-2">
          
          <!-- Card Header & Image -->
          <div class="aspect-[4/3] relative overflow-hidden">
            <img [src]="req.coachProfile?.avatar || 'assets/avatars/default-coach.png'" 
              class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-110" 
              alt="Coach Photo">
            <div class="absolute inset-0 bg-gradient-to-t from-gosport-surface via-gosport-surface/20 to-transparent"></div>
            
            <!-- Badges -->
            <div class="absolute top-6 right-6 flex flex-col gap-2 items-end">
              <span class="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest border border-white/10">
                ⭐ {{ req.coachProfile?.rating || '5.0' }}
              </span>
              <span class="px-4 py-1.5 rounded-full bg-gosport-orange/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest">
                {{ req.coachProfile?.experience_years || '5+' }}yr EXP
              </span>
            </div>
          </div>

          <!-- Card Content -->
          <div class="p-8 space-y-6">
            <div class="space-y-1">
              <p class="text-gosport-orange text-[10px] font-black uppercase tracking-[0.3em]">{{ req.coachProfile?.specializations?.[0] || 'Specialist' }}</p>
              <h3 class="text-2xl font-display font-black text-white uppercase italic tracking-tight">{{ req.coachProfile?.user?.first_name }} {{ req.coachProfile?.user?.last_name }}</h3>
            </div>

            <p class="text-slate-400 text-sm line-clamp-2 italic leading-relaxed font-medium">"{{ req.coachProfile?.bio || 'Highly dedicated specialist focused on elite performance monitoring.' }}"</p>

            <div class="pt-4 flex flex-col gap-3">
              <button class="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gosport-orange hover:text-white transition-all active:scale-95 shadow-lg">
                View Reports
              </button>
              <button (click)="onTerminate(req)" 
                class="w-full py-4 rounded-xl border border-white/5 text-slate-500 font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/20 transition-all">
                Terminate Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    :host { display: block; }
  `]
})
export class MyCoachesComponent implements OnInit {
    connectedRequests: CoachingRequest[] = [];
    isLoading = true;

    constructor(private coachService: CoachService) { }

    ngOnInit(): void {
        this.loadConnections();
    }

    loadConnections(): void {
        this.isLoading = true;
        this.coachService.getMyRequests().subscribe({
            next: (requests) => {
                // Filter for accepted connections
                this.connectedRequests = requests.filter(r => r.status === 'accepted');
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading connections:', err);
                this.isLoading = false;
            }
        });
    }

    onTerminate(request: CoachingRequest): void {
        if (confirm(`Are you sure you want to terminate your connection with ${request.coachProfile?.user?.first_name}? This cannot be undone.`)) {
            this.coachService.terminateConnection(request.id!).subscribe({
                next: () => {
                    this.connectedRequests = this.connectedRequests.filter(r => r.id !== request.id);
                    alert('Connection terminated successfully.');
                },
                error: (err) => {
                    console.error('Error terminating connection:', err);
                    alert('Failed to terminate connection. Please try again.');
                }
            });
        }
    }
}
