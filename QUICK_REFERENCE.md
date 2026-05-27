# Quick Reference: Using useAuth Hook

## Copy-Paste Examples for Your Screens

### 1️⃣ Display User Info
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function MyScreen() {
  const { user } = useAuth();
  
  return (
    <View>
      <Text>Name: {user?.fullName}</Text>
      <Text>Church: {user?.churchName}</Text>
      <Text>Email: {user?.email}</Text>
      <Text>ID: {user?.id}</Text>
    </View>
  );
}
```

### 2️⃣ Fetch User-Specific Data
```javascript
import { useState, useEffect } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import { API_BASE_URL } from '../apiService';

export default function SermonScreen() {
  const { user, token } = useAuth();
  const [sermons, setSermons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchSermons();
    }
  }, [user?.id]);

  const fetchSermons = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/sermons?userId=${user.id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const data = await response.json();
      setSermons(data);
    } catch (error) {
      console.error('Failed to fetch sermons:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      {loading && <ActivityIndicator />}
      {sermons.map(sermon => (
        <Text key={sermon.id}>{sermon.title}</Text>
      ))}
    </View>
  );
}
```

### 3️⃣ Use User Preferences
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function BibleScreen() {
  const { user } = useAuth();
  
  // Use user's preferred Bible translation
  const translation = user?.bibleTranslation || 'KJV';
  
  return <Text>Reading {translation} Bible</Text>;
}
```

### 4️⃣ Show Loading State
```javascript
import { ActivityIndicator } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function HomeScreen() {
  const { isLoading } = useAuth();
  
  if (isLoading) {
    return <ActivityIndicator size="large" />;
  }
  
  return <Text>Welcome!</Text>;
}
```

### 5️⃣ Handle Errors
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  
  const handleLogin = async () => {
    try {
      await login(phoneNumber, password);
    } catch (err) {
      console.error(err);
    }
  };
  
  return (
    <View>
      {error && (
        <Text style={{color: 'red'}}>{error}</Text>
      )}
      <TouchableOpacity onPress={handleLogin} disabled={isLoading}>
        <Text>{isLoading ? 'Logging in...' : 'Login'}</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 6️⃣ Complete User Profile Component
```javascript
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../src/contexts/AuthContext';

export default function UserProfile() {
  const { user, token, logout } = useAuth();
  
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <View>
      <Text style={{fontSize: 18, fontWeight: 'bold'}}>
        {user?.fullName}
      </Text>
      <Text>{user?.churchName}</Text>
      <Text>{user?.email}</Text>
      <Text>Phone: {user?.phoneNumber}</Text>
      <Text>Role: {user?.role}</Text>
      <Text>Denomination: {user?.denomination}</Text>
      <Text>Bible: {user?.bibleTranslation}</Text>
      
      <TouchableOpacity 
        onPress={handleLogout}
        style={{
          marginTop: 20,
          backgroundColor: '#FF3B30',
          padding: 10,
          borderRadius: 5,
        }}
      >
        <Text style={{color: 'white'}}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 7️⃣ Access Token for API Calls
```javascript
import { useAuth } from '../src/contexts/AuthContext';
import { API_BASE_URL } from '../apiService';

export default function DataFetcher() {
  const { user, token } = useAuth();
  
  const apiCall = async (endpoint) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-User-Id': user?.id,
      },
    });
    return response.json();
  };
  
  return <View />;
}
```

### 8️⃣ Conditional Rendering Based on User Role
```javascript
import { useAuth } from '../src/contexts/AuthContext';

export default function AdminFeature() {
  const { user } = useAuth();
  
  if (user?.role !== 'Admin') {
    return <Text>You don't have access to this feature</Text>;
  }
  
  return <Text>Admin Panel</Text>;
}
```

### 9️⃣ Create API Service with Auth
```javascript
// services/api.js
import { API_BASE_URL } from '../apiService';

export const createAuthenticatedRequest = (token) => {
  return async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return response.json();
  };
};

// Usage in component:
import { useAuth } from '../src/contexts/AuthContext';
import { createAuthenticatedRequest } from '../services/api';

export default function MyScreen() {
  const { token } = useAuth();
  const request = createAuthenticatedRequest(token);
  
  const fetchData = async () => {
    try {
      const data = await request('/endpoint');
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };
}
```

### 🔟 Persistent State After Refresh
```javascript
import { useEffect, useState } from 'react';
import { useAuth } from '../src/contexts/AuthContext';

export default function PersistentComponent() {
  const { user, isLoading } = useAuth();
  
  // If isLoading is true, session is being restored from AsyncStorage
  // If isLoading is false and user exists, session was restored
  // If isLoading is false and user is null, user is not logged in
  
  useEffect(() => {
    if (!isLoading && user?.id) {
      console.log('Session restored:', user.fullName);
    }
  }, [isLoading, user?.id]);
  
  return <Text>Welcome {user?.fullName}!</Text>;
}
```

## useAuth Hook Return Values

```javascript
const {
  // State
  user,          // { id, fullName, email, phoneNumber, churchName, denomination, role, bibleTranslation }
  token,         // JWT token string
  isLoading,     // boolean - true while authenticating or restoring session
  error,         // string - error message if auth failed
  
  // Methods
  login,         // async (phoneNumber, password) => user
  signup,        // async (userData) => response
  logout,        // async () => void
} = useAuth();
```

## Common Patterns

### Pattern 1: Fetch on User Change
```javascript
useEffect(() => {
  if (user?.id) {
    const fetchData = async () => {
      // fetch using user.id
    };
    fetchData();
  }
}, [user?.id]);
```

### Pattern 2: Show Loading for Dependent Data
```javascript
const [dataLoading, setDataLoading] = useState(false);
const { user } = useAuth();

useEffect(() => {
  if (user?.id) {
    setDataLoading(true);
    fetchData().finally(() => setDataLoading(false));
  }
}, [user?.id]);

if (!user?.id || dataLoading) return <ActivityIndicator />;
```

### Pattern 3: Combine Multiple User Data
```javascript
const { user } = useAuth();
const [sermons, setSermons] = useState([]);
const [prayers, setPrayers] = useState([]);

useEffect(() => {
  if (user?.id) {
    Promise.all([
      fetchSermons(user.id),
      fetchPrayers(user.id),
    ]).then(([s, p]) => {
      setSermons(s);
      setPrayers(p);
    });
  }
}, [user?.id]);
```

---

**Need more help?** Check `AUTH_SETUP_GUIDE.md` for detailed documentation.
