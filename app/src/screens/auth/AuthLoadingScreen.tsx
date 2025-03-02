import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/auth';

export const AuthLoadingScreen = () => {
  const navigation = useNavigation();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuthenticated = await AuthService.isAuthenticated();
      navigation.replace(isAuthenticated ? 'MainTabs' : 'Login');
    } catch (error) {
      navigation.replace('Login');
    }
  };

  return (
    <View className="flex-1 bg-background justify-center items-center">
      <ActivityIndicator size="large" color="#2563eb" />
    </View>
  );
}; 