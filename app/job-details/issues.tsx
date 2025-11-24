
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

interface Issue {
  id: string;
  issue_number: number;
  title: string;
  assigned_to: string | null;
  status: string;
  updated_at: string;
  user_profiles?: {
    display_name: string;
    role: string;
  };
}

export default function OpenIssuesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIssues();
  }, [jobId]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          user_profiles!issues_assigned_to_fkey(display_name, role)
        `)
        .eq('job_id', jobId)
        .eq('status', 'open')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching issues:', error);
      } else {
        setIssues(data || []);
      }
    } catch (error) {
      console.error('Error fetching issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePress = (issue: Issue) => {
    console.log('Opening issue:', issue);
    router.push(`/job-details/issue-detail?issueId=${issue.id}&issueNumber=${issue.issue_number}` as any);
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
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
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
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Open Issues</Text>
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Open Issues</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {issues.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check_circle" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No open issues</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>All issues have been resolved</Text>
          </View>
        ) : (
          issues.map((issue, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.issueCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => handleIssuePress(issue)}
              activeOpacity={0.7}
            >
              <View style={styles.issueHeader}>
                <View style={[styles.issueNumber, { backgroundColor: '#F59E0B20' }]}>
                  <Text style={[styles.issueNumberText, { color: '#F59E0B' }]}>#{issue.issue_number}</Text>
                </View>
                <IconSymbol ios_icon_name="chevron.right" android_material_icon_name="chevron_right" size={20} color={theme.colors.text} style={{ opacity: 0.3 }} />
              </View>
              <Text style={[styles.issueTitle, { color: theme.colors.text }]}>{issue.title}</Text>
              <View style={styles.issueFooter}>
                <View style={styles.assignedInfo}>
                  <IconSymbol ios_icon_name="person.circle" android_material_icon_name="account_circle" size={16} color={theme.colors.text} style={{ opacity: 0.6 }} />
                  <Text style={[styles.assignedText, { color: theme.colors.text }]}>
                    {issue.user_profiles?.display_name || 'Unassigned'} {issue.user_profiles?.role ? `(${issue.user_profiles.role})` : ''}
                  </Text>
                </View>
                <Text style={[styles.updateTime, { color: theme.colors.text }]}>{formatTime(issue.updated_at)}</Text>
              </View>
            </TouchableOpacity>
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
  issueCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  issueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  issueNumber: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  issueNumberText: {
    fontSize: 14,
    fontWeight: '700',
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  issueFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignedText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  updateTime: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
});
