
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

interface Question {
  id: string;
  text: string;
  askedBy: string;
  timestamp: string;
}

export default function UnansweredQuestionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const questions: Question[] = [
    {
      id: '1',
      text: 'Has anchor approval been granted for south wall?',
      askedBy: 'Thompson',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      text: 'What are torque specs for valve 22?',
      askedBy: 'Johnson',
      timestamp: '4 hours ago',
    },
    {
      id: '3',
      text: 'When is scaffold QA scheduled?',
      askedBy: 'Chen',
      timestamp: 'Yesterday',
    },
  ];

  const handleQuestionPress = (question: Question) => {
    console.log('Opening question:', question);
    router.push(`/job-details/question-detail?questionId=${question.id}` as any);
  };

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Unanswered Questions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {questions.map((question, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.questionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => handleQuestionPress(question)}
            activeOpacity={0.7}
          >
            <View style={styles.questionHeader}>
              <View style={[styles.iconContainer, { backgroundColor: '#3B82F620' }]}>
                <IconSymbol
                  ios_icon_name="questionmark.circle.fill"
                  android_material_icon_name="help"
                  size={24}
                  color="#3B82F6"
                />
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={20}
                color={theme.colors.text}
                style={{ opacity: 0.3 }}
              />
            </View>
            <Text style={[styles.questionText, { color: theme.colors.text }]}>
              {question.text}
            </Text>
            <View style={styles.questionFooter}>
              <Text style={[styles.askedBy, { color: theme.colors.text }]}>
                Asked by {question.askedBy}
              </Text>
              <Text style={[styles.timestamp, { color: theme.colors.text }]}>
                {question.timestamp}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
  questionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 22,
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  askedBy: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
});
