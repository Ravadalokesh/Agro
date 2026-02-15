# Password & Username Recovery Guide

## Overview
This guide explains how users can recover their password or username if they forget them.

## Features Implemented

### 1. Forgot Password
Users who forget their password can reset it through the following process:

1. **Request Reset**
   - Click "Forgot Password?" link on the login page
   - Enter your registered email address
   - Click "Send Reset Link"

2. **Reset Link**
   - A password reset link will be generated
   - In production, this link would be sent to your email
   - For development, the link is displayed directly on screen
   - The reset token is valid for 1 hour

3. **Set New Password**
   - Click the reset link to open the reset password page
   - Enter your new password (must be at least 6 characters with letters and numbers)
   - Confirm your new password
   - Click "Reset Password"

4. **Password Requirements**
   - Minimum 6 characters
   - Must contain at least one letter
   - Must contain at least one number
   - Password strength indicator shows weak/medium/strong

### 2. Forgot Username
Users who forget their username can recover it:

1. **Request Username**
   - Click "Forgot Username?" link on the login page
   - Enter your registered email address
   - Click "Recover Username"

2. **View Username**
   - Your username will be displayed on screen
   - In production, this would be sent to your email
   - Click "Copy & Close" to automatically copy the username to the login form

## API Endpoints

### POST /api/forgot-password
Request a password reset token.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset link generated",
  "resetUrl": "http://localhost:3000/reset-password.html?token=..."
}
```

### POST /api/reset-password
Reset password using a valid token.

**Request Body:**
```json
{
  "token": "reset_token_here",
  "newPassword": "newSecurePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

### POST /api/forgot-username
Recover username using email address.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "username": "johndoe",
  "email": "user@example.com"
}
```

## Database Schema Changes

Added to User schema:
- `resetPasswordToken`: String - Stores the password reset token
- `resetPasswordExpires`: Date - Token expiration timestamp (1 hour from generation)

## Security Features

1. **Token Expiration**: Reset tokens expire after 1 hour
2. **Token Hashing**: Tokens are randomly generated using crypto.randomBytes(32)
3. **Password Validation**: New passwords must meet minimum requirements
4. **One-time Use**: Reset tokens are cleared after successful password reset

## User Experience Features

1. **Real-time Password Strength**: Visual feedback on password strength
2. **Password Match Indicator**: Shows if confirm password matches
3. **Requirement Checklist**: Visual indicators for password requirements
4. **Auto-fill Username**: Recovered username is automatically filled in login form
5. **Responsive Design**: Works on all device sizes
6. **Error Handling**: Clear error messages for various scenarios

## Production Deployment Notes

For production deployment, you should:

1. **Email Integration**: 
   - Integrate with an email service (SendGrid, AWS SES, etc.)
   - Send reset links via email instead of displaying them
   - Send usernames via email for forgot username feature

2. **HTTPS**:
   - Use HTTPS for all password reset operations
   - Update cookie settings to `secure: true`

3. **Rate Limiting**:
   - Implement rate limiting on forgot password/username endpoints
   - Prevent abuse and brute force attempts

4. **Logging**:
   - Log all password reset requests
   - Monitor for suspicious activity

5. **Token Storage**:
   - Consider using shorter token expiration times
   - Implement token cleanup for expired tokens
