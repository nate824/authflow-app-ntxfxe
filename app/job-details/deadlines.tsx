
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

interface Deadline {
  id: string;
  time: string;
  title: string;
  type: 'today' | 'tomorrow' | 'upcoming';
}

export default function DeadlinesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const deadlines: Deadline[] = [
    {
      id: '1',
      time: '2 PM',
      title: 'Scaffold QA',
      type: 'today',
    },
    {
      id: '2',
      time: '4 PM',
      title: 'NDT report submission',
      type: 'today',
    },
    {
      id: '3',
      time: '8 AM',
      title: 'Rope access briefing',
      type: 'tomorrow',
    },
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'today':
        return '#EF4444';
      case 'tomorrow':
        return '#F59E0B';
      case 'upcoming':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'today':
        return 'Today';
      case 'tomorrow':
        return 'Tomorrow';
      case 'upcoming':
        return 'Upcoming';
      default:
        return '';
    }
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Deadlines & Timelines</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {deadlines.map((deadline, index) => (
          <View
            key={index}
            style={[styles.deadlineCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.deadlineHeader}>
              <View style={[styles.typeTag, { backgroundColor: getTypeColor(deadline.type) + '20' }]}>
                <Text style={[styles.typeText, { color: getTypeColor(deadline.type) }]}>
                  {getTypeLabel(deadline.type)}
                </Text>
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
                  {deadline.time}
                </Text>
              </View>
            </View>
            <Text style={[styles.deadlineTitle, { color: theme.colors.text }]}>
              {deadline.title}
            </Text>
          </View>
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
