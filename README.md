# TasteTube API

1. Environment variables:
MONGODB_CLUSTER_URI: connection string to mongodb cluster
IP, PORT: server host
ACCESS_TOKEN_SECRET: secret key for generating access token
REFRESH_TOKEN_SECRET: secret key for generating refresh token
GMAIL_ADDRESS: used to send email
APP_PASSWORD: app password of above gmail
STORAGE_BUCKET: firebase cloud storage uri

2. Firebase, Google Cloud:
- Get new service account key from Firebase console
rename to service-account-key.json and put at root directory
- Edit STORAGE_BUCKET

3. Hosting
- Edit scripts.ngrok under package.json
- Local server exposed using ngrok: npm run ngrok

