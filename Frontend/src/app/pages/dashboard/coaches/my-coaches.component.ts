import { Component, OnInit } from '@angular/core';
import { CoachService, CoachingRequest } from '../../../services/coach.service';

@Component({
    selector: 'app-my-coaches',
    standalone: false,
    template: `
    <app-dashboard-layout>
    <div class="p-8 space-y-10 animate-fade-in pb-24">
      <!-- Back Button -->
      <div class="mb-4">
        <a routerLink="/dashboard" class="group flex items-center gap-2 text-slate-400 hover:text-gosport-orange transition-all font-bold text-xs uppercase tracking-widest">
          <lucide-icon name="arrow-left" class="w-4 h-4 group-hover:-translate-x-1 transition-transform"></lucide-icon>
          Revenir à l'accueil
        </a>
      </div>

      <!-- Header Section -->
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gosport-surface/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-gosport-border shadow-2xl relative overflow-hidden">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
        <div class="space-y-3 relative z-10">
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 rounded-full bg-gosport-orange/10 text-gosport-orange text-[10px] font-black uppercase tracking-widest border border-gosport-orange/20">Active Management</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-display font-black text-white uppercase italic tracking-tighter drop-shadow-lg">
            My <span class="text-gosport-orange">Specialists</span>
          </h1>
          <p class="text-slate-400 font-medium max-w-lg">Manage your active coaching relationships and the specialists monitoring your performance.</p>
        </div>
        <button routerLink="/dashboard/discovery"
          class="relative z-10 px-8 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.2em] rounded-2xl hover:bg-gosport-orange hover:text-white transition-all transform active:scale-95 shadow-xl shrink-0 border border-transparent">
          Find A Coach
        </button>
      </header>

      <!-- Skeleton or Empty State -->
      <div *ngIf="isLoading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <div *ngFor="let i of [1,2,3]" class="h-96 rounded-[2.5rem] bg-gosport-surface/50 border border-gosport-border animate-pulse"></div>
      </div>

      <div *ngIf="!isLoading && connectedRequests.length === 0"
        class="bg-gosport-surface/60 backdrop-blur-lg border-2 border-dashed border-gosport-border rounded-[3rem] p-20 text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div class="w-24 h-24 bg-gosport-orange/10 rounded-full flex items-center justify-center mx-auto text-gosport-orange/50 shadow-inner">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
        </div>
        <div class="space-y-2 relative z-10">
          <h3 class="text-2xl font-display font-bold text-white uppercase mt-4 tracking-wide">No Active Specialists</h3>
          <p class="text-slate-400 max-w-md mx-auto font-medium">Connect with elite coaches to elevate your performance to the next level. Your selected coaches will appear here.</p>
        </div>
      </div>

      <!-- Coaches Grid -->
      <div *ngIf="!isLoading && connectedRequests.length > 0" class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <div *ngFor="let req of connectedRequests"
          class="group flex flex-col bg-gosport-surface border border-gosport-border rounded-[2.5rem] overflow-hidden hover:border-gosport-orange/50 transition-all duration-500 hover:shadow-2xl hover:shadow-gosport-orange/10 transform hover:-translate-y-1">
          
          <!-- Profile Identity Area (Clickable) -->
          <div class="flex items-center gap-5 p-6 pb-0 cursor-pointer" [routerLink]="['/dashboard/profile-view/coach', req.coachProfile?.id]">
            <div class="relative w-24 h-24 shrink-0 rounded-2xl overflow-hidden border-2 border-gosport-border group-hover:border-gosport-orange transition-colors">
              <img [src]="getCoachAvatar(req)"
                   class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                   alt="Coach Photo">
            </div>
            
            <div class="flex-1 min-w-0">
               <div class="flex items-center gap-2 mb-1">
                 <span class="text-gosport-orange text-[10px] font-black uppercase tracking-[0.2em] bg-gosport-orange/10 px-2 py-0.5 rounded-md">
                   {{ req.coachProfile?.specializations?.[0] || 'Trainer' }}
                 </span>
                 <span class="flex items-center text-yellow-500 text-[10px] font-black">
                   <svg class="w-3 h-3 mr-0.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                   {{ req.coachProfile?.rating || '5.0' }}
                 </span>
               </div>
               <h3 class="text-2xl font-display font-black text-white uppercase italic tracking-tight truncate group-hover:text-gosport-orange transition-colors">
                 {{ req.coachProfile?.user?.first_name || 'Expert' }} {{ req.coachProfile?.user?.last_name || 'Coach' }}
               </h3>
               <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">{{ req.coachProfile?.experience_years || '5+' }} Years Exp</p>
            </div>
          </div>

          <!-- Bio & Details -->
          <div class="px-6 pt-5 pb-6 flex-1 flex flex-col">
            <p class="text-slate-400 text-sm italic leading-relaxed font-medium line-clamp-3 mb-6 flex-1">
              "{{ req.coachProfile?.bio || 'Professional coach dedicated to optimizing your performance and reaching your goals.' }}"
            </p>

            <!-- Actions -->
            <div class="flex flex-col gap-3 mt-auto">
              <!-- View Profile Button -->
              <button [routerLink]="['/dashboard/profile-view/coach', req.coachProfile?.id]" 
                class="w-full py-4 rounded-xl bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gosport-orange hover:text-white transition-all shadow-lg active:scale-[98%] flex justify-center items-center gap-2">
                View Public Profile
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
              
              <!-- Message & Terminate row -->
              <div class="flex gap-3">
                <button [routerLink]="['/dashboard/messaging']" [queryParams]="{ coachId: req.coachProfileId }"
                  class="flex-1 py-3.5 rounded-xl bg-gosport-surface border-2 border-gosport-orange/20 text-gosport-orange font-black uppercase text-[10px] tracking-[0.2em] hover:bg-gosport-orange hover:text-white hover:border-transparent transition-all active:scale-[98%] shadow-lg">
                  Message
                </button>
                <button (click)="onTerminate(req)" title="Terminate Connection"
                  class="w-[52px] shrink-0 py-3.5 rounded-xl border-2 border-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-[98%]">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </app-dashboard-layout>
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

    getCoachAvatar(req: any): string {
        const fallback = `https://ui-avatars.com/api/?name=${req.coachProfile?.user?.first_name || 'Expert'}+${req.coachProfile?.user?.last_name || 'Coach'}&background=random`;
        return req.coachProfile?.avatar || req.coachProfile?.user?.avatar || fallback;
    }
}
