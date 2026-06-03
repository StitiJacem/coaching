import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { RoleService } from '../../services/role.service';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { AvatarComponent } from '../ui/avatar/avatar.component';

@Component({
  selector: 'app-messaging-view',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, AvatarComponent],
  templateUrl: './messaging-view.component.html',
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.08); border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(249, 115, 22, 0.3); }
    @keyframes bubbleIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    .bubble-animate { animation: bubbleIn 0.2s ease-out; }
  `]
})
export class MessagingViewComponent implements OnInit, OnDestroy {
  @Input() isPopup: boolean = false;

  conversations: any[] = [];
  contacts: any[] = [];
  selectedConversation: any = null;
  messages: any[] = [];
  newMessage: string = '';
  
  activeTab: 'discussions' | 'contacts' = 'discussions';
  searchText: string = '';
  
  private messagesSubscription?: Subscription;
  private contactsSubscription?: Subscription;
  private conversationsSubscription?: Subscription;

  constructor(
    public roleService: RoleService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.messagesSubscription = this.chatService.messages$.subscribe(msgs => {
      this.messages = msgs;
      this.scrollToBottom();
    });

    this.conversationsSubscription = this.chatService.conversations$.subscribe(convs => {
      this.conversations = convs;
    });

    this.contactsSubscription = this.chatService.contacts$.subscribe(contacts => {
      this.contacts = contacts;
    });

    this.chatService.refreshContacts();
    this.chatService.refreshConversations();
  }

  get discoverableContacts() {
    return this.contacts.map(c => {
      let subtitle = 'Spécialiste';
      if (c.role === 'coach') subtitle = 'Coach Sportif';
      else if (c.role === 'nutritionist') subtitle = 'Nutritionniste';
      else if (c.role === 'athlete') subtitle = 'Athlète';
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

    return list.sort((a, b) => {
      const dateA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const dateB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      if (dateA !== dateB) return dateB - dateA;
      return (a.participant.first_name || '').toLowerCase().localeCompare((b.participant.first_name || '').toLowerCase());
    });
  }

  get filteredUnifiedList() {
    if (!this.searchText.trim()) return this.unifiedList;
    const query = this.searchText.toLowerCase();
    return this.unifiedList.filter(item => 
      (item.participant?.first_name || '').toLowerCase().includes(query) ||
      (item.participant?.last_name || '').toLowerCase().includes(query)
    );
  }

  get filteredDiscoverableContacts() {
    if (!this.searchText.trim()) return this.discoverableContacts;
    const query = this.searchText.toLowerCase();
    return this.discoverableContacts.filter(item => 
      (item.first_name || '').toLowerCase().includes(query) ||
      (item.last_name || '').toLowerCase().includes(query)
    );
  }

  onItemSelect(item: any) {
    if (item.type === 'conversation') this.selectConversation(item.raw);
    else this.selectContact(item.raw);
  }

  selectContact(contact: any) {
    const receiverUserId = contact.id;
    const type = this.roleService.currentRole === 'nutritionist' ? 'nutritionist-athlete' : 'coach-athlete';
    const existing = this.conversations.find(c => (c.participant1Id === receiverUserId || c.participant2Id === receiverUserId) && c.type === type);
    if (existing) this.selectConversation(existing);
    else {
      this.chatService.startConversation(receiverUserId, type).subscribe((newConv: any) => {
        this.conversations.unshift(newConv);
        this.selectConversation(newConv);
      });
    }
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
    this.chatService.sendMessage(this.selectedConversation.id, this.roleService.user.id, this.newMessage);
    this.newMessage = '';
  }

  scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-container-inner');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  }

  getParticipant(conv: any) {
    return conv.participant1Id === this.roleService.user.id ? conv.participant2 : conv.participant1;
  }

  ngOnDestroy() {
    this.messagesSubscription?.unsubscribe();
    this.contactsSubscription?.unsubscribe();
    this.conversationsSubscription?.unsubscribe();
  }
}
