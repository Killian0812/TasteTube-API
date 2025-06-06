# TasteTube API

## 1. Environment Variables

The application requires the following environment variables to be set in a `.env` file:

- **MONGODB_URI**: Connection string to the MongoDB cluster.
- **IP**: Server host (e.g., `localhost`).
- **PORT**: Server port (e.g., `8080`).
- **ACCESS_TOKEN_SECRET**: Secret key for generating access tokens.
- **REFRESH_TOKEN_SECRET**: Secret key for generating refresh tokens.
- **GMAIL_ADDRESS**: Gmail address used to send emails.
- **APP_PASSWORD**: App password for the Gmail account.
- **STORAGE_BUCKET**: Firebase Cloud Storage URI.
- **VNPAY_TERMINAL_ID**: Terminal ID from VNPay configuration.
- **VNPAY_SECRET**: Secret key from VNPay configuration.
- **GOOGLE_MAPS_API_KEY**: API key for Google Maps.
- **SERVICE_ACCOUNT_KEY**: (Optional) Base64 value of `service-account-key.json`.
- **GRAB_CLIENT_ID**: Client ID for Grab API integration.
- **GRAB_CLIENT_SECRET**: Client secret for Grab API integration.

## 2. Firebase and Google Cloud Setup

1. Obtain a new service account key from the Firebase console.
   - Rename the file to `service-account-key.json` and place it in the root directory of the project.
2. Update the `STORAGE_BUCKET` environment variable with your Firebase Cloud Storage bucket URI.
3. Configure CORS for the Firebase bucket:
   ```bash
   gsutil cors set cors.json gs://<your-bucket-name>
   ```
