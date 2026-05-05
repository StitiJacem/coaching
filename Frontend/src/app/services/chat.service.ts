import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket!: Socket;
  
  private messagesSubject = new BehaviorSubject<any[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  
  private contactsSubject = new BehaviorSubject<any[]>([]);
  public contacts$ = this.contactsSubject.asObservable();
  
  private conversationsSubject = new BehaviorSubject<any[]>([]);
  public conversations$ = this.conversationsSubject.asObservable();

  constructor(private http: HttpClient, private authService: AuthService) {
    this.initializeSocket();
    this.setupListeners();
  }

  private initializeSocket() {
    const token = this.authService.getToken();
    
    // Connect with token if available
    this.socket = io(environment.apiUrl, {
      auth: { token },
      autoConnect: !!token // Only connect if we have a token initially
    });

    if (token) {
      this.socket.connect();
    }
  }

  /**
   * Updates the socket connection with a new token (e.g. after login)
   */
  updateTokenAndReconnect() {
    const token = this.authService.getToken();
    if (token) {
      this.socket.auth = { token };
      if (this.socket.connected) {
        this.socket.disconnect();
      }
      this.socket.connect();
    }
  }

  private setupListeners() {
    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server');
      this.refreshContacts();
      this.refreshConversations();
    });

    this.socket.on('contacts_update', (contacts: any[]) => {
      console.log('[Socket] Received contacts update:', contacts.length);
      this.contactsSubject.next(contacts);
    });

    this.socket.on('conversations_update', (conversations: any[]) => {
      console.log('[Socket] Received conversations update:', conversations.length);
      this.conversationsSubject.next(conversations);
    });

    this.socket.on('new_message', (message: any) => {
      console.log('[Socket] Received new message:', message);
      const currentMessages = this.messagesSubject.getValue();
      // Only append if it belongs to the currently active conversation
      if (currentMessages.length === 0 || currentMessages[0].conversationId === message.conversationId) {
        // Prevent duplicates
        if (!currentMessages.find(m => m.id === message.id)) {
          this.messagesSubject.next([...currentMessages, message]);
        }
      }
    });

    this.socket.on('refresh_conversations', () => {
      this.refreshConversations();
    });

    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
    });
  }

  refreshContacts() {
    this.socket.emit('get_contacts');
  }

  refreshConversations() {
    this.socket.emit('get_conversations');
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/chat/conversations`);
  }

  getContacts(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/chat/contacts`);
  }

  getMessages(conversationId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/api/chat/conversations/${conversationId}/messages`);
  }

  startConversation(receiverId: number, type: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/api/chat/conversations`, { receiverId, type });
  }

  joinRoom(conversationId: string) {
    this.socket.emit('join_room', conversationId);
  }

  sendMessage(conversationId: string, senderId: number, content: string) {
    this.socket.emit('send_message', { conversationId, senderId, content });
  }

  setMessages(messages: any[]) {
    this.messagesSubject.next(messages);
  }
}
