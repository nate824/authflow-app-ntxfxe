
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

interface Deadline {
  id: string;
  title: string;
  description: string;
  deadline: string;
  updated_at: string;
  message_id?: string;
}

interface Job {
  id: string;
  job_name: string;
  deadlines_and_timelines: Deadline[];
}

export default function DeadlinesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDeadlines();
  }, [jobId]);

  const loadDeadlines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_name, deadlines_and_timelines')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading deadlines:', error);
      } else {
        console.log('Deadlines loaded:', data);
        setJob(data);
      }
    } catch (error) {
      console.error('Exception loading deadlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDeadlines();
    setRefreshing(false);
  };

  const getTypeInfo = (deadlineTime: string) => {
    const deadline = new Date(deadlineTime);
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 0) {
      return { type: 'overdue', label: 'Overdue', color: '#EF4444' };
    } else if (diffHours < 24) {
      return { type: 'today', label: 'Today', color: '#EF4444' };
    } else if (diffDays === 1) {
      return { type: 'tomorrow', label: 'Tomorrow', color: '#F59E0B' };
    } else {
      return { type: 'upcoming', label: 'Upcoming', color: '#10B981' };
    }
  };

  const formatDeadline = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const deadlines = job?.deadlines_and_timelines || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Deadlines & Timelines</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading deadlines...</Text>
        </View>
      ) : deadlines.length > 0 ? (
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
              AI-Detected Deadlines & Timelines
            </Text>
          </View>

          {deadlines.map((deadline, index) => {
            const typeInfo = getTypeInfo(deadline.deadline);
            return (
              <View 
                key={index} 
                style={[
                  styles.deadlineCard, 
                  { backgroundColor: theme.colors.card, borderColor: typeInfo.color }
                ]}
              >
                <View style={styles.deadlineHeader}>
                  <View style={[styles.typeTag, { backgroundColor: typeInfo.color + '20' }]}>
                    <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <IconSymbol 
                      ios_icon_name="clock" 
                      android_material_icon_name="schedule" 
                      size={16} 
                      color={theme.colors.text} 
                      style={{ opacity: 0.6 }} 
                    />
                    <Text style={[styles.timeText, { color: theme.colors.text }]}>
                      {formatDeadline(deadline.deadline)}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.deadlineTitle, { color: theme.colors.text }]}>{deadline.title}</Text>
                {deadline.description && (
                  <Text style={[styles.deadlineDescription, { color: theme.colors.text }]}>{deadline.description}</Text>
                )}
              </View>
            );
          })}
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
            <View style={[styles.emptyIconContainer, { backgroundColor: '#3B82F610' }]}>
              <IconSymbol 
                ios_icon_name="calendar" 
                android_material_icon_name="event" 
                size={48} 
                color="#3B82F6" 
                style={{ opacity: 0.5 }} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Upcoming Deadlines
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              Deadlines detected by the AI will appear here.
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
  deadlineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  deadlineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.7,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: 4,
  },
  deadlineDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
});
