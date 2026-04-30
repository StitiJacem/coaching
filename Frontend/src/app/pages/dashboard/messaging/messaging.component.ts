import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoleService } from '../../../services/role.service';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AthleteService, Athlete } from '../../../services/athlete.service';
import { CoachService, Coach } from '../../../services/coach.service';

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
  activeTab: 'messages' | 'contacts' = 'messages';
  private messagesSubscription?: Subscription;
  private contactsSubscription?: Subscription;
  private conversationsSubscription?: Subscription;

  constructor(
    public roleService: RoleService,
    private chatService: ChatService,
    private route: ActivatedRoute,
    private athleteService: AthleteService,
    private coachService: CoachService
  ) {}

  ngOnInit() {
    this.messagesSubscription = this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
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

  handleQueryParams() {
    this.route.queryParams.subscribe(params => {
      const coachId = params['coachId'];
      const athleteId = params['athleteId'];

      if (coachId) {
        // Find coach's user ID and start conversation
        this.coachService.getById(coachId).subscribe((profile: Coach) => {
          this.startOrSelectConversation(profile.userId, 'coach-athlete');
        });
      } else if (athleteId) {
        // Find athlete's user ID and start conversation
        this.athleteService.getById(Number(athleteId)).subscribe((athlete: Athlete) => {
          if (athlete.userId) {
            const type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
            this.startOrSelectConversation(athlete.userId, type);
          }
        });
      }
    });
  }

  selectContact(contact: any) {
    // Check if conversation exists
    const receiverUserId = contact.id;
    const type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
    
    const existing = this.conversations.find(c => 
      (c.participant1Id === receiverUserId || c.participant2Id === receiverUserId) && c.type === type
    );

    if (existing) {
      this.selectConversation(existing);
    } else {
      this.chatService.startConversation(receiverUserId, type).subscribe((newConv: any) => {
        // Socket should refresh list, but we can unshift for instant feedback
        this.conversations.unshift(newConv);
        this.selectConversation(newConv);
      });
    }
    this.activeTab = 'messages';
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

  getParticipant(conv: any) {
    return conv.participant1Id === this.roleService.user.id 
      ? conv.participant2 
      : conv.participant1;
  }
}
