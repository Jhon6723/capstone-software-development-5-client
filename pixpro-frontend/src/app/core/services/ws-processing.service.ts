import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Observable, Subject, tap } from 'rxjs';

export interface WsStatus {
  status: 'uploading' | 'processing' | 'optimizing' | 'complete' | 'error';
  progress: number;
  message: string;
  projectId?: string;
}

@Injectable({ providedIn: 'root' })
export class WsProcessingService {
  private ws$: WebSocketSubject<WsStatus> | null = null;
  private status$ = new Subject<WsStatus>();

  connect(projectId: string): Observable<WsStatus> {
    const url = `ws://tu-backend.com/ws/projects/${projectId}`;
    this.ws$ = webSocket<WsStatus>({
      url,
      binaryType: 'arraybuffer',
      closeObserver: { next: () => console.log('WS closed') }
    });

    return this.ws$.pipe(
      tap(msg => this.status$.next(msg)),
      // Reconexión automática en producción recomendada
    );
  }

  disconnect(): void {
    this.ws$?.complete();
    this.ws$ = null;
  }
}