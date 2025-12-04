# Stage 1: Build the React application
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# The API key will be loaded at runtime, not build time.
RUN npm run build

# Stage 2: Serve the static files with Nginx
FROM nginx:stable-alpine
# Copy the built app
COPY --from=build /app/dist /usr/share/nginx/html
# Copy the full Nginx config
COPY nginx.conf /etc/nginx/nginx.conf
# Copy the startup script
COPY start.sh /start.sh
# Ensure the script is executable
RUN chmod +x /start.sh

EXPOSE 8080
# Run the startup script which will prepare the config and start nginx
CMD ["/start.sh"]