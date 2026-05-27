# Authentication Architecture Guide

## Overview
Your frontend now uses **React Context API** for centralized authentication management instead of prop drilling. This eliminates the need to pass user IDs and tokens through navigation parameters.

## Architecture Components

### 1. **AuthContext.js** (`src/contexts/AuthContext.js`)
Central authentication context that manages:
- **State**: `user`, `token`, `isLoading`, `error`
- **Methods**:
  - `login(phoneNumber, password)` - Authenticates user with backend
  - `signup(userData)` - Creates new user account
  - `logout()` - Clears user session
  - `bootstrapAsync()` - Restores session on app startup from AsyncStorage

### 2. **useAuth Hook**
Custom hook to access auth state and methods from any component:
```javascript
const { user, token, isLoading, error, login, signup, logout } = useAuth();
```

### 3. **AuthProvider**
Context provider wrapping the entire app in `App.js` to make auth available globally.

## How to Use in Your Screens

### Access User Data
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function MyScreen() {
  const { user } = useAuth();
  
  return (
    <Text>{user?.fullName}</Text>
    <Text>{user?.churchName}</Text>
    <Text>{user?.email}</Text>
  );
}
```

### User Object Structure
```javascript
{
  id: string,                  // Unique user ID from backend
  fullName: string,           // User's full name
  email: string,              // User's email
  phoneNumber: string,        // User's phone number
  churchName: string,         // Church/organization name
  denomination: string,       // Religious denomination
  role: string,              // User role (e.g., "Pastor")
  bibleTranslation: string   // Preferred Bible translation
}
```

### Login Flow
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function Login() {
  const { login, isLoading, error } = useAuth();
  
  const handleLogin = async () => {
    try {
      const user = await login(phoneNumber, password);
      // Navigation happens automatically in App.js
    } catch (err) {
      console.error(err);
    }
  };
}
```

### Logout Flow
```javascript
const { logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
    // Navigation back to login happens automatically in App.js
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

## Updated Screens

### ✅ Login.js
- Integrated with `useAuth().login()`
- Shows loading state while authenticating
- Displays error messages from backend
- Automatically navigates to HomeScreen on success

### ✅ SignUp.js
- Integrated with `useAuth().signup()`
- Collects all required fields: fullName, email, phoneNumber, password, churchName, denomination, role, bibleTranslation
- Form validation before submission
- Shows loading state and error messages
- Scrollable form for easy navigation on mobile

### ✅ Home.js
- Displays user's fullName dynamically
- Generates profile initials from user's name
- No hardcoded names anymore

### ✅ HomeScreen.js
- Added header with logout button
- Shows user's name in header
- Logout confirmation dialog before clearing session
- Header persists across all tabs

## Data Flow

```
1. User enters credentials in Login.js
        ↓
2. useAuth().login() sends to backend (http://localhost:3000/auth/login)
        ↓
3. Backend validates and returns { token, user }
        ↓
4. AuthContext saves to state AND AsyncStorage
        ↓
5. App.js detects user state change
        ↓
6. Automatically renders HomeScreen
        ↓
7. Any screen can access user via useAuth()
```

## Session Persistence

- User token and data are saved to **AsyncStorage**
- On app restart, `bootstrapAsync()` automatically restores session
- User stays logged in across app restarts (until logout)

## API Endpoints

### Login
**POST** `/auth/login`
```javascript
Request: { phoneNumber, password }
Response: { token, user: {...} }
```

### Signup
**POST** `/auth/signup`
```javascript
Request: { fullName, email, phoneNumber, password, churchName, denomination, role, bibleTranslation }
Response: { message: "User account created successfully." }
```

## Using User Data in Other Screens

### Example: Sermon.js (show user's church sermons)
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function Sermon() {
  const { user } = useAuth();
  
  useEffect(() => {
    // Fetch sermons for this user
    fetchSermons(user.id);
  }, [user]);
  
  return (
    <Text>Sermons for {user.churchName}</Text>
    // Display sermons...
  );
}
```

### Example: Bible.js (use user's preferred translation)
```javascript
export default function Bible() {
  const { user } = useAuth();
  
  useEffect(() => {
    loadBibleTranslation(user.bibleTranslation);
  }, [user.bibleTranslation]);
  
  return (
    <Text>Reading {user.bibleTranslation} Bible</Text>
    // Display verses...
  );
}
```

## Error Handling

The context provides an `error` state:
```javascript
const { error } = useAuth();

return error ? <Text style={{color: 'red'}}>{error}</Text> : null;
```

## Loading State

Check `isLoading` during authentication:
```javascript
const { isLoading } = useAuth();

return isLoading ? <ActivityIndicator /> : <YourComponent />;
```

## Troubleshooting

### User is null after login
- Check that backend login endpoint is returning `user` object
- Verify API_BASE_URL in `apiService.js` is correct

### Session not persisting across restarts
- AsyncStorage might not be properly installed
- Run: `npm install @react-native-async-storage/async-storage`

### useAuth hook throws error
- Make sure component is wrapped within `<AuthProvider>` in App.js
- Component should be a child of AuthProvider (directly or indirectly)

## Next Steps

1. Update `Sermon.js`, `Bible.js`, `AiChat.js`, `Tools.js` to use `useAuth()` for fetching user-specific data
2. Add API calls to fetch sermons, prayers, saved verses using `user.id`
3. Remove any remaining hardcoded user data or prop drilling
