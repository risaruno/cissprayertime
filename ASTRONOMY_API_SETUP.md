# Astronomy API Setup Guide

## Overview
The CelestialBody component now uses the [Astronomy API](https://astronomyapi.com/) to display realistic moon phase images based on the observer's location and current date.

## Configuration

### 1. Get API Credentials
1. Visit [https://astronomyapi.com/](https://astronomyapi.com/)
2. Sign up for an account
3. Navigate to your dashboard to get your credentials:
   - Application ID
   - Application Secret

### 2. Configure Environment Variables
Add the following to your `.env` file:

```env
VITE_ASTR_APP_ID=your_astronomy_api_application_id
VITE_ASTR_API_KEY=your_astronomy_api_application_secret
```

**Note:** Never commit your `.env` file to version control. It's already included in `.gitignore`.

## How It Works

### Component Architecture
- **MoonPhaseFetcher.tsx**: Handles API communication with Astronomy API
  - Exports `useMoonPhase` hook for easy integration
  - Uses Basic Authentication
  - Fetches moon phase images based on observer's coordinates and date

- **CelestialBody.tsx**: Displays the celestial bodies (sun/moon)
  - Uses the `useMoonPhase` hook when coordinates are available
  - Displays API-generated moon phase image when available
  - Falls back to gradient-based moon rendering if API is unavailable

### API Endpoint
- **Endpoint**: `POST https://api.astronomyapi.com/api/v2/studio/moon-phase`
- **Documentation**: [Moon Phase Endpoint Docs](https://docs.astronomyapi.com/endpoints/studio/moon-phase)

### Features
- ✅ Real-time moon phase visualization
- ✅ Location-based accuracy using latitude/longitude
- ✅ Transparent background for seamless integration
- ✅ Graceful fallback to gradient-based rendering
- ✅ Automatic daily updates

## Fallback Behavior
If the Astronomy API is unavailable or credentials are not configured:
- The component automatically falls back to the gradient-based moon rendering
- No errors are shown to the user
- Console warnings are logged for developers

## Testing
To test the integration:
1. Set up your `.env` file with valid credentials
2. Run the development server: `npm run dev`
3. Open the application in your browser
4. Check the browser console for any API-related messages
5. The moon should display with realistic phase imagery

## Troubleshooting

### Moon shows gradient instead of realistic image
- Check that your `.env` file contains valid credentials
- Verify that the API credentials are correct in your Astronomy API dashboard
- Check the browser console for error messages
- Ensure your API quota hasn't been exceeded

### API Authentication Errors
- Verify the credentials are correctly formatted
- Ensure there are no extra spaces in the `.env` file
- Check that the application ID and secret match your dashboard

### CORS or Network Errors
- The Astronomy API should allow browser requests
- If you're behind a firewall, ensure the API domain is whitelisted
- Check your network console for blocked requests

## API Limits
- Free tier: Check [Astronomy API pricing](https://astronomyapi.com/pricing) for current limits
- Consider caching strategies if you exceed rate limits
- Moon phase images are fetched once per day per location

## Cost Optimization
To minimize API calls:
- Images are only fetched when coordinates are available
- Failed requests are logged but don't retry automatically
- Consider implementing a caching layer for production use
