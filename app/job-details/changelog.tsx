
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

interface ChangeLogEntry {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user_profiles?: {
    display_name: string;
  };
}

export default function ChangeLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [entries, setEntries] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChangelog();
  }, [jobId]);

  const fetchChangelog = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('changelog')
        .select(`
          *,
          user_profiles!changelog_user_id_fkey(display_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching changelog:', error);
      } else {
        setEntries(data || []);
      }
    } catch (error) {
      console.error('Error fetching changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('Issue')) {
      return { ios: 'exclamationmark.triangle', android: 'warning' };
    } else if (action.includes('Question')) {
      return { ios: 'questionmark.circle', android: 'help' };
    } else if (action.includes('Document')) {
      return { ios: 'doc', android: 'description' };
    } else if (action.includes('User')) {
      return { ios: 'person.badge.plus', android: 'person_add' };
    } else {
      return { ios: 'pencil', android: 'edit' };
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
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Log</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Log</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="clock" android_material_icon_name="history" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No activity yet</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>Changes will be logged here</Text>
          </View>
        ) : (
          entries.map((entry, index) => {
            const icon = getActionIcon(entry.action);
            return (
              <View key={index} style={[styles.entryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.entryHeader}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                    <IconSymbol ios_icon_name={icon.ios} android_material_icon_name={icon.android} size={20} color={theme.colors.primary} />
                  </View>
                  <View style={styles.entryContent}>
                    <View style={styles.entryTitleRow}>
                      <Text style={[styles.actionText, { color: theme.colors.text }]}>{entry.action}</Text>
                      <Text style={[styles.timeText, { color: theme.colors.text }]}>{formatTime(entry.created_at)}</Text>
                    </View>
                    <Text style={[styles.detailsText, { color: theme.colors.text }]}>{entry.details}</Text>
                    <View style={styles.userRow}>
                      <IconSymbol ios_icon_name="person.circle" android_material_icon_name="account_circle" size={14} color={theme.colors.text} style={{ opacity: 0.6 }} />
                      <Text style={[styles.userText, { color: theme.colors.text }]}>
                        {entry.user_profiles?.display_name || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
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
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryContent: {
    flex: 1,
    gap: 6,
  },
  entryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
});
