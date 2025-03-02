import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { StorageService } from './storage';

export class NotificationService {
  static async initialize(): Promise<void> {
    // Request permission for notifications
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
      
      // Configure notification behavior
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Get push token
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log('Push token:', token);
      
      // Save token to storage
      await StorageService.savePushToken(token);
    } else {
      console.log('Must use physical device for push notifications');
    }

    // Handle notification received when app is in foreground
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received in foreground:', notification);
    });

    // Handle notification interaction
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification interaction:', response);
    });
  }

  static async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
      },
      trigger: null, // Send immediately
    });
  }

  static async sendTradeNotification(
    symbol: string,
    action: 'BUY' | 'SELL',
    amount: number,
    price: number
  ): Promise<void> {
    const title = `${action} Order Executed`;
    const body = `Successfully ${action.toLowerCase()}ed ${amount.toFixed(6)} ${symbol} at $${price.toFixed(2)}`;
    
    await this.sendLocalNotification(title, body, {
      type: 'TRADE',
      symbol,
      action,
      amount,
      price,
    });
  }

  static async sendPriceAlertNotification(
    symbol: string,
    price: number,
    changePercent: number
  ): Promise<void> {
    const direction = changePercent >= 0 ? 'up' : 'down';
    const title = `${symbol} Price Alert`;
    const body = `${symbol} has moved ${direction} by ${Math.abs(changePercent).toFixed(2)}% to $${price.toFixed(2)}`;
    
    await this.sendLocalNotification(title, body, {
      type: 'PRICE_ALERT',
      symbol,
      price,
      changePercent,
    });
  }

  static async sendPredictionNotification(
    symbol: string,
    prediction: string,
    confidence: number
  ): Promise<void> {
    const title = `${symbol} Trading Signal`;
    const body = `New ${prediction} signal for ${symbol} with ${(confidence * 100).toFixed(0)}% confidence`;
    
    await this.sendLocalNotification(title, body, {
      type: 'PREDICTION',
      symbol,
      prediction,
      confidence,
    });
  }
} 