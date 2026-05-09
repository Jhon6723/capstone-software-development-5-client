import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { AppConfig } from './app/core/interfaces/app-config.interface';

fetch('/assets/config.json')
  .then(res => res.json() as Promise<AppConfig>)
  .then((config: AppConfig) => {
    (window as Window & { __pixpro_config__?: AppConfig }).__pixpro_config__ = config;
    return bootstrapApplication(App, appConfig);
  })
  .catch(err => console.error('Error loading app:', err));
