# Stage 1: Build the React application
     FROM node:20-alpine AS build
     WORKDIR /app
     COPY package*.json ./
     RUN npm install
     COPY . .
     # If public/models directory is not essential or does not exist, remove this line:
     # COPY public/models /app/public/models
     # The API key will be loaded at runtime, not build time.
    RUN npm run build
    
    # Stage 2: Serve the static files with Nginx
    FROM nginx:stable-alpine
    # Copy the built app
    COPY --from=build /app/dist /usr/share/nginx/html
    # Copy the full Nginx config
    COPY nginx.conf /etc/nginx/nginx.conf
    
    # Copy the startup script to be run by the Nginx entrypoint
    COPY start.sh /docker-entrypoint.d/
    
    # IMPORTANT: Fix line endings to ensure script is runnable in Linux
    RUN sed -i 's/\r$//' /docker-entrypoint.d/start.sh
    
    # Ensure the script is executable
    RUN chmod +x /docker-entrypoint.d/start.sh
    
    EXPOSE 8080
    # The Nginx entrypoint will run our script and then execute the default CMD
    CMD ["nginx", "-g", "daemon off;"]