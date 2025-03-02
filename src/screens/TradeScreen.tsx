import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CryptoService } from '../services/crypto';
import { StorageService } from '../services/storage';
import { TradingService } from '../services/trading';
import { CoinbaseApiService } from '../services/coinbaseApi';

export const TradeScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { symbol, action } = route.params as { symbol: string; action: 'BUY' | 'SELL' };
  
  const [loading, setLoading] = useState<boolean>(true);
  const [executing, setExecuting] = useState<boolean>(false);
  const [cryptoData, setCryptoData] = useState<any>(null);
  const [amount, setAmount] = useState<string>('');
  const [usdValue, setUsdValue] = useState<number>(0);
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [availableCrypto, setAvailableCrypto] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, [symbol]);

  useEffect(() => {
    if (cryptoData && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        setUsdValue(numAmount * cryptoData.currentPrice);
      } else {
        setUsdValue(0);
      }
    }
  }, [amount, cryptoData]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get crypto data
      const data = await CryptoService.getSelectedCryptos([symbol]);
      if (data.length > 0) {
        setCryptoData(data[0]);
      }
      
      // Get portfolio data
      const portfolio = await StorageService.getPortfolio();
      setAvailableCrypto(portfolio[symbol] || 0);
      
      // Get USD balance from Coinbase
      try {
        const usdBalance = await CoinbaseApiService.getBalance('USD');
        setAvailableBalance(usdBalance);
      } catch (error) {
        console.error('Error fetching USD balance:', error);
        // Fallback to a default value for demo purposes
        setAvailableBalance(10000);
      }
    } catch (error) {
      console.error(`Error loading data for ${symbol}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountChange = (text: string) => {
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(text)) {
      setAmount(text);
    }
  };

  const setMaxAmount = () => {
    if (action === 'BUY') {
      const maxAmount = availableBalance / cryptoData.currentPrice;
      setAmount(maxAmount.toFixed(6));
    } else {
      setAmount(availableCrypto.toString());
    }
  };

  const validateTrade = (): boolean => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return false;
    }
    
    if (action === 'BUY' && usdValue > availableBalance) {
      Alert.alert('Insufficient Funds', 'You do not have enough USD for this purchase.');
      return false;
    }
    
    if (action === 'SELL' && numAmount > availableCrypto) {
      Alert.alert('Insufficient Crypto', `You do not have enough ${symbol} for this sale.`);
      return false;
    }
    
    return true;
  };

  const executeTrade = async () => {
    if (!validateTrade()) return;
    
    try {
      setExecuting(true);
      
      const numAmount = parseFloat(amount);
      
      // Execute trade using the trading service
      const success = await TradingService.executeManualTrade(
        symbol,
        action,
        action === 'BUY' ? usdValue : numAmount
      );
      
      if (success) {
        // Show success message
        Alert.alert(
          'Trade Executed',
          `Successfully ${action === 'BUY' ? 'bought' : 'sold'} ${numAmount} ${symbol} at $${cryptoData.currentPrice.toFixed(2)}.`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      } else {
        Alert.alert('Trade Failed', 'There was an error executing your trade. Please try again.');
      }
    } catch (error) {
      console.error(`Error executing trade for ${symbol}:`, error);
      Alert.alert('Trade Failed', 'There was an error executing your trade. Please try again.');
    } finally {
      setExecuting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View className="bg-surface p-4 flex-row items-center">
        <TouchableOpacity
          className="mr-4"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <Text className="text-white text-xl font-semibold">
          {action} {symbol}
        </Text>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
          <Text className="text-gray-400 mt-4">Loading data...</Text>
        </View>
      ) : (
        <ScrollView className="flex-1 p-4">
          {/* Current Price */}
          {cryptoData && (
            <View className="bg-surface rounded-xl p-4 mb-4">
              <Text className="text-gray-400">Current Price</Text>
              <Text className="text-white text-3xl font-bold">
                ${cryptoData.currentPrice.toFixed(2)}
              </Text>
              
              <Text
                className={
                  cryptoData.priceChange24h >= 0
                    ? 'text-green-500'
                    : 'text-red-500'
                }
              >
                {cryptoData.priceChange24h >= 0 ? '+' : ''}
                {cryptoData.priceChange24h.toFixed(2)}% (24h)
              </Text>
            </View>
          )}

          {/* Available Balance */}
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-gray-400">
              {action === 'BUY' ? 'Available USD' : `Available ${symbol}`}
            </Text>
            <Text className="text-white text-xl font-semibold">
              {action === 'BUY'
                ? `$${availableBalance.toFixed(2)}`
                : `${availableCrypto.toFixed(6)} ${symbol}`}
            </Text>
          </View>

          {/* Trade Form */}
          <View className="bg-surface rounded-xl p-4 mb-4">
            <Text className="text-white text-lg font-semibold mb-4">
              {action === 'BUY' ? 'Buy Amount' : 'Sell Amount'}
            </Text>
            
            <View className="flex-row items-center mb-4">
              <TextInput
                className="flex-1 bg-gray-800 text-white p-3 rounded-lg text-lg"
                placeholder="0.00"
                placeholderTextColor="#64748b"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={handleAmountChange}
              />
              
              <Text className="text-white text-lg font-semibold ml-3">
                {symbol}
              </Text>
              
              <TouchableOpacity
                className="ml-3 bg-primary px-3 py-1 rounded-lg"
                onPress={setMaxAmount}
              >
                <Text className="text-white">MAX</Text>
              </TouchableOpacity>
            </View>
            
            <View className="bg-gray-800 p-3 rounded-lg mb-4">
              <Text className="text-gray-400">Total Value</Text>
              <Text className="text-white text-lg">
                ${usdValue.toFixed(2)}
              </Text>
            </View>
            
            <TouchableOpacity
              className={`p-4 rounded-lg items-center ${
                action === 'BUY' ? 'bg-green-600' : 'bg-red-600'
              } ${executing ? 'opacity-70' : ''}`}
              onPress={executeTrade}
              disabled={executing}
            >
              {executing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-lg font-semibold">
                  {action === 'BUY' ? 'Buy' : 'Sell'} {symbol}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Disclaimer */}
          <View className="bg-surface rounded-xl p-4 mb-8">
            <Text className="text-gray-400 text-xs">
              Disclaimer: Cryptocurrency trading involves significant risk. 
              Always do your own research before making investment decisions.
            </Text>
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}; 