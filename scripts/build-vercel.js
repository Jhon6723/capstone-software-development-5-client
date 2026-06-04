const { mkdirSync, writeFileSync } = require('fs');
const { execSync } = require('child_process');

const env = {
  production: true,
  apiUrl: process.env.API_URL || '',
  notificationsWsUrl: process.env.NOTIFICATIONS_WS_URL || '',
  auth0: {
    domain: process.env.AUTH0_DOMAIN || '',
    clientId: process.env.AUTH0_CLIENT_ID || '',
    audience: process.env.AUTH0_AUDIENCE || '',
    redirectUri: process.env.AUTH0_REDIRECT_URI || ''
  }
};

mkdirSync('src/environments', { recursive: true });

const content = `export const environment = ${JSON.stringify(env, null, 2)};\n`;

writeFileSync('src/environments/environment.production.ts', content);
writeFileSync('src/environments/environment.ts', content);
console.log('Generated environment.ts content:', content);

console.log('Environment files created');
console.log('API_URL:', process.env.API_URL || 'NOT SET');

execSync('npx ng build --configuration production', { stdio: 'inherit' });
