import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAuth0 } from '@auth0/auth0-angular';
import { AuthClientConfig } from '@auth0/auth0-angular';

import { routes } from './app.routes';
import { jwtInterceptor } from './core/interceptors/jwt.interceptor';
import { AppConfigService } from './core/config/app.config.service';

function initConfig(configService: AppConfigService, auth0ClientConfig: AuthClientConfig): () => Promise<void> {
  return async () => {
    await configService.load();

    const domain = configService.get('auth0.domain');
    const clientId = configService.get('auth0.clientId');
    const audience = configService.get('auth0.audience');

    auth0ClientConfig.set({
      domain,
      clientId,
      authorizationParams: {
        audience,
        redirect_uri: window.location.origin + '/auth/callback',
      },
    });
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([jwtInterceptor])),
    provideAnimationsAsync(),
    provideAuth0({ domain: 'placeholder.auth0.com', clientId: 'placeholder' }),
    {
      provide: APP_INITIALIZER,
      useFactory: initConfig,
      deps: [AppConfigService, AuthClientConfig],
      multi: true,
    },
  ],
};
