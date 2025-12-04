#!/bin/sh

# Log the action for debugging.
echo "Creating config.json with API key..."

# Create a config.json file from the environment variable
# The VITE_GEMINI_API_KEY is provided by the Cloud Run service environment.
echo "{\"VITE_GEMINI_API_KEY\":\"$VITE_GEMINI_API_KEY\"}" > /usr/share/nginx/html/config.json

echo "config.json created. Starting Nginx..."

# Start Nginx in the foreground
nginx -g 'daemon off;'
