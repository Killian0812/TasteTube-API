# TasteTube API

1. Environment variables:
   MONGODB_URI: connection string to mongodb cluster
   IP, PORT: server host
   ACCESS_TOKEN_SECRET: secret key for generating access token
   REFRESH_TOKEN_SECRET: secret key for generating refresh token
   GMAIL_ADDRESS: used to send email
   APP_PASSWORD: app password of above gmail
   STORAGE_BUCKET: firebase cloud storage uri
   VNPAY_SECRET, VNPAY_TERMINALID: from vnpay configuration
   GOOGLE_MAPS_APIKEY: apikey for google maps
   SERVICE_ACCOUNT_KEY: secret key for firebase initialization

2. Firebase, Google Cloud:

- Get new service account key from Firebase console
  rename to service-account-key.json and put at root directory
- Edit STORAGE_BUCKET
- gsutil cors set cors.json gs://taste-tube.appspot.com (takes time after running)

3. Hosting

- Edit scripts.ngrok under package.json
- Local server exposed using ngrok: npm run ngrok
