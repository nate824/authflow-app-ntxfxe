
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

interface Deadline {
  id: string;
  title: string;
  deadline_time: string;
}

export default function DeadlinesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeadlines();
  }, [jobId]);

  const fetchDeadlines = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deadlines')
        .select('*')
        .eq('job_id', jobId)
        .eq('completed', false)
        .order('deadline_time', { ascending: true });

      if (error) {
        console.error('Error fetching deadlines:', error);
      } else {
        setDeadlines(data || []);
      }
    } catch (error) {
      console.error('Error fetching deadlines:', error);
    } finally {
      setLoading(false);
    }
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

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Deadlines & Timelines</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Deadlines & Timelines</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {deadlines.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="calendar" android_material_icon_name="event" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No upcoming deadlines</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>Deadlines will appear here</Text>
          </View>
        ) : (
          deadlines.map((deadline, index) => {
            const typeInfo = getTypeInfo(deadline.deadline_time);
            return (
              <View key={index} style={[styles.deadlineCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <View style={styles.deadlineHeader}>
                  <View style={[styles.typeTag, { backgroundColor: typeInfo.color + '20' }]}>
                    <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                  </View>
                  <View style={styles.timeContainer}>
                    <IconSymbol ios_icon_name="clock" android_material_icon_name="schedule" size={16} color={theme.colors.text} style={{ opacity: 0.6 }} />
                    <Text style={[styles.timeText, { color: theme.colors.text }]}>{formatTime(deadline.deadline_time)}</Text>
                  </View>
                </View>
                <Text style={[styles.deadlineTitle, { color: theme.colors.text }]}>{deadline.title}</Text>
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
  deadlineCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  },
  deadlineTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
});
