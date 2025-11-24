
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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
}

export default function SummaryTab({ jobId }: SummaryTabProps) {
  const theme = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
        .select('open_issues, unanswered_questions, next_actions, completed_items, warnings_and_risks, deadlines_and_timelines, dependencies, ai_changelog')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job data:', error);
      } else {
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
    marginBottom: 16,
    gap: 6,
  },
  aiLabelText: {
    fontSize: 12,
    fontWeight: '600',
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
