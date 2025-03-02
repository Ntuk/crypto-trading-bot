import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { View, Text } from 'react-native';

// Import screens
// For now, let's create placeholder components for screens that might be missing
const DashboardScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Dashboard Screen</Text>
  </View>
);

const TradeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Trade Screen</Text>
  </View>
);

const SettingsScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Settings Screen</Text>
  </View>
);

const LoginScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Login Screen</Text>
  </View>
);

const AuthLoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>Loading...</Text>
  </View>
);

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tab navigator
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4ecdc4',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#1e1e1e',
          borderTopColor: '#333',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="dashboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Trade"
        component={TradeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="swap-horiz" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigator
export const Navigation = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Simulate checking authentication status
    const checkAuth = async () => {
      // In a real app, you would check if the user is logged in
      // For now, let's just simulate a loading state
      setTimeout(() => {
        setIsLoading(false);
        // For testing, set to true to go directly to the main app
        setIsAuthenticated(true);
      }, 1000);
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <AuthLoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={MainTabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}; 