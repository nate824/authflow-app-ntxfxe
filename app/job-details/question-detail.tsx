
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

export default function QuestionDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { questionId } = useLocalSearchParams();

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Question Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.statusBadge, { backgroundColor: '#3B82F620' }]}>
            <Text style={[styles.statusText, { color: '#3B82F6' }]}>Unanswered</Text>
          </View>
          
          <Text style={[styles.question, { color: theme.colors.text }]}>
            Has anchor approval been granted for south wall?
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Asked By</Text>
            <View style={styles.askedByRow}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account_circle"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
                Thompson (Rope Access Lead)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Asked</Text>
            <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
              Today at 9:33 AM
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Context</Text>
            <Text style={[styles.context, { color: theme.colors.text }]}>
              The rope access team needs to begin work on the south wall inspection, but they require 
              confirmation that all anchor points have been approved by the safety coordinator before 
              proceeding. This is a critical safety requirement that must be verified before any climbing operations.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Related To</Text>
            <View style={[styles.relatedBadge, { backgroundColor: theme.colors.primary + '20' }]}>
              <Text style={[styles.relatedText, { color: theme.colors.primary }]}>
                Safety Compliance
              </Text>
            </View>
          </View>
        </View>
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
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
  },
  question: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    lineHeight: 30,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  askedByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  context: {
    fontSize: 15,
    lineHeight: 22,
  },
  relatedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  relatedText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
