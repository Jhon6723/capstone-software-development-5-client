import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

interface WsEnvelope {
  type?: string;
  notification?: {
    metadata?: Record<string, string>;
    Metadata?: Record<string, string>;
  };
  error?: {
    message?: string;
    Message?: string;
    code?: string;
    Code?: string;
  };
}

export interface WsProcessingEvent {
  type: 'IMAGE_UPLOADED' | 'IMAGE_PROCESSING_COMPLETED' | 'IMAGE_PROCESSING_FAILED' | 'NOTIFICATION' | 'pong' | 'unknown';
  projectId?: string;
  imageId?: string;
  processedCount?: number;
  errorMessage?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class WsProcessingService {
  private readonly authService = inject(AuthService);
  private socket: WebSocket | null = null;
  private keepAliveInterval: ReturnType<typeof setInterval> | null = null;
  private readonly debugEnabled = !environment.production;

  connect(): Observable<WsProcessingEvent> {
    return new Observable<WsProcessingEvent>(observer => {
      const token = this.authService.getToken();
      if (!token) {
        observer.error(new Error('No authentication token available for WebSocket connection.'));
        return;
      }

      const url = this.buildSocketUrl(environment.notificationsWsUrl, token);
      this.debug('connecting', { url: this.maskToken(url) });
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.debug('open');
        this.keepAliveInterval = setInterval(() => {
          if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: 'ping' }));
            this.debug('ping sent');
          }
        }, 30000);
      };

      this.socket.onmessage = event => {
        this.debug('raw message', event.data);
        const parsed = this.parseMessage(event.data);
        if (parsed) {
          this.debug('parsed event', parsed);
          observer.next(parsed);
        } else {
          this.debug('message ignored (parse failed or unsupported format)');
        }
      };

      this.socket.onerror = error => {
        this.debug('error', error);
        observer.error(new Error('WebSocket connection error.'));
      };

      this.socket.onclose = event => {
        this.debug('close', { code: event.code, reason: event.reason, wasClean: event.wasClean });
        observer.complete();
      };

      return () => this.disconnect();
    });
  }

  disconnect(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.debug('disconnect requested by client');
      this.socket.close(1000, 'Client disconnect');
    }

    this.socket = null;
  }

  private buildSocketUrl(baseUrl: string, token: string): string {
    const wsUrl = new URL(baseUrl);

    if (wsUrl.protocol === 'https:') {
      wsUrl.protocol = 'wss:';
    } else if (wsUrl.protocol === 'http:') {
      wsUrl.protocol = 'ws:';
    }

    wsUrl.searchParams.set('access_token', token);
    return wsUrl.toString();
  }

  private parseMessage(raw: string): WsProcessingEvent | null {
    try {
      const message = JSON.parse(raw) as WsEnvelope;
      const type = message.type ?? 'unknown';

      if (type === 'pong') {
        return { type: 'pong' };
      }

      const metadata = message.notification?.metadata ?? message.notification?.Metadata ?? {};
      const processedImageUrls = (metadata['processedImageUrls'] ?? '')
        .split(',')
        .map(url => url.trim())
        .filter(Boolean);

      if (type === 'IMAGE_PROCESSING_COMPLETED') {
        return {
          type,
          projectId: metadata['projectId'],
          imageId: metadata['imageId'],
          processedCount: processedImageUrls.length || 1,
        };
      }

      if (type === 'IMAGE_PROCESSING_FAILED') {
        return {
          type,
          projectId: metadata['projectId'],
          imageId: metadata['imageId'],
          errorMessage: message.error?.message ?? message.error?.Message ?? metadata['errorMessage'],
          errorCode: message.error?.code ?? message.error?.Code ?? metadata['errorCode'],
        };
      }

      if (type === 'IMAGE_UPLOADED' || type === 'NOTIFICATION') {
        return {
          type,
          projectId: metadata['projectId'],
          imageId: metadata['imageId'],
        };
      }

      return { type: 'unknown' };
    } catch (error) {
      this.debug('parse error', error);
      return null;
    }
  }

  private debug(message: string, payload?: unknown): void {
    if (!this.debugEnabled) {
      return;
    }

    if (payload === undefined) {
      console.debug('[WsProcessingService]', message);
      return;
    }

    console.debug('[WsProcessingService]', message, payload);
  }

  private maskToken(url: string): string {
    return url.replace(/access_token=[^&]+/, 'access_token=***');
  }
}