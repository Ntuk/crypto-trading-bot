import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AuthService } from '../services/authService';

interface ApiKeySetupProps {
  onSuccess: () => void;
}

export function ApiKeySetup({ onSuccess }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveKeys = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Validate inputs
      if (!apiKey.trim()) {
        setError('API Key is required');
        return;
      }

      if (!apiSecret.trim()) {
        setError('API Secret is required');
        return;
      }

      // Test and save the API keys
      const result = await AuthService.saveApiKeys(apiKey, apiSecret);

      if (result.success) {
        setSuccess(result.message);
        // Clear the form
        setApiKey('');
        setApiSecret('');
        // Notify parent component
        onSuccess();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Error saving API keys: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestKeys = async () => {
    try {
      setIsLoading(true);
      setError('');
      setSuccess('');

      // Validate inputs
      if (!apiKey.trim()) {
        setError('API Key is required');
        return;
      }

      if (!apiSecret.trim()) {
        setError('API Secret is required');
        return;
      }

      // Test the API keys
      const result = await AuthService.testApiKeys(apiKey, apiSecret);

      if (result.success) {
        setSuccess(result.message);
        Alert.alert('Success', 'API keys are valid! Would you like to save them?', [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: handleSaveKeys,
          },
        ]);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(`Error testing API keys: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const showApiKeyHelp = () => {
    Alert.alert(
      'API Key Help',
      'To get your Coinbase API key:\n\n' +
      '1. Log in to your Coinbase Advanced account\n' +
      '2. Go to Settings > API\n' +
      '3. Create a new API key with the following permissions:\n' +
      '   - View\n' +
      '   - Trade\n' +
      '4. Copy the API Key and Secret\n\n' +
      'The API key should look like: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\n\n' +
      'The API secret should be a long string of characters, often in PEM format starting with "-----BEGIN EC PRIVATE KEY-----"'
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Coinbase API Setup</Text>
      
      <Text style={styles.label}>API Key</Text>
      <TextInput
        style={styles.input}
        value={apiKey}
        onChangeText={setApiKey}
        placeholder="Enter your Coinbase API Key"
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Text style={styles.label}>API Secret</Text>
      <TextInput
        style={[styles.input, styles.secretInput]}
        value={apiSecret}
        onChangeText={setApiSecret}
        placeholder="Enter your Coinbase API Secret"
        placeholderTextColor="#888"
        autoCapitalize="none"
        autoCorrect={false}
        multiline
        numberOfLines={4}
        secureTextEntry
      />
      
      <TouchableOpacity style={styles.helpButton} onPress={showApiKeyHelp}>
        <Text style={styles.helpButtonText}>Need help?</Text>
      </TouchableOpacity>
      
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? <Text style={styles.successText}>{success}</Text> : null}
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, styles.testButton]} 
          onPress={handleTestKeys}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Test Keys</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.saveButton]} 
          onPress={handleSaveKeys}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Save Keys</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  secretInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  testButton: {
    backgroundColor: '#4a90e2',
  },
  saveButton: {
    backgroundColor: '#50c878',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
  },
  successText: {
    color: '#2ecc71',
    marginBottom: 16,
  },
  helpButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  helpButtonText: {
    color: '#4a90e2',
    fontSize: 14,
  },
}); 