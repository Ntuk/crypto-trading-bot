import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { NotificationService } from '../services/notification';
import { useNavigation } from '@react-navigation/native';
import { Slider } from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';

export const SettingsScreen = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [hasApiKeys, setHasApiKeys] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load user settings
      const userSettings = await StorageService.getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
      } else {
        // Set default settings if none exist
        const defaultSettings = StorageService.getDefaultSettings();
        setSettings(defaultSettings);
        await StorageService.saveUserSettings(defaultSettings);
      }

      // Check if API keys exist
      const keys = await StorageService.getApiKeys();
      if (keys && keys.apiKey && keys.apiSecret) {
        setHasApiKeys(true);
        // Mask the actual keys for display
        setApiKey('*'.repeat(keys.apiKey.length));
        setApiSecret('*'.repeat(keys.apiSecret.length));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      await StorageService.saveUserSettings(settings);
      Alert.alert('Success', 'Settings saved successfully.');
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const saveApiKeys = async () => {
    try {
      if (!apiKey || !apiSecret) {
        Alert.alert('Error', 'Both API Key and API Secret are required.');
        return;
      }

      // Only save if they're not masked
      if (!apiKey.includes('*') && !apiSecret.includes('*')) {
        await StorageService.saveApiKeys(apiKey, apiSecret);
        setHasApiKeys(true);
        Alert.alert('Success', 'API keys saved successfully.');
      } else {
        Alert.alert('Info', 'No changes made to API keys.');
      }
    } catch (error) {
      console.error('Error saving API keys:', error);
      Alert.alert('Error', 'Failed to save API keys. Please try again.');
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to log out? This will not delete your saved settings or API keys.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              await AuthService.logout();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Login' }],
              });
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const resetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default values?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              const defaultSettings = StorageService.getDefaultSettings();
              setSettings(defaultSettings);
              await StorageService.saveUserSettings(defaultSettings);
              Alert.alert('Success', 'Settings have been reset to default values.');
            } catch (error) {
              console.error('Error resetting settings:', error);
              Alert.alert('Error', 'Failed to reset settings. Please try again.');
            }
          },
        },
      ]
    );
  };

  const testNotification = () => {
    NotificationService.sendLocalNotification(
      'Test Notification',
      'This is a test notification from your crypto trading bot.'
    );
    Alert.alert('Notification Sent', 'A test notification has been sent.');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* API Keys Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Coinbase API Keys</Text>
          <Text style={styles.sectionDescription}>
            Enter your Coinbase API keys to enable trading functionality.
          </Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>API Key</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter API Key"
              placeholderTextColor="#666"
              value={apiKey}
              onChangeText={(text) => {
                // If user starts typing, clear the masked value
                if (apiKey.includes('*') && text !== apiKey) {
                  setApiKey('');
                } else {
                  setApiKey(text);
                }
              }}
              secureTextEntry={true}
            />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>API Secret</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter API Secret"
              placeholderTextColor="#666"
              value={apiSecret}
              onChangeText={(text) => {
                // If user starts typing, clear the masked value
                if (apiSecret.includes('*') && text !== apiSecret) {
                  setApiSecret('');
                } else {
                  setApiSecret(text);
                }
              }}
              secureTextEntry={true}
            />
          </View>
          
          <TouchableOpacity style={styles.button} onPress={saveApiKeys}>
            <Text style={styles.buttonText}>
              {hasApiKeys ? 'Update API Keys' : 'Save API Keys'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Trading Bot Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trading Bot Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Risk Level</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={settings.riskLevel}
                onValueChange={(value) => setSettings({...settings, riskLevel: value})}
                minimumTrackTintColor="#4ecdc4"
                maximumTrackTintColor="#333"
                thumbTintColor="#4ecdc4"
              />
              <Text style={styles.sliderValue}>{settings.riskLevel}</Text>
            </View>
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Trading Amount (USD)</Text>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={settings.tradingAmount.toString()}
              onChangeText={(text) => {
                const amount = parseFloat(text) || 0;
                setSettings({...settings, tradingAmount: amount});
              }}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Trading</Text>
            <Switch
              trackColor={{ false: "#333", true: "#4ecdc4" }}
              thumbColor={settings.autoTrading ? "#fff" : "#f4f3f4"}
              onValueChange={() => setSettings({...settings, autoTrading: !settings.autoTrading})}
              value={settings.autoTrading}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Trading Interval (minutes)</Text>
            <TextInput
              style={styles.valueInput}
              keyboardType="numeric"
              value={settings.tradingInterval.toString()}
              onChangeText={(text) => {
                const interval = parseInt(text) || 30;
                setSettings({...settings, tradingInterval: interval});
              }}
            />
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Trade Notifications</Text>
            <Switch
              trackColor={{ false: "#333", true: "#4ecdc4" }}
              thumbColor={settings.tradeNotifications ? "#fff" : "#f4f3f4"}
              onValueChange={() => setSettings({...settings, tradeNotifications: !settings.tradeNotifications})}
              value={settings.tradeNotifications}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Price Alerts</Text>
            <Switch
              trackColor={{ false: "#333", true: "#4ecdc4" }}
              thumbColor={settings.priceAlerts ? "#fff" : "#f4f3f4"}
              onValueChange={() => setSettings({...settings, priceAlerts: !settings.priceAlerts})}
              value={settings.priceAlerts}
            />
          </View>
          
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Prediction Alerts</Text>
            <Switch
              trackColor={{ false: "#333", true: "#4ecdc4" }}
              thumbColor={settings.predictionAlerts ? "#fff" : "#f4f3f4"}
              onValueChange={() => setSettings({...settings, predictionAlerts: !settings.predictionAlerts})}
              value={settings.predictionAlerts}
            />
          </View>
          
          <TouchableOpacity style={styles.button} onPress={testNotification}>
            <Text style={styles.buttonText}>Test Notification</Text>
          </TouchableOpacity>
        </View>

        {/* Cryptocurrency Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monitored Cryptocurrencies</Text>
          <Text style={styles.sectionDescription}>
            Select cryptocurrencies to monitor and trade.
          </Text>
          
          {['BTC', 'ETH', 'SOL', 'ADA', 'DOT'].map((crypto) => (
            <View key={crypto} style={styles.settingRow}>
              <Text style={styles.settingLabel}>{crypto}</Text>
              <Switch
                trackColor={{ false: "#333", true: "#4ecdc4" }}
                thumbColor={settings.monitoredCryptos?.includes(crypto) ? "#fff" : "#f4f3f4"}
                onValueChange={() => {
                  const cryptos = settings.monitoredCryptos || [];
                  const newCryptos = cryptos.includes(crypto)
                    ? cryptos.filter(c => c !== crypto)
                    : [...cryptos, crypto];
                  setSettings({...settings, monitoredCryptos: newCryptos});
                }}
                value={settings.monitoredCryptos?.includes(crypto) || false}
              />
            </View>
          ))}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
            <Text style={styles.buttonText}>Save Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.resetButton} onPress={resetSettings}>
            <Text style={styles.buttonText}>Reset to Default</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.buttonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 60,
    backgroundColor: '#1e1e1e',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  section: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 8,
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: 'white',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: 'white',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    color: 'white',
    marginLeft: 8,
    width: 30,
    textAlign: 'center',
  },
  valueInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 8,
    color: 'white',
    width: 80,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4ecdc4',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  actionButtons: {
    padding: 16,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#4ecdc4',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  resetButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
}); 