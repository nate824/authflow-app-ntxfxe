
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Warning {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  created_at: string;
  message_id?: string;
}

interface Job {
  id: string;
  job_name: string;
  warnings_and_risks: Warning[];
}

export default function WarningsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWarnings();
  }, [jobId]);

  const loadWarnings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_name, warnings_and_risks')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading warnings:', error);
      } else {
        console.log('Warnings loaded:', data);
        setJob(data);
      }
    } catch (error) {
      console.error('Exception loading warnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadWarnings();
    setRefreshing(false);
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

  const warnings = job?.warnings_and_risks || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Warnings & Risks</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading warnings...</Text>
        </View>
      ) : warnings.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* AI Label */}
          <View style={[styles.aiLabel, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto_awesome"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={[styles.aiLabelText, { color: theme.colors.primary }]}>
              AI-Detected Warnings & Risks
            </Text>
          </View>

          {warnings.map((warning, index) => (
            <View
              key={index}
              style={[
                styles.warningCard,
                { 
                  backgroundColor: theme.colors.card, 
                  borderColor: warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981' 
                }
              ]}
            >
              <View style={styles.warningHeader}>
                <View style={[
                  styles.warningIcon, 
                  { backgroundColor: warning.severity === 'high' ? '#EF444420' : warning.severity === 'medium' ? '#F59E0B20' : '#10B98120' }
                ]}>
                  <IconSymbol 
                    ios_icon_name="exclamationmark.triangle.fill" 
                    android_material_icon_name="warning" 
                    size={24} 
                    color={warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981'} 
                  />
                </View>
                <View style={styles.warningContent}>
                  <View style={[
                    styles.severityBadge, 
                    { backgroundColor: warning.severity === 'high' ? '#EF4444' : warning.severity === 'medium' ? '#F59E0B' : '#10B981' }
                  ]}>
                    <Text style={styles.severityText}>
                      {warning.severity?.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.warningTitle, { color: theme.colors.text }]}>{warning.title}</Text>
                  {warning.description && (
                    <Text style={[styles.warningDescription, { color: theme.colors.text }]}>{warning.description}</Text>
                  )}
                  <Text style={[styles.reportedAt, { color: theme.colors.text }]}>Reported: {formatTime(warning.created_at)}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: '#10B98110' }]}>
              <IconSymbol 
                ios_icon_name="checkmark.shield" 
                android_material_icon_name="verified_user" 
                size={48} 
                color="#10B981" 
                style={{ opacity: 0.5 }} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Active Warnings
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              All clear - no risks detected by the AI from chat messages.
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.text }]}>
              Pull down to refresh
            </Text>
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  aiLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.4,
    marginTop: 8,
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
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    lineHeight: 22,
  },
  warningDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
    opacity: 0.8,
  },
  reportedAt: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
});
