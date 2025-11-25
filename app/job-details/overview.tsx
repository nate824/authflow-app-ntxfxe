
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

interface Job {
  id: string;
  job_name: string;
  job_overview: string | null;
  last_processed_at: string | null;
  processing_status: string;
  open_issues: any[];
  unanswered_questions: any[];
  next_actions: any[];
  warnings_and_risks: any[];
  dependencies: any[];
}

interface ScopeDocument {
  id: string;
  summary: string;
  file_name: string | null;
  created_at: string;
}

export default function JobOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [scopeDocument, setScopeDocument] = useState<ScopeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobOverview();
  }, [jobId]);

  const loadJobOverview = async () => {
    try {
      setLoading(true);
      
      // Load job data
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('id, job_name, job_overview, last_processed_at, processing_status, open_issues, unanswered_questions, next_actions, warnings_and_risks, dependencies')
        .eq('id', jobId)
        .single();

      if (jobError) {
        console.error('Error loading job overview:', jobError);
      } else {
        console.log('Job overview loaded:', jobData);
        setJob(jobData);

        // If job_overview is empty, try to load the most recent scope document
        if (!jobData.job_overview || jobData.job_overview.trim() === '') {
          console.log('Job overview is empty, loading scope document...');
          const { data: scopeData, error: scopeError } = await supabase
            .from('scope_documents')
            .select('id, summary, file_name, created_at')
            .eq('job_id', jobId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (scopeError) {
            console.error('Error loading scope document:', scopeError);
          } else if (scopeData) {
            console.log('Scope document loaded:', scopeData);
            setScopeDocument(scopeData);
          }
        }
      }
    } catch (error) {
      console.error('Exception loading job overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadJobOverview();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#3B82F6';
      case 'scheduled':
        return '#F59E0B';
      case 'completed':
        return '#10B981';
      case 'failed':
        return '#EF4444';
      default:
        return '#10B981';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Processing...';
      case 'scheduled':
        return 'Processing scheduled';
      case 'completed':
        return 'Recently updated';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Up to date';
    }
  };

  // Determine which overview to display
  const overviewText = job?.job_overview || scopeDocument?.summary || null;
  const overviewSource = job?.job_overview ? 'job' : scopeDocument ? 'scope' : null;

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Job Overview</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading overview...</Text>
        </View>
      ) : job ? (
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
          {/* Status Badge */}
          {job.processing_status !== 'idle' && (
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.processing_status) + '20', borderColor: getStatusColor(job.processing_status) }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(job.processing_status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(job.processing_status) }]}>
                {getStatusText(job.processing_status)}
              </Text>
            </View>
          )}

          {/* AI-Generated Overview */}
          {overviewText ? (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.iconHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto_awesome"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
              </View>
              
              <View style={[styles.aiLabel, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                <IconSymbol
                  ios_icon_name="sparkles"
                  android_material_icon_name="auto_awesome"
                  size={14}
                  color={theme.colors.primary}
                />
                <Text style={[styles.aiLabelText, { color: theme.colors.primary }]}>
                  {overviewSource === 'scope' ? 'Scope Document Summary' : 'AI-Generated Summary'}
                </Text>
              </View>

              <Text style={[styles.overviewText, { color: theme.colors.text }]}>
                {overviewText}
              </Text>

              {/* Quick Stats */}
              <View style={[styles.statsContainer, { borderTopColor: theme.colors.border }]}>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#F59E0B' }]}>
                      {job.open_issues?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Open Issues
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#3B82F6' }]}>
                      {job.unanswered_questions?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Questions
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#10B981' }]}>
                      {job.next_actions?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Actions
                    </Text>
                  </View>
                </View>
                <View style={styles.statRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#EF4444' }]}>
                      {job.warnings_and_risks?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Risks
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: '#06B6D4' }]}>
                      {job.dependencies?.length || 0}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text }]}>
                      Dependencies
                    </Text>
                  </View>
                  <View style={styles.stat} />
                </View>
              </View>

              {/* Footer with timestamp */}
              <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
                {overviewSource === 'scope' && scopeDocument ? (
                  <React.Fragment>
                    <Text style={[styles.footerText, { color: theme.colors.text }]}>
                      From scope document: {scopeDocument.file_name || 'Manual entry'}
                    </Text>
                    <Text style={[styles.footerText, { color: theme.colors.text, marginTop: 4 }]}>
                      Uploaded: {new Date(scopeDocument.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </React.Fragment>
                ) : job.last_processed_at ? (
                  <Text style={[styles.footerText, { color: theme.colors.text }]}>
                    Last updated: {new Date(job.last_processed_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.emptyContainer}>
                <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
                  <IconSymbol
                    ios_icon_name="doc.text"
                    android_material_icon_name="description"
                    size={48}
                    color={theme.colors.text}
                    style={{ opacity: 0.3 }}
                  />
                </View>
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  No Overview Yet
                </Text>
                <Text style={[styles.emptyText, { color: theme.colors.text }]}>
                  Upload a scope document to get started. Long press on the job card and select &quot;Add Scope Document&quot; to begin.
                </Text>
                <Text style={[styles.emptyHint, { color: theme.colors.text }]}>
                  Pull down to refresh
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Job not found</Text>
        </View>
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
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  iconHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
  },
  statsContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
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
    paddingHorizontal: 20,
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.4,
    marginTop: 8,
  },
});
