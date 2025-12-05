`safecutai/Dockerfile`:

    1 # Stage 1: Build the React application
    2 FROM node:20-alpine AS build
    3 WORKDIR /app
    4 COPY package*.json ./
    5 RUN npm install
    6 COPY . .
    7 # The API key will be loaded at runtime, not build time.
    8 RUN npm run build
    9 
   10 # Stage 2: Serve the static files with Nginx
   11 FROM nginx:stable-alpine
   12 # Copy the built app
   13 COPY --from=build /app/dist /usr/share/nginx/html
   14 # Copy the full Nginx config
   15 COPY nginx.conf /etc/nginx/nginx.conf
   16 # Copy the startup script
   17 COPY start.sh /start.sh
   18 # Ensure the script is executable
   19 RUN chmod +x /start.sh
   20 
   21 EXPOSE 8080
   22 # Run the startup script which will prepare the config and start nginx
   23 CMD ["/start.sh"]
