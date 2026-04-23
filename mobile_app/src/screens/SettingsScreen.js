import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert, SafeAreaView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const SettingItem = ({ label, icon, value, onToggle, onPress, red }) => (
  <TouchableOpacity 
    style={styles.item} 
    onPress={onPress}
    disabled={onToggle !== undefined}
  >
    <View style={styles.itemLeft}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.label, red && { color: '#B91C1C' }]}>{label}</Text>
    </View>
    {onToggle !== undefined ? (
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: '#111827' }} />
    ) : (
      <Text style={styles.arrow}>→</Text>
    )}
  </TouchableOpacity>
);

export default function SettingsScreen({ navigation }) {
  const { logout } = useContext(AuthContext);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This action is permanent and will delete all your data.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.post('/delete/');
              logout();
            } catch (err) {
              Alert.alert("Error", "Could not delete account. Try again later.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <SettingItem 
          label="Push Notifications" 
          icon="🔔" 
          value={notificationsEnabled} 
          onToggle={setNotificationsEnabled} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>LEGAL</Text>
        <SettingItem 
          label="Privacy Policy" 
          icon="📜" 
          onPress={() => navigation.navigate('PrivacyPolicy')} 
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <SettingItem 
          label="Sign Out" 
          icon="🚪" 
          onPress={logout} 
        />
        <SettingItem 
          label="Delete Account" 
          icon="⚠️" 
          red 
          onPress={handleDeleteAccount} 
        />
      </View>

      <Text style={styles.version}>De Boye's v1.5.0 (Production)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF' },
  backButton: { fontSize: 16, color: '#4B5563', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  section: { marginTop: 24 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginLeft: 16, marginBottom: 8, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 20, marginRight: 16 },
  label: { fontSize: 16, color: '#374151', fontWeight: '500' },
  arrow: { fontSize: 18, color: '#D1D5DB' },
  version: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 40 }
});
