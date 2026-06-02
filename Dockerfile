FROM node:22-alpine AS build
WORKDIR /app
ARG API_URL=/api
ARG NOTIFICATIONS_WS_URL=
ARG AUTH0_DOMAIN=
ARG AUTH0_CLIENT_ID=
ARG AUTH0_AUDIENCE=
ARG AUTH0_REDIRECT_URI=
COPY pixpro-frontend/package*.json ./
RUN npm ci
COPY pixpro-frontend/ .
RUN mkdir -p src/environments && \
    echo "export const environment = { production: true, apiUrl: '${API_URL}', notificationsWsUrl: '${NOTIFICATIONS_WS_URL}', auth0: { domain: '${AUTH0_DOMAIN}', clientId: '${AUTH0_CLIENT_ID}', audience: '${AUTH0_AUDIENCE}', redirectUri: '${AUTH0_REDIRECT_URI}' } };" \
    > src/environments/environment.production.ts && \
    echo "export const environment = { production: false, apiUrl: '${API_URL}', notificationsWsUrl: '${NOTIFICATIONS_WS_URL}', auth0: { domain: '${AUTH0_DOMAIN}', clientId: '${AUTH0_CLIENT_ID}', audience: '${AUTH0_AUDIENCE}', redirectUri: '${AUTH0_REDIRECT_URI}' } };" \
    > src/environments/environment.ts
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/pixpro-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80