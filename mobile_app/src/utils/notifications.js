import { Platform, PermissionsAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

/**
 * Request notification permissions and sync FCM token with backend.
 * Note: Actual Firebase integration requires @react-native-firebase/messaging installed.
 */
export const setupNotifications = async () => {
  try {
    let hasPermission = false;

    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        hasPermission = granted === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        hasPermission = true;
      }
    } else if (Platform.OS === 'ios') {
      // Logic for iOS (e.g. messaging().requestPermission())
      hasPermission = true; 
    }

    if (hasPermission) {
      console.log('Notification permission granted');
      // In a real app with Firebase installed:
      // const token = await messaging().getToken();
      // await syncTokenWithBackend(token);
    }
  } catch (error) {
    console.error('Failed to setup notifications:', error);
  }
};

const syncTokenWithBackend = async (token) => {
  try {
    const savedToken = await AsyncStorage.getItem('fcm_token');
    if (savedToken !== token) {
      await api.post('/fcm-token/', { token });
      await AsyncStorage.setItem('fcm_token', token);
    }
  } catch (error) {
    console.error('Failed to sync FCM token:', error);
  }
};
