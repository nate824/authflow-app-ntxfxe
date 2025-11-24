
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

interface Warning {
  id: string;
  text: string;
  severity: 'high' | 'medium';
  reportedAt: string;
}

export default function WarningsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const warnings: Warning[] = [
    {
      id: '1',
      text: 'Heat trace fault detected on pipe section 22.',
      severity: 'high',
      reportedAt: 'Today 1:15 PM',
    },
    {
      id: '2',
      text: 'High winds predicted after 3 PM.',
      severity: 'medium',
      reportedAt: 'Today 12:00 PM',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Warnings & Risks</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {warnings.map((warning, index) => (
          <View
            key={index}
            style={[
              styles.warningCard,
              { backgroundColor: theme.colors.card, borderColor: warning.severity === 'high' ? '#EF4444' : '#F59E0B' }
            ]}
          >
            <View style={styles.warningHeader}>
              <View style={[styles.warningIcon, { backgroundColor: warning.severity === 'high' ? '#EF444420' : '#F59E0B20' }]}>
                <IconSymbol
                  ios_icon_name="exclamationmark.triangle.fill"
                  android_material_icon_name="warning"
                  size={24}
                  color={warning.severity === 'high' ? '#EF4444' : '#F59E0B'}
                />
              </View>
              <View style={styles.warningContent}>
                <View style={[styles.severityBadge, { backgroundColor: warning.severity === 'high' ? '#EF444420' : '#F59E0B20' }]}>
                  <Text style={[styles.severityText, { color: warning.severity === 'high' ? '#EF4444' : '#F59E0B' }]}>
                    {warning.severity === 'high' ? 'High Risk' : 'Medium Risk'}
                  </Text>
                </View>
                <Text style={[styles.warningText, { color: theme.colors.text }]}>
                  {warning.text}
                </Text>
                <Text style={[styles.reportedAt, { color: theme.colors.text }]}>
                  Reported: {warning.reportedAt}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 48 : 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  warningCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContent: {
    flex: 1,
  },
  severityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  reportedAt: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
});
