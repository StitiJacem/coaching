import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { io, Socket } from 'socket.io-client';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<any[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.socket = io(environment.apiUrl);

    this.socket.on('new_message', (message: any) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, message]);
    });
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
