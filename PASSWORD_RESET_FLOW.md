
# Password Reset Flow Documentation

## Overview

The password reset flow has been configured to work reliably in both testing and production environments by using a web-based redirect URL that bridges email clients and the mobile app.

## How It Works

### 1. User Requests Password Reset

- User navigates to the "Forgot Password?" screen from the login page
- Enters their email address
- App calls `supabase.auth.resetPasswordForEmail()` with a redirect URL

### 2. Email Sent

- Supabase sends a password reset email to the user
- The email contains a link to: `https://natively.dev/password-reset`
- This link includes authentication tokens in the URL (access_token, refresh_token, type=recovery)

### 3. User Clicks Email Link

- Link opens in the user's default browser
- The Natively-hosted page at `https://natively.dev/password-reset` receives the tokens
- This page automatically redirects to the app using the deep link scheme: `natively://`

### 4. App Handles Deep Link

- The app's `_layout.tsx` listens for deep links
- When a recovery link is detected (type=recovery), it:
  - Extracts the access_token and refresh_token from the URL
  - Calls `supabase.auth.setSession()` to establish the user's session
  - Navigates to the reset-password screen

### 5. User Sets New Password

- User enters and confirms their new password
- App calls `supabase.auth.updateUser({ password: newPassword })`
- On success, user is redirected to the login screen

## Key Configuration

### Redirect URL

```typescript
redirectTo: 'https://natively.dev/password-reset'
```

This URL must be:
- Accessible from email clients (web-based)
- Configured in Supabase's allowed redirect URLs
- Set up to redirect back to the app via deep linking

### Deep Link Scheme

```json
"scheme": "natively"
```

This allows the app to be opened via `natively://` URLs.

### Associated Domains (iOS)

```json
"associatedDomains": [
  "applinks:natively.dev"
]
```

This enables universal links on iOS for seamless app opening.

### Intent Filters (Android)

```json
"intentFilters": [
  {
    "action": "VIEW",
    "autoVerify": true,
    "data": [
      {
        "scheme": "https",
        "host": "natively.dev",
        "pathPrefix": "/password-reset"
      }
    ],
    "category": ["BROWSABLE", "DEFAULT"]
  }
]
```

This enables app links on Android for seamless app opening.

## Why This Approach?

### Problem with Direct Deep Links

Using `natively://reset-password` directly in the email doesn't work well because:
- Email clients may not recognize custom URL schemes
- Security warnings may appear
- Links may not be clickable in some email clients
- Testing in web-based email clients is difficult

### Solution: Web Bridge

Using `https://natively.dev/password-reset` solves these issues:
- Works in all email clients (it's just a regular HTTPS link)
- No security warnings
- Always clickable
- Easy to test in any environment
- The web page handles the redirect to the app

## Email Confirmation vs Password Reset

### Email Confirmation

- Uses: `https://natively.dev/email-confirmed`
- This is a generic confirmation page hosted by Natively
- Shows a success message and may provide a link to open the app
- User can then manually open the app to log in

### Password Reset

- Uses: `https://natively.dev/password-reset`
- This is a specialized page that automatically redirects to the app
- Passes authentication tokens to the app via deep linking
- User is automatically taken to the password reset screen in the app

## Testing

### In Development

1. Request a password reset from the app
2. Check your email for the reset link
3. Click the link (it will open in your browser)
4. The browser should automatically redirect to the app
5. You should land on the reset password screen
6. Enter your new password and submit

### Troubleshooting

If the deep link doesn't work:

1. **Check Supabase Configuration**
   - Ensure `https://natively.dev/password-reset` is in the allowed redirect URLs
   - Check that email templates are using the correct redirect URL

2. **Check App Configuration**
   - Verify the scheme is set to "natively" in app.json
   - Ensure associated domains and intent filters are configured

3. **Check Deep Link Handling**
   - Look for console logs in `_layout.tsx` showing "Deep link received"
   - Verify the access_token is being extracted correctly

4. **Manual Testing**
   - Try opening `natively://reset-password?access_token=test&type=recovery` manually
   - This should trigger the deep link handler

## Security Considerations

- Tokens are passed via URL parameters (standard OAuth flow)
- Tokens are short-lived and single-use
- Session is established securely via Supabase's `setSession()` method
- Password update requires an active session
- Old passwords are invalidated immediately upon successful reset

## Future Improvements

- Add rate limiting to prevent abuse
- Implement password strength requirements
- Add password history to prevent reuse
- Consider adding 2FA for additional security
