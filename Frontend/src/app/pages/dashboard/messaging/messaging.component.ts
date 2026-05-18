import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { CoachService, Coach } from '../../../services/coach.service';
import { NutritionistService } from '../../../services/nutritionist.service';

@Component({
  selector: 'app-messaging',
  standalone: false,
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.css']
})
export class MessagingComponent implements OnInit, OnDestroy {
  conversations: any[] = [];
  contacts: any[] = [];
  selectedConversation: any = null;
  messages: any[] = [];
  newMessage: string = '';
  
  // Tab and search support
  activeTab: 'discussions' | 'contacts' = 'discussions';
  searchText: string = '';
  
  private messagesSubscription?: Subscription;
  private contactsSubscription?: Subscription;
  private conversationsSubscription?: Subscription;

  constructor(
    public roleService: RoleService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private athleteService: AthleteService,
    private coachService: CoachService,
    private nutritionistService: NutritionistService
  ) {}

  ngOnInit() {
    this.messagesSubscription = this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.scrollToBottom();
    });

    this.conversationsSubscription = this.chatService.conversations$.subscribe(convs => {
      this.conversations = convs;
      // Only handle query params once we have conversations to check against
      if (convs.length >= 0) {
        this.handleQueryParams();
      }
    });

    this.contactsSubscription = this.chatService.contacts$.subscribe(contacts => {
      this.contacts = contacts;
    });

    // Initial refresh to trigger socket fetch
    this.chatService.refreshContacts();
    this.chatService.refreshConversations();
  }

  get discoverableContacts() {
    return this.contacts.map(c => {
      let subtitle = 'Spécialiste';
      if (c.role === 'coach') {
        subtitle = 'Coach Sportif';
      } else if (c.role === 'nutritionist') {
        subtitle = 'Nutritionniste';
      } else if (c.role === 'athlete') {
        subtitle = 'Athlète';
      }
      return {
        id: c.id,
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        photo_url: c.photo_url || c.avatar,
        role: c.role,
        subtitle: subtitle
      };
    });
  }

  get unifiedList() {
    const list: any[] = [];
    
    // 1. Add existing conversations
    this.conversations.forEach(conv => {
      const participant = this.getParticipant(conv);
      if (!participant) return;
      
      list.push({
        type: 'conversation',
        id: conv.id,
        participant: participant,
        lastMessage: conv.lastMessageContent || 'Démarrer une discussion',
        lastMessageAt: conv.lastMessageAt,
        raw: conv
      });
    });

    // 2. Add contacts who DON'T have a conversation yet
    this.contacts.forEach(contact => {
      const hasConv = this.conversations.some(conv => 
        conv.participant1Id === contact.id || conv.participant2Id === contact.id
      );
      
      if (!hasConv) {
        list.push({
          type: 'contact',
          id: `contact-${contact.id}`,
          participant: contact,
          lastMessage: 'Nouveau contact',
          lastMessageAt: null,
          raw: contact
        });
      }
    });

    // 3. Sort by last message date (conversations first, then alphabetically)
    return list.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      
      if (dateA !== dateB) return dateB - dateA;
      
      const nameA = (a.participant.first_name || '').toLowerCase();
      const nameB = (b.participant.first_name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }

  get filteredUnifiedList() {
    const list = this.unifiedList;
    if (!this.searchText.trim()) return list;
    
    const query = this.searchText.toLowerCase();
    return list.filter(item => 
      (item.participant?.first_name || '').toLowerCase().includes(query) ||
      (item.participant?.last_name || '').toLowerCase().includes(query)
    );
  }

  get filteredDiscoverableContacts() {
    const list = this.discoverableContacts;
    if (!this.searchText.trim()) return list;
    
    const query = this.searchText.toLowerCase();
    return list.filter(item => 
      (item.first_name || '').toLowerCase().includes(query) ||
      (item.last_name || '').toLowerCase().includes(query) ||
      (item.subtitle || '').toLowerCase().includes(query)
    );
  }

  handleQueryParams() {
    this.route.queryParams.subscribe(params => {
      const coachId = params['coachId'];
      const athleteId = params['athleteId'];

      if (coachId) {
        this.coachService.getById(coachId).subscribe((profile: Coach) => {
          this.startOrSelectConversation(profile.userId, 'coach-athlete');
        });
      } else if (athleteId) {
        this.athleteService.getById(Number(athleteId)).subscribe((athlete: Athlete) => {
          if (athlete.userId) {
            const type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
            this.startOrSelectConversation(athlete.userId, type);
          }
        });
      }
    });
  }

  onItemSelect(item: any) {
    if (item.type === 'conversation') {
      this.selectConversation(item.raw);
    } else {
      this.selectContact(item.raw);
    }
  }

  onContactSelect(contact: any) {
    let type: 'coach-athlete' | 'nutritionist-athlete' = 'coach-athlete';
    
    if (this.roleService.currentRole === 'athlete') {
      type = contact.role === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
    } else {
      type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
    }
    
    this.startOrSelectConversation(contact.id, type);
    this.activeTab = 'discussions';
    this.searchText = '';
  }

  selectContact(contact: any) {
    const receiverUserId = contact.id;
    const type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
    
    const existing = this.conversations.find(c => 
      (c.participant1Id === receiverUserId || c.participant2Id === receiverUserId) && c.type === type
    );

    if (existing) {
      this.selectConversation(existing);
    } else {
      this.chatService.startConversation(receiverUserId, type).subscribe((newConv: any) => {
        this.conversations.unshift(newConv);
        this.selectConversation(newConv);
      });
    }
  }

  startOrSelectConversation(receiverUserId: number, type: any) {
    const existing = this.conversations.find(c => 
      (c.participant1Id === receiverUserId || c.participant2Id === receiverUserId) && c.type === type
    );

    if (existing) {
      this.selectConversation(existing);
    } else {
      this.chatService.startConversation(receiverUserId, type).subscribe((newConv: any) => {
        this.conversations.unshift(newConv);
        this.selectConversation(newConv);
      });
    }
  }

  ngOnDestroy() {
    this.messagesSubscription?.unsubscribe();
    this.contactsSubscription?.unsubscribe();
    this.conversationsSubscription?.unsubscribe();
  }

  loadConversations() {
    this.chatService.getConversations().subscribe((convs: any[]) => {
      this.conversations = convs;
    });
  }

  selectConversation(conv: any) {
    this.selectedConversation = conv;
    this.chatService.joinRoom(conv.id);
    this.chatService.getMessages(conv.id).subscribe((msgs: any[]) => {
      this.chatService.setMessages(msgs);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedConversation) return;

    this.chatService.sendMessage(
      this.selectedConversation.id,
      this.roleService.user.id,
      this.newMessage
    );
    this.newMessage = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  getParticipant(conv: any) {
    return conv.participant1Id === this.roleService.user.id 
      ? conv.participant2 
      : conv.participant1;
  }
}
