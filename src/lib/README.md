# Lib - Helper Functions & Constants

This folder contains reusable helper functions and constants used throughout the NewsLens application.

## Files

### `styleHelpers.js`
Style-related helper functions for generating CSS classes based on user preferences.

**Exports:**
- `getContrastStyles(contrastMode)` - Returns contrast mode styling objects (high, dark, normal)
- `getTextSizeClasses(textSize)` - Returns text size classes for different element types (large, normal, small)
- `getBgStyles(contrastMode)` - Returns background and theme styling objects

### `audioHelpers.js`
Audio and text-to-speech functionality.

**Exports:**
- `speak(text)` - Converts text to speech using browser's SpeechSynthesis API

### `apiHelpers.js`
API communication functions.

**Exports:**
- `fetchAPIKey()` - Retrieves the API key from the `/api/get-api-key` endpoint
- `fetchAndSummarizeNews(searchQuery, apiKey, onStartMessage, onSpeakStart, onSuccess, onError, speak)` - Fetches and summarizes news from the `/api/summarize` endpoint

### `constants.js`
Constant values used across the application.

**Exports:**
- `ANIMATIONS_STYLES` - CSS animation definitions for page transitions and fade-in effects

## Usage Example

```javascript
import { getTextSizeClasses, getBgStyles } from "@/lib/styleHelpers";
import { speak } from "@/lib/audioHelpers";
import { fetchAPIKey } from "@/lib/apiHelpers";

// Get styles based on user preferences
const textSizeClasses = getTextSizeClasses("large");
const bgStyles = getBgStyles("normal");

// Use audio function
speak("Hello, this is a test");

// Fetch API key
const apiKey = await fetchAPIKey();
```

## Benefits

✅ **Code Reusability** - Functions can be imported and used in multiple components
✅ **Maintainability** - Centralized location for shared logic makes updates easier
✅ **Scalability** - Easy to add new helper functions as the app grows
✅ **Clean Components** - Keeps page.js focused on UI logic, not utility functions
✅ **Type Safety** - Clear function signatures and documentation
