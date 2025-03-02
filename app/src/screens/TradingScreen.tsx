import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Slider } from '@react-native-community/slider';
import { StorageService } from '../services/storage';
import { CryptoService } from '../services/crypto';
import { TradingService } from '../services/trading';
import { pythonBridge } from '../services/pythonBridge';
import { UserSettings, CryptoAsset } from '../types';

export const TradingScreen = () => {
  const [settings, setSettings] = useState<UserSettings>(
    StorageService.getDefaultSettings()
  );
  const [availableCryptos, setAvailableCryptos] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [predictions, setPredictions] = useState<{
    [symbol: string]: { prediction: number; confidence: number };
  }>({});
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load user settings
      const userSettings = StorageService.getUserSettings();
      if (userSettings) {
        setSettings(userSettings);
      }
      
      // Load available cryptocurrencies
      const popularCryptos = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'DOGE', 'XRP', 'LINK', 'AVAX', 'MATIC'];
      const cryptoData = await CryptoService.getSelectedCryptos(popularCryptos);
      setAvailableCryptos(cryptoData);
      
      // Load predictions for selected cryptos
      if (userSettings && userSettings.selectedCryptos.length > 0) {
        await loadPredictions(userSettings.selectedCryptos);
      }
    } catch (error) {
      console.error('Error loading trading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPredictions = async (symbols: string[]) => {
    try {
      // Initialize Python bridge if needed
      if (!isInitializing) {
        setIsInitializing(true);
        await pythonBridge.initialize();
        setIsInitializing(false);
      }
      
      // Get predictions for each selected crypto
      const newPredictions: { [symbol: string]: { prediction: number; confidence: number } } = {};
      
      for (const symbol of symbols) {
        const historicalData = await CryptoService.getHistoricalData(symbol, '1d');
        const prediction = await pythonBridge.predictPriceMovement(symbol, historicalData);
        newPredictions[symbol] = prediction;
      }
      
      setPredictions(newPredictions);
    } catch (error) {
      console.error('Error loading predictions:', error);
      Alert.alert('Error', 'Failed to load AI predictions. Please try again later.');
    }
  };

  const toggleCryptoSelection = (symbol: string) => {
    const newSelectedCryptos = [...settings.selectedCryptos];
    
    if (newSelectedCryptos.includes(symbol)) {
      // Remove from selection
      const index = newSelectedCryptos.indexOf(symbol);
      newSelectedCryptos.splice(index, 1);
    } else {
      // Add to selection
      newSelectedCryptos.push(symbol);
    }
    
    const newSettings = { ...settings, selectedCryptos: newSelectedCryptos };
    setSettings(newSettings);
    StorageService.saveUserSettings(newSettings);
  };

  const toggleTradingEnabled = () => {
    const newSettings = { ...settings, tradingEnabled: !settings.tradingEnabled };
    setSettings(newSettings);
    StorageService.saveUserSettings(newSettings);
    
    if (newSettings.tradingEnabled) {
      TradingService.startTradingBot();
    } else {
      TradingService.stopTradingBot();
    }
  };

  const setRiskLevel = (level: 'LOW' | 'MEDIUM' | 'HIGH') => {
    const newSettings = { ...settings, riskLevel: level };
    setSettings(newSettings);
    StorageService.saveUserSettings(newSettings);
  };

  const setMaxTradeAmount = (amount: number) => {
    const newSettings = { ...settings, maxTradeAmount: amount };
    setSettings(newSettings);
    StorageService.saveUserSettings(newSettings);
  };

  const getPredictionColor = (prediction: number) => {
    if (prediction > 0.05) return 'text-green-500';
    if (prediction < -0.05) return 'text-red-500';
    return 'text-yellow-500';
  };

  const getPredictionText = (prediction: number) => {
    if (prediction > 0.1) return 'Strong Buy';
    if (prediction > 0.05) return 'Buy';
    if (prediction > 0) return 'Weak Buy';
    if (prediction > -0.05) return 'Weak Sell';
    if (prediction > -0.1) return 'Sell';
    return 'Strong Sell';
  };

  return (
    <ScrollView className="flex-1 bg-background p-4">
      {/* Trading Bot Controls */}
      <View className="bg-surface rounded-xl p-4 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-xl font-semibold">Trading Bot</Text>
          <Switch
            value={settings.tradingEnabled}
            onValueChange={toggleTradingEnabled}
            trackColor={{ false: '#64748b', true: '#2563eb' }}
            thumbColor={settings.tradingEnabled ? '#ffffff' : '#f4f3f4'}
          />
        </View>
        
        <Text className="text-gray-400 mb-4">
          When enabled, the bot will automatically trade based on AI predictions and your risk settings.
        </Text>
        
        {isInitializing && (
          <View className="items-center py-4">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-400 mt-2">Initializing AI models...</Text>
          </View>
        )}
      </View>

      {/* Risk Settings */}
      <View className="bg-surface rounded-xl p-4 mb-6">
        <Text className="text-white text-xl font-semibold mb-4">Risk Level</Text>
        
        <View className="flex-row justify-between mb-4">
          <TouchableOpacity
            className={`py-2 px-4 rounded-lg ${
              settings.riskLevel === 'LOW' ? 'bg-primary' : 'bg-gray-700'
            }`}
            onPress={() => setRiskLevel('LOW')}
          >
            <Text className="text-white font-medium">Low</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`py-2 px-4 rounded-lg ${
              settings.riskLevel === 'MEDIUM' ? 'bg-primary' : 'bg-gray-700'
            }`}
            onPress={() => setRiskLevel('MEDIUM')}
          >
            <Text className="text-white font-medium">Medium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`py-2 px-4 rounded-lg ${
              settings.riskLevel === 'HIGH' ? 'bg-primary' : 'bg-gray-700'
            }`}
            onPress={() => setRiskLevel('HIGH')}
          >
            <Text className="text-white font-medium">High</Text>
          </TouchableOpacity>
        </View>
        
        <Text className="text-gray-400 mb-4">
          {settings.riskLevel === 'LOW'
            ? 'Conservative strategy with smaller trades and higher confidence thresholds.'
            : settings.riskLevel === 'MEDIUM'
            ? 'Balanced approach with moderate trade sizes and confidence thresholds.'
            : 'Aggressive strategy with larger trades and lower confidence thresholds.'}
        </Text>
      </View>

      {/* Max Trade Amount */}
      <View className="bg-surface rounded-xl p-4 mb-6">
        <Text className="text-white text-xl font-semibold mb-2">
          Max Trade Amount
        </Text>
        <Text className="text-white text-2xl font-bold mb-4">
          ${settings.maxTradeAmount}
        </Text>
        
        <Slider
          value={settings.maxTradeAmount}
          onValueChange={(value) => setMaxTradeAmount(Math.round(value))}
          minimumValue={10}
          maximumValue={1000}
          step={10}
          minimumTrackTintColor="#2563eb"
          maximumTrackTintColor="#64748b"
          thumbTintColor="#ffffff"
        />
        
        <View className="flex-row justify-between mt-2">
          <Text className="text-gray-400">$10</Text>
          <Text className="text-gray-400">$1000</Text>
        </View>
      </View>

      {/* Cryptocurrency Selection */}
      <View className="bg-surface rounded-xl p-4 mb-6">
        <Text className="text-white text-xl font-semibold mb-4">
          Select Cryptocurrencies
        </Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#2563eb" />
        ) : (
          availableCryptos.map((crypto) => (
            <TouchableOpacity
              key={crypto.id}
              className={`flex-row justify-between items-center p-3 mb-2 rounded-lg ${
                settings.selectedCryptos.includes(crypto.symbol)
                  ? 'bg-primary bg-opacity-20 border border-primary'
                  : 'bg-gray-800'
              }`}
              onPress={() => toggleCryptoSelection(crypto.symbol)}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-primary rounded-full items-center justify-center mr-3">
                  <Text className="text-white font-bold">
                    {crypto.symbol.charAt(0)}
                  </Text>
                </View>
                <View>
                  <Text className="text-white font-semibold">{crypto.name}</Text>
                  <Text className="text-gray-400">{crypto.symbol}</Text>
                </View>
              </View>
              
              {settings.selectedCryptos.includes(crypto.symbol) && predictions[crypto.symbol] && (
                <View className="items-end">
                  <Text
                    className={getPredictionColor(predictions[crypto.symbol].prediction)}
                  >
                    {getPredictionText(predictions[crypto.symbol].prediction)}
                  </Text>
                  <Text className="text-gray-400">
                    {Math.round(predictions[crypto.symbol].confidence * 100)}% confidence
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
        
        <TouchableOpacity
          className="bg-primary p-3 rounded-lg mt-4"
          onPress={() => loadPredictions(settings.selectedCryptos)}
        >
          <Text className="text-white font-semibold text-center">
            Refresh Predictions
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}; 