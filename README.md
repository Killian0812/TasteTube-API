# TasteTube API

## 1. Environment Variables

The application requires the following environment variables to be set in a `.env` file:

- **IP**: Server host (e.g., `localhost`).
- **PORT**: Server port (e.g., `8080`).
- **ACCESS_TOKEN_SECRET**: Secret key for generating access tokens.
- **REFRESH_TOKEN_SECRET**: Secret key for generating refresh tokens.
- **MONGODB_URI**: Connection string to the MongoDB cluster.
- **GMAIL_ADDRESS**: Gmail address used to send emails.
- **APP_PASSWORD**: App password for the Gmail account.
- **STORAGE_BUCKET**: Firebase Cloud Storage URI.
- **RTDB_URL**: Firebase Realtime Database URL.
- **GOOGLE_APPLICATION_CREDENTIALS**: Path to the Google service account key JSON file.
- **SERVICE_ACCOUNT_KEY**: (Optional) Base64 value of `service-account-key.json`.
- **GC_PROJECT_ID**: Google Cloud project ID.
- **LOCATION**: Google Cloud location (e.g., `asia-southeast1`).
- **VNPAY_TERMINALID**: Terminal ID from VNPay configuration.
- **VNPAY_SECRET**: Secret key from VNPay configuration.
- **GOOGLE_MAPS_API_KEY**: API key for Google Maps.
- **GRAB_CLIENT_ID**: Client ID for Grab API integration.
- **GRAB_CLIENT_SECRET**: Client secret for Grab API integration.
- **STREAM_API_KEY**: Stream API key.
- **STREAM_API_SECRET**: Stream API secret.
- **STREAM_BOT_ID**: Stream bot user ID.
- **OPENAI_API_KEY**: API key for OpenAI integration.
- **TWILIO_ACCOUNT_SID**: Twilio Account SID.
- **TWILIO_AUTH_TOKEN**: Twilio Auth Token.
- **TWILIO_SERVICE_SID**: Twilio Service SID.
- **REDIS_PASSWORD**: Redis password.
- **REDIS_HOST**: Redis host.
- **REDIS_PORT**: Redis port.
<!-- Can be replaced by ffmpeg -->
- **MUX_TOKEN_ID**: Mux token ID.
- **MUX_TOKEN_SECRET**: Mux token secret.

## 2. Firebase and Google Cloud Setup

1. Obtain a new service account key from the Firebase console.
   - Rename the file to `service-account-key.json` and place it in the root directory of the project.
2. Update the `STORAGE_BUCKET` environment variable with your Firebase Cloud Storage bucket URI.
3. Update the `RTDB_URL` with your Firebase Realtime Database URL.
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to the path of your service account key file.
5. Configure CORS for the Firebase bucket:
   ```bash
   gsutil cors set cors.json gs://<your-bucket-name>
   ```
