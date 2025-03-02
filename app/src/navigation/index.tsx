import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { AuthLoadingScreen } from '../screens/auth/AuthLoadingScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { TradingScreen } from '../screens/TradingScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { NewsScreen } from '../screens/NewsScreen';
import { CryptoDetailScreen } from '../screens/CryptoDetailScreen';
import { TradeScreen } from '../screens/TradeScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: '#0f172a' },
      headerTintColor: '#fff',
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1e293b' },
      tabBarActiveTintColor: '#2563eb',
      tabBarInactiveTintColor: '#64748b',
    }}
  >
    <Tab.Screen 
      name="Dashboard" 
      component={DashboardScreen} 
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="home-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Trading" 
      component={TradingScreen} 
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="trending-up-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="News" 
      component={NewsScreen} 
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="newspaper-outline" size={size} color={color} />
        ),
      }}
    />
    <Tab.Screen 
      name="Settings" 
      component={SettingsScreen} 
      options={{
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="settings-outline" size={size} color={color} />
        ),
      }}
    />
  </Tab.Navigator>
);

export const Navigation = () => (
  <NavigationContainer>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CryptoDetail" component={CryptoDetailScreen} />
      <Stack.Screen name="Trade" component={TradeScreen} />
    </Stack.Navigator>
  </NavigationContainer>
); 