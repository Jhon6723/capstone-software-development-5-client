FROM node:22-alpine AS build
WORKDIR /app
COPY pixpro-frontend/package*.json ./
RUN npm ci
COPY pixpro-frontend/ .
RUN mkdir -p src/environments && \
    echo "export const environment = { production: true, apiUrl: '/api' };" \
    > src/environments/environment.production.ts && \
    echo "export const environment = { production: false, apiUrl: '/api' };" \
    > src/environments/environment.ts
RUN npm run build -- --configuration production

FROM nginx:alpine AS runtime
COPY --from=build /app/dist/pixpro-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80