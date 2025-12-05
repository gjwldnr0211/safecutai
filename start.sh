 `safecutai/start.sh`:

    1 #!/bin/sh
    2 
    3 # Log the action for debugging.
    4 echo "Creating config.json with API key..."
    5 
    6 # Create a config.json file from the environment variable
    7 # The VITE_GEMINI_API_KEY is provided by the Cloud Run service environment.
    8 echo "{\"VITE_GEMINI_API_KEY\":\"$VITE_GEMINI_API_KEY\"}" > /usr/share/nginx/html/config.json
    9 
   10 echo "config.json created. Starting Nginx..."
   11 
   12 # Start Nginx in the foreground
   13 nginx -g 'daemon off;'
