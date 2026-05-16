import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface ConfirmData {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  resolve: (value: boolean) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmService {
  private confirmSubject = new Subject<ConfirmData>();
  public confirm$ = this.confirmSubject.asObservable();

  confirm(message: string, options: { title?: string, confirmText?: string, cancelText?: string, type?: 'danger' | 'warning' | 'info' } = {}): Promise<boolean> {
    return new Promise((resolve) => {
      this.confirmSubject.next({
        message,
        title: options.title || 'Action Required',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        type: options.type || 'info',
        resolve
      });
    });
  }

  ask(message: string, type: 'danger' | 'warning' | 'info' = 'info'): Promise<boolean> {
    return this.confirm(message, { type });
  }

  danger(message: string, title: string = 'Critical Action'): Promise<boolean> {
    return this.confirm(message, { title, type: 'danger', confirmText: 'Proceed' });
  }
}
