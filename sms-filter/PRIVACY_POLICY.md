# Privacy Policy for SMS Filter App (Junkman Clone)

**Effective Date:** July 24, 2026

## 1. Data Collection and Usage
Our app operates 100% locally on your device. We **DO NOT** collect, transmit, store, or share your SMS messages, contact lists, or personal information with any external servers.

## 2. Permissions Required
- **iOS (IdentityLookup):** The app uses Apple's native IdentityLookup framework. Message content is passed to the app's local extension for analysis and is immediately discarded.
- **Android (SMS / Call Screening):** The app requires `READ_SMS` and `RECEIVE_SMS` permissions to identify and suppress spam messages. This data never leaves your device.

## 3. Third-Party Services
The app uses on-device Machine Learning (CoreML/TFLite). No third-party analytics or tracking tools have access to your message content.

## 4. User Consent
By enabling the SMS filtering extension in your device settings, you consent to the local processing of messages from unknown senders as described above.
