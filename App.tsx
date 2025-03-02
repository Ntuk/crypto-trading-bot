import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Navigation } from './src/navigation';
import { AuthService } from './src/services/auth';
import { StorageService } from './src/services/storage';
import { LogBox } from 'react-native';

// Ignore specific warnings
LogBox.ignoreLogs([
  'Require cycle:',
  'Non-serializable values were found in the navigation state',
]);

export default function App() {
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize auth service
      AuthService.initialize();
      
      // Set default settings if not already set
      const settings = await StorageService.getUserSettings();
      if (!settings) {
        await StorageService.saveUserSettings(StorageService.getDefaultSettings());
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Navigation />
    </SafeAreaProvider>
  );
} 