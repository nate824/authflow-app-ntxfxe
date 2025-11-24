
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

interface Action {
  id: string;
  text: string;
  assignedTo: string;
  priority: 'high' | 'medium' | 'low';
}

export default function NextActionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const actions: Action[] = [
    {
      id: '1',
      text: 'Electrician to clear conduit from tank B.',
      assignedTo: 'Rogers',
      priority: 'high',
    },
    {
      id: '2',
      text: 'Safety to approve rope team anchors.',
      assignedTo: 'Martinez',
      priority: 'high',
    },
    {
      id: '3',
      text: 'Scaffold QA at 2 PM.',
      assignedTo: 'Chen',
      priority: 'medium',
    },
    {
      id: '4',
      text: 'Submit updated NDT report.',
      assignedTo: 'Davis',
      priority: 'medium',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Next Actions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {actions.map((action, index) => (
          <View
            key={index}
            style={[styles.actionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.actionHeader}>
              <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(action.priority) }]} />
              <View style={styles.actionContent}>
                <Text style={[styles.actionText, { color: theme.colors.text }]}>
                  {action.text}
                </Text>
                <View style={styles.assignedRow}>
                  <IconSymbol
                    ios_icon_name="person.circle"
                    android_material_icon_name="account_circle"
                    size={14}
                    color={theme.colors.text}
                    style={{ opacity: 0.6 }}
                  />
                  <Text style={[styles.assignedText, { color: theme.colors.text }]}>
                    {action.assignedTo}
                  </Text>
                </View>
              </View>
            </View>
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
  actionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  priorityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
  },
  actionContent: {
    flex: 1,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assignedText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
});
