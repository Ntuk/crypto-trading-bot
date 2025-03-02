import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../services/auth';
import { StorageService } from '../services/storage';
import { TradingService } from '../services/trading';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [biometricAuth, setBiometricAuth] = useState<boolean>(false);

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out? The trading bot will be stopped.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              // Stop trading bot
              TradingService.stopTradingBot();
              
              // Logout from Coinbase
              await AuthService.logout();
              
              // Navigate to login screen
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const clearTradeHistory = () => {
    Alert.alert(
      'Clear Trade History',
      'Are you sure you want to clear your trade history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearTradeHistory();
              Alert.alert('Success', 'Trade history has been cleared.');
            } catch (error) {
              console.error('Error clearing trade history:', error);
              Alert.alert('Error', 'Failed to clear trade history. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-background">
      {loading && (
        <View className="absolute z-10 w-full h-full items-center justify-center bg-black bg-opacity-50">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      )}

      {/* Account Section */}
      <View className="p-4">
        <Text className="text-white text-xl font-semibold mb-2">Account</Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            className="p-4 border-b border-gray-700 flex-row justify-between items-center"
            onPress={() => navigation.navigate('AccountDetails')}
          >
            <Text className="text-white text-base">Account Details</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-4 border-b border-gray-700 flex-row justify-between items-center"
            onPress={() => navigation.navigate('ApiSettings')}
          >
            <Text className="text-white text-base">API Settings</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-4 flex-row justify-between items-center"
            onPress={handleLogout}
          >
            <Text className="text-red-500 text-base">Logout</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* App Preferences */}
      <View className="p-4">
        <Text className="text-white text-xl font-semibold mb-2">
          App Preferences
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <View className="p-4 border-b border-gray-700 flex-row justify-between items-center">
            <Text className="text-white text-base">Dark Mode</Text>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#64748b', true: '#2563eb' }}
              thumbColor={darkMode ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View className="p-4 border-b border-gray-700 flex-row justify-between items-center">
            <Text className="text-white text-base">Notifications</Text>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#64748b', true: '#2563eb' }}
              thumbColor={notifications ? '#ffffff' : '#f4f3f4'}
            />
          </View>
          
          <View className="p-4 flex-row justify-between items-center">
            <Text className="text-white text-base">Biometric Authentication</Text>
            <Switch
              value={biometricAuth}
              onValueChange={setBiometricAuth}
              trackColor={{ false: '#64748b', true: '#2563eb' }}
              thumbColor={biometricAuth ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>
      </View>

      {/* Data Management */}
      <View className="p-4">
        <Text className="text-white text-xl font-semibold mb-2">
          Data Management
        </Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            className="p-4 border-b border-gray-700 flex-row justify-between items-center"
            onPress={clearTradeHistory}
          >
            <Text className="text-white text-base">Clear Trade History</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-4 flex-row justify-between items-center"
            onPress={() => Alert.alert('Cache Cleared', 'Application cache has been cleared.')}
          >
            <Text className="text-white text-base">Clear Cache</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View className="p-4">
        <Text className="text-white text-xl font-semibold mb-2">About</Text>
        <View className="bg-surface rounded-xl overflow-hidden">
          <TouchableOpacity
            className="p-4 border-b border-gray-700 flex-row justify-between items-center"
            onPress={() => {}}
          >
            <Text className="text-white text-base">Privacy Policy</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="p-4 border-b border-gray-700 flex-row justify-between items-center"
            onPress={() => {}}
          >
            <Text className="text-white text-base">Terms of Service</Text>
            <Text className="text-gray-400">→</Text>
          </TouchableOpacity>
          
          <View className="p-4 items-center">
            <Text className="text-gray-400">CryptoBot v1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}; 