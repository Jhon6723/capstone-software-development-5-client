import { Auth0Config } from './auth0-config.interface';

export interface AppConfig {
  apiUrl: string;
  auth0: Auth0Config;
}
