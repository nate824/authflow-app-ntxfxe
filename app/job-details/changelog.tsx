
import React, { useEffect, useState, useCallback } from 'react';
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

interface AIChangeLogEntry {
  timestamp: string;
  section: string;
  change_type: string;
  previous_value?: any;
  new_value?: any;
  message_id?: string;
  message_text?: string;
  reason?: string;
}

interface ManualChangeLogEntry {
  id: string;
  action: string;
  details: string;
  created_at: string;
  user_profiles?: {
    display_name: string;
  };
}

type CombinedEntry = {
  type: 'ai' | 'manual';
  timestamp: string;
  data: AIChangeLogEntry | ManualChangeLogEntry;
};

export default function ChangeLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [entries, setEntries] = useState<CombinedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChangelog = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch AI changelog from jobs table
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('ai_changelog')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error fetching AI changelog:', jobError);
      }

      // Fetch manual changelog from changelog table
      const { data: manualData, error: manualError } = await supabase
        .from('changelog')
        .select(`
          *,
          user_profiles!changelog_user_id_fkey(display_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: false });

      if (manualError) {
        console.error('Error fetching manual changelog:', manualError);
      }

      // Combine and sort entries
      const combined: CombinedEntry[] = [];

      // Add AI changelog entries
      if (jobData?.ai_changelog && Array.isArray(jobData.ai_changelog)) {
        jobData.ai_changelog.forEach((entry: AIChangeLogEntry) => {
          combined.push({
            type: 'ai',
            timestamp: entry.timestamp,
            data: entry,
          });
        });
      }

      // Add manual changelog entries
      if (manualData) {
        manualData.forEach((entry: ManualChangeLogEntry) => {
          combined.push({
            type: 'manual',
            timestamp: entry.created_at,
            data: entry,
          });
        });
      }

      // Sort by timestamp (newest first)
      combined.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setEntries(combined);
    } catch (error) {
      console.error('Error fetching changelog:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    fetchChangelog();
  }, [fetchChangelog]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchChangelog();
    setRefreshing(false);
  };

  const getSectionIcon = (section: string) => {
    switch (section) {
      case 'job_overview':
        return { ios: 'sparkles', android: 'auto_awesome', color: '#3B82F6' };
      case 'open_issues':
        return { ios: 'exclamationmark.triangle', android: 'warning', color: '#F59E0B' };
      case 'unanswered_questions':
        return { ios: 'questionmark.circle', android: 'help', color: '#3B82F6' };
      case 'next_actions':
        return { ios: 'checkmark.circle', android: 'check_circle', color: '#10B981' };
      case 'warnings_and_risks':
        return { ios: 'exclamationmark.shield', android: 'shield', color: '#EF4444' };
      case 'deadlines_and_timelines':
        return { ios: 'clock', android: 'schedule', color: '#8B5CF6' };
      case 'dependencies':
        return { ios: 'link', android: 'link', color: '#06B6D4' };
      default:
        return { ios: 'pencil', android: 'edit', color: '#64748B' };
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'created':
        return 'Created';
      case 'updated':
        return 'Updated';
      case 'resolved':
        return 'Resolved';
      case 'completed':
        return 'Completed';
      case 'cleared':
        return 'Cleared';
      case 'answered':
        return 'Answered';
      default:
        return changeType;
    }
  };

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'job_overview':
        return 'Job Overview';
      case 'open_issues':
        return 'Open Issues';
      case 'unanswered_questions':
        return 'Questions';
      case 'next_actions':
        return 'Actions';
      case 'warnings_and_risks':
        return 'Risks';
      case 'deadlines_and_timelines':
        return 'Timelines';
      case 'dependencies':
        return 'Dependencies';
      default:
        return section;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  const renderAIEntry = (entry: AIChangeLogEntry, index: number) => {
    const icon = getSectionIcon(entry.section);
    const changeLabel = getChangeTypeLabel(entry.change_type);
    const sectionLabel = getSectionLabel(entry.section);

    return (
      <View
        key={`ai-${index}`}
        style={[
          styles.entryCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.entryHeader}>
          <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
            <IconSymbol
              ios_icon_name={icon.ios}
              android_material_icon_name={icon.android}
              size={20}
              color={icon.color}
            />
          </View>
          <View style={styles.entryContent}>
            <View style={styles.entryTitleRow}>
              <View style={styles.titleContainer}>
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {changeLabel} {sectionLabel}
                </Text>
                <View style={[styles.aiBadge, { backgroundColor: theme.colors.primary + '20' }]}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto_awesome"
                    size={10}
                    color={theme.colors.primary}
                  />
                  <Text style={[styles.aiBadgeText, { color: theme.colors.primary }]}>
                    AI
                  </Text>
                </View>
              </View>
              <Text style={[styles.timeText, { color: theme.colors.text }]}>
                {formatTime(entry.timestamp)}
              </Text>
            </View>
            {entry.reason && (
              <Text style={[styles.detailsText, { color: theme.colors.text }]}>
                {entry.reason}
              </Text>
            )}
            {entry.message_text && (
              <View style={[styles.messageBox, { backgroundColor: theme.colors.background }]}>
                <Text style={[styles.messageText, { color: theme.colors.text }]}>
                  &quot;{entry.message_text.substring(0, 100)}
                  {entry.message_text.length > 100 ? '...' : ''}&quot;
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderManualEntry = (entry: ManualChangeLogEntry, index: number) => {
    const icon = { ios: 'person.circle', android: 'account_circle', color: '#64748B' };

    return (
      <View
        key={`manual-${index}`}
        style={[
          styles.entryCard,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.entryHeader}>
          <View style={[styles.iconContainer, { backgroundColor: icon.color + '20' }]}>
            <IconSymbol
              ios_icon_name={icon.ios}
              android_material_icon_name={icon.android}
              size={20}
              color={icon.color}
            />
          </View>
          <View style={styles.entryContent}>
            <View style={styles.entryTitleRow}>
              <Text style={[styles.actionText, { color: theme.colors.text }]}>
                {entry.action}
              </Text>
              <Text style={[styles.timeText, { color: theme.colors.text }]}>
                {formatTime(entry.created_at)}
              </Text>
            </View>
            <Text style={[styles.detailsText, { color: theme.colors.text }]}>
              {entry.details}
            </Text>
            <View style={styles.userRow}>
              <IconSymbol
                ios_icon_name="person.circle"
                android_material_icon_name="account_circle"
                size={14}
                color={theme.colors.text}
                style={{ opacity: 0.6 }}
              />
              <Text style={[styles.userText, { color: theme.colors.text }]}>
                {entry.user_profiles?.display_name || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.header,
            { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border },
          ]}
        >
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={theme.colors.text}
            />
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
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Log</Text>
        <View style={styles.headerSpacer} />
      </View>

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
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="clock"
              android_material_icon_name="history"
              size={64}
              color={theme.colors.text}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No activity yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>
              Changes will be logged here as the AI processes chat messages
            </Text>
          </View>
        ) : (
          entries.map((entry, index) => {
            if (entry.type === 'ai') {
              return renderAIEntry(entry.data as AIChangeLogEntry, index);
            } else {
              return renderManualEntry(entry.data as ManualChangeLogEntry, index);
            }
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
    paddingHorizontal: 40,
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
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiBadgeText: {
    fontSize: 10,
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
  messageBox: {
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  messageText: {
    fontSize: 13,
    fontStyle: 'italic',
    opacity: 0.7,
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
