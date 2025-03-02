import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/auth';

export const LoginScreen = () => {
  const navigation = useNavigation();

  const handleLogin = async () => {
    try {
      const success = await AuthService.login();
      if (success) {
        navigation.replace('MainTabs');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <View className="flex-1 bg-background p-6 justify-center">
      <View className="items-center mb-12">
        <Image
          source={require('../../assets/logo.png')}
          className="w-24 h-24 mb-4"
        />
        <Text className="text-white text-3xl font-bold">CryptoBot</Text>
        <Text className="text-gray-400 text-lg mt-2">
          AI-Powered Crypto Trading
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleLogin}
        className="bg-primary p-4 rounded-lg items-center"
      >
        <Text className="text-white text-lg font-semibold">
          Connect with Coinbase
        </Text>
      </TouchableOpacity>
    </View>
  );
}; 