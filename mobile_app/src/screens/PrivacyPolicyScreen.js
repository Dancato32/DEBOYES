import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';

export default function PrivacyPolicyScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.date}>Effective Date: April 23, 2026</Text>
        
        <Text style={styles.sectionTitle}>1. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect account details (name, email, phone) and location data to facilitate deliveries and provide a seamless experience.
        </Text>

        <Text style={styles.sectionTitle}>2. Data Usage</Text>
        <Text style={styles.paragraph}>
          Your data is used strictly for order processing, logistics management, and security. We do not sell your personal information.
        </Text>

        <Text style={styles.sectionTitle}>3. Your Rights</Text>
        <Text style={styles.paragraph}>
          You can request account deletion at any time via the Settings menu. Deletion is permanent and removes all personal records from our servers.
        </Text>

        <Text style={styles.sectionTitle}>4. Contact Us</Text>
        <Text style={styles.paragraph}>
          For any privacy concerns, reach out to support@deboyes.com.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#FFF' },
  backButton: { fontSize: 16, color: '#4B5563', marginRight: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  content: { padding: 24 },
  date: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginTop: 24, marginBottom: 8 },
  paragraph: { fontSize: 16, color: '#374151', lineHeight: 24 }
});
