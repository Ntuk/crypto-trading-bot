import React from 'react';
import { View, Text, Platform, ScrollView } from 'react-native';

const SettingsScreen = () => {
  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: Platform.OS === 'web' ? '#ffffff' : '#0f172a'
      }}
      contentContainerStyle={{
        padding: 16
      }}
    >
      <View style={{
        backgroundColor: Platform.OS === 'web' ? '#f8fafc' : '#1e293b',
        padding: 16,
        borderRadius: 8,
      }}>
        <Text style={{
          color: Platform.OS === 'web' ? '#0f172a' : '#ffffff',
          fontSize: 18,
          fontWeight: 'bold'
        }}>
          Settings
        </Text>
        {/* Add your settings content here */}
      </View>
    </ScrollView>
  );
};

export default SettingsScreen; 
