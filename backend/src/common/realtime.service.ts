import { Injectable, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class RealtimeService {
  private readonly eventSubject = new Subject<{ type: string; data: any }>();

  emit(type: string, data: any) {
    this.eventSubject.next({ type, data });
  }

  getEventsObservable(): Observable<MessageEvent> {
    return this.eventSubject.asObservable().pipe(
      map((event) => ({
        data: event,
      } as MessageEvent)),
    );
  }
}
