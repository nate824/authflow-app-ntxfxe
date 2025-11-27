
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

interface Question {
  id: string;
  question: string;
  asked_at: string;
  message_id?: string;
}

interface ResolvedQuestion {
  id: string;
  question: string;
  answer: string;
  asked_at: string;
  answered_at: string;
  message_id?: string;
}

interface Job {
  id: string;
  job_name: string;
  unanswered_questions: Question[];
  resolved_questions: ResolvedQuestion[];
}

export default function QuestionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_name, unanswered_questions, resolved_questions')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading questions:', error);
      } else {
        console.log('Questions loaded:', data);
        setJob(data);
      }
    } catch (error) {
      console.error('Exception loading questions:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadQuestions();
    setRefreshing(false);
  };

  const handleQuestionPress = (question: Question | ResolvedQuestion) => {
    router.push(`/job-details/question-detail?jobId=${jobId}&questionId=${question.id}` as any);
  };

  const questions = showResolved ? (job?.resolved_questions || []) : (job?.unanswered_questions || []);

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Questions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Toggle */}
      <View style={[styles.toggleContainer, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !showResolved && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => setShowResolved(false)}
        >
          <Text style={[
            styles.toggleText,
            { color: !showResolved ? theme.colors.primary : theme.colors.text },
            showResolved && { opacity: 0.5 }
          ]}>
            Unanswered ({job?.unanswered_questions?.length || 0})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            showResolved && { backgroundColor: theme.colors.primary + '20' }
          ]}
          onPress={() => setShowResolved(true)}
        >
          <Text style={[
            styles.toggleText,
            { color: showResolved ? theme.colors.primary : theme.colors.text },
            !showResolved && { opacity: 0.5 }
          ]}>
            Resolved ({job?.resolved_questions?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading questions...</Text>
        </View>
      ) : questions.length > 0 ? (
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
              AI-Detected Questions
            </Text>
          </View>

          {questions.map((question, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => handleQuestionPress(question)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                  <IconSymbol
                    ios_icon_name={showResolved ? 'checkmark.circle' : 'questionmark.circle'}
                    android_material_icon_name={showResolved ? 'check_circle' : 'help'}
                    size={20}
                    color={showResolved ? '#10B981' : '#3B82F6'}
                  />
                </View>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>
                    {question.question}
                  </Text>
                  {showResolved && 'answer' in question && (
                    <Text style={[styles.cardDescription, { color: theme.colors.text }]} numberOfLines={2}>
                      {question.answer}
                    </Text>
                  )}
                  <Text style={[styles.cardDate, { color: theme.colors.text }]}>
                    {new Date(showResolved && 'answered_at' in question ? question.answered_at : question.asked_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
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
                ios_icon_name={showResolved ? 'checkmark.circle' : 'questionmark.circle'}
                android_material_icon_name={showResolved ? 'check_circle' : 'help'}
                size={48}
                color="#3B82F6"
                style={{ opacity: 0.5 }}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              {showResolved ? 'No Resolved Questions' : 'No Unanswered Questions'}
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              {showResolved 
                ? 'No questions have been answered yet.'
                : 'Great! The AI hasn&apos;t detected any unanswered questions from the chat messages.'}
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
  toggleContainer: {
    flexDirection: 'row',
    padding: 8,
    gap: 8,
    borderBottomWidth: 1,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
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
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  cardDate: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
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
});
