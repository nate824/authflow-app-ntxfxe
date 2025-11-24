
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useFocusEffect } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface SummaryTabProps {
  jobId: string;
}

interface SummaryCard {
  id: string;
  title: string;
  count?: number;
  icon: string;
  androidIcon: string;
  route: string;
  color?: string;
}

interface Job {
  open_issues: any[];
  unanswered_questions: any[];
  next_actions: any[];
  completed_items: any[];
  warnings_and_risks: any[];
  deadlines_and_timelines: any[];
  dependencies: any[];
  ai_changelog: any[];
  processing_status: 'idle' | 'scheduled' | 'running' | 'failed';
  processing_scheduled_for: string | null;
  last_processed_at: string | null;
  job_overview: string | null;
}

export default function SummaryTab({ jobId }: SummaryTabProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingManually, setProcessingManually] = useState(false);
  const [job, setJob] = useState<Job | null>(null);

  useEffect(() => {
    fetchJobData();
  }, [jobId]);

  // Refresh when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchJobData();
    }, [jobId])
  );

  const fetchJobData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('jobs')
        .select('open_issues, unanswered_questions, next_actions, completed_items, warnings_and_risks, deadlines_and_timelines, dependencies, ai_changelog, processing_status, processing_scheduled_for, last_processed_at, job_overview')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job data:', error);
      } else {
        console.log('Job data fetched:', {
          overview_length: data.job_overview?.length || 0,
          open_issues: data.open_issues?.length || 0,
          questions: data.unanswered_questions?.length || 0,
          actions: data.next_actions?.length || 0,
          processing_status: data.processing_status,
        });
        setJob(data);
      }
    } catch (error) {
      console.error('Error fetching job data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchJobData();
    setRefreshing(false);
  };

  const handleManualProcess = async () => {
    try {
      setProcessingManually(true);
      
      console.log('Manually triggering processing for job:', jobId);
      
      // Call the edge function directly
      const { data, error } = await supabase.functions.invoke('process-chat-batch', {
        body: { job_id: jobId }
      });

      if (error) {
        console.error('Error processing chat:', error);
        Alert.alert('Processing Error', `Failed to process chat messages: ${error.message || 'Unknown error'}`);
      } else {
        console.log('Processing result:', data);
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          if (result.status === 'success') {
            Alert.alert(
              'Success', 
              `Processed ${result.messages_processed} messages. Overview: ${result.overview_length} characters. Changes: ${result.changes_made}`
            );
          } else if (result.status === 'skipped') {
            Alert.alert('Info', 'No new messages to process.');
          } else if (result.status === 'error') {
            Alert.alert('Error', `Processing failed: ${result.error}`);
          }
        } else {
          Alert.alert('Success', 'Chat messages processed successfully!');
        }
        
        // Refresh the data
        await fetchJobData();
      }
    } catch (error) {
      console.error('Exception processing chat:', error);
      Alert.alert('Error', 'An unexpected error occurred while processing.');
    } finally {
      setProcessingManually(false);
    }
  };

  const getProcessingStatusBadge = () => {
    if (!job) return null;

    const { processing_status, processing_scheduled_for, last_processed_at } = job;

    if (processing_status === 'running') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.statusBadgeText, { color: theme.colors.primary }]}>
            Processing...
          </Text>
        </View>
      );
    }

    if (processing_status === 'scheduled') {
      const scheduledTime = processing_scheduled_for ? new Date(processing_scheduled_for) : null;
      const isPast = scheduledTime && scheduledTime < new Date();
      
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
          <IconSymbol
            ios_icon_name="clock"
            android_material_icon_name="schedule"
            size={14}
            color="#F59E0B"
          />
          <Text style={[styles.statusBadgeText, { color: '#F59E0B' }]}>
            {isPast ? 'Processing pending' : 'Processing scheduled'}
          </Text>
        </View>
      );
    }

    if (processing_status === 'failed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="error"
            size={14}
            color="#EF4444"
          />
          <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>
            Processing failed - Try again
          </Text>
        </View>
      );
    }

    if (last_processed_at) {
      const processedTime = new Date(last_processed_at);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - processedTime.getTime()) / 60000);
      
      let timeText = '';
      if (diffMinutes < 1) {
        timeText = 'just now';
      } else if (diffMinutes < 60) {
        timeText = `${diffMinutes}m ago`;
      } else if (diffMinutes < 1440) {
        timeText = `${Math.floor(diffMinutes / 60)}h ago`;
      } else {
        timeText = `${Math.floor(diffMinutes / 1440)}d ago`;
      }

      return (
        <View style={[styles.statusBadge, { backgroundColor: '#10B98120', borderColor: '#10B981' }]}>
          <IconSymbol
            ios_icon_name="checkmark.circle"
            android_material_icon_name="check_circle"
            size={14}
            color="#10B981"
          />
          <Text style={[styles.statusBadgeText, { color: '#10B981' }]}>
            Last updated {timeText}
          </Text>
        </View>
      );
    }

    return null;
  };

  const cards: SummaryCard[] = [
    {
      id: 'overview',
      title: 'Job Overview',
      icon: 'sparkles',
      androidIcon: 'auto_awesome',
      route: `/job-details/overview?jobId=${jobId}`,
    },
    {
      id: 'issues',
      title: 'Open Issues',
      count: job?.open_issues?.length || 0,
      icon: 'exclamationmark.triangle',
      androidIcon: 'warning',
      route: `/job-details/issues?jobId=${jobId}`,
      color: '#F59E0B',
    },
    {
      id: 'questions',
      title: 'Unanswered Questions',
      count: job?.unanswered_questions?.length || 0,
      icon: 'questionmark.circle',
      androidIcon: 'help',
      route: `/job-details/questions?jobId=${jobId}`,
      color: '#3B82F6',
    },
    {
      id: 'actions',
      title: 'Next Actions',
      count: job?.next_actions?.length || 0,
      icon: 'checkmark.circle',
      androidIcon: 'check_circle',
      route: `/job-details/actions?jobId=${jobId}`,
      color: '#10B981',
    },
    {
      id: 'completed',
      title: 'Completed Items',
      count: job?.completed_items?.length || 0,
      icon: 'checkmark.seal',
      androidIcon: 'verified',
      route: `/job-details/completed?jobId=${jobId}`,
      color: '#6B7280',
    },
    {
      id: 'warnings',
      title: 'Warnings & Risks',
      count: job?.warnings_and_risks?.length || 0,
      icon: 'exclamationmark.shield',
      androidIcon: 'shield',
      route: `/job-details/warnings?jobId=${jobId}`,
      color: '#EF4444',
    },
    {
      id: 'deadlines',
      title: 'Deadlines & Timelines',
      count: job?.deadlines_and_timelines?.length || 0,
      icon: 'clock',
      androidIcon: 'schedule',
      route: `/job-details/deadlines?jobId=${jobId}`,
      color: '#8B5CF6',
    },
    {
      id: 'dependencies',
      title: 'Dependencies',
      count: job?.dependencies?.length || 0,
      icon: 'link',
      androidIcon: 'link',
      route: `/job-details/dependencies?jobId=${jobId}`,
      color: '#06B6D4',
    },
    {
      id: 'changelog',
      title: 'Change Log',
      count: job?.ai_changelog?.length || 0,
      icon: 'list.bullet.rectangle',
      androidIcon: 'history',
      route: `/job-details/changelog?jobId=${jobId}`,
      color: '#64748B',
    },
  ];

  const handleCardPress = (card: SummaryCard) => {
    console.log('Card pressed:', card.title);
    console.log('Navigating to:', card.route);
    try {
      router.push(card.route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
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
          AI-Powered Job Summary
        </Text>
      </View>

      {/* Processing Status Badge */}
      {getProcessingStatusBadge()}

      {/* Manual Process Button */}
      {job?.processing_status !== 'running' && (
        <TouchableOpacity
          style={[styles.processButton, { backgroundColor: theme.colors.primary, opacity: processingManually ? 0.6 : 1 }]}
          onPress={handleManualProcess}
          disabled={processingManually}
        >
          {processingManually ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol
              ios_icon_name="arrow.clockwise"
              android_material_icon_name="refresh"
              size={18}
              color="#fff"
            />
          )}
          <Text style={styles.processButtonText}>
            {processingManually ? 'Processing...' : 'Process Chat Now'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Debug Info (only show if no overview) */}
      {!job?.job_overview && (
        <View style={[styles.debugCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.debugTitle, { color: theme.colors.text }]}>Debug Info</Text>
          <Text style={[styles.debugText, { color: theme.colors.text }]}>
            Status: {job?.processing_status || 'unknown'}
          </Text>
          <Text style={[styles.debugText, { color: theme.colors.text }]}>
            Last processed: {job?.last_processed_at ? new Date(job.last_processed_at).toLocaleString() : 'Never'}
          </Text>
          <Text style={[styles.debugText, { color: theme.colors.text }]}>
            Overview: {job?.job_overview === null ? 'null' : job?.job_overview === '' ? 'empty string' : 'has content'}
          </Text>
        </View>
      )}

      {cards.map((card, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleCardPress(card)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: (card.color || theme.colors.primary) + '20' }]}>
              <IconSymbol
                ios_icon_name={card.icon}
                android_material_icon_name={card.androidIcon}
                size={24}
                color={card.color || theme.colors.primary}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {card.title}
              </Text>
              {card.count !== undefined && (
                <Text style={[styles.cardCount, { color: card.color || theme.colors.primary }]}>
                  {card.count} {card.count === 1 ? 'item' : 'items'}
                </Text>
              )}
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.colors.text}
              style={{ opacity: 0.3 }}
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
    marginBottom: 12,
    gap: 6,
  },
  aiLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    gap: 8,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  processButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  processButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  debugCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});
