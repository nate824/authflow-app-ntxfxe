
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Warning {
  id: string;
  warning_text: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
}

export default function WarningsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWarnings();
  }, [jobId]);

  const fetchWarnings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warnings')
        .select('*')
        .eq('job_id', jobId)
        .eq('resolved', false)
        .order('severity', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching warnings:', error);
      } else {
        setWarnings(data || []);
      }
    } catch (error) {
      console.error('Error fetching warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `Today ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Warnings & Risks</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Warnings & Risks</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {warnings.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="checkmark.shield" android_material_icon_name="verified_user" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No active warnings</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>All clear - no risks detected</Text>
          </View>
        ) : (
          warnings.map((warning, index) => (
            <View
              key={index}
              style={[
                styles.warningCard,
                { backgroundColor: theme.colors.card, borderColor: warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981' }
              ]}
            >
              <View style={styles.warningHeader}>
                <View style={[styles.warningIcon, { backgroundColor: warning.severity === 'high' ? '#EF444420' : warning.severity === 'medium' ? '#F59E0B20' : '#10B98120' }]}>
                  <IconSymbol ios_icon_name="exclamationmark.triangle.fill" android_material_icon_name="warning" size={24} color={warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981'} />
                </View>
                <View style={styles.warningContent}>
                  <View style={[styles.severityBadge, { backgroundColor: warning.severity === 'high' ? '#EF444420' : warning.severity === 'medium' ? '#F59E0B20' : '#10B98120' }]}>
                    <Text style={[styles.severityText, { color: warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981' }]}>
                      {warning.severity === 'high' ? 'High Risk' : warning.severity === 'medium' ? 'Medium Risk' : 'Low Risk'}
                    </Text>
                  </View>
                  <Text style={[styles.warningText, { color: theme.colors.text }]}>{warning.warning_text}</Text>
                  <Text style={[styles.reportedAt, { color: theme.colors.text }]}>Reported: {formatTime(warning.created_at)}</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.7,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.5,
    textAlign: 'center',
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
