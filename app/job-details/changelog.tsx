
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

interface ChangeLogEntry {
  id: string;
  time: string;
  action: string;
  details: string;
  user: string;
}

export default function ChangeLogScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const entries: ChangeLogEntry[] = [
    {
      id: '1',
      time: '11:42 AM',
      action: 'Issue Updated',
      details: 'Issue #17 updated',
      user: 'Rogers',
    },
    {
      id: '2',
      time: '10:15 AM',
      action: 'Job Modified',
      details: 'Job overview modified',
      user: 'Admin',
    },
    {
      id: '3',
      time: '9:33 AM',
      action: 'Question Added',
      details: 'New question added',
      user: 'Martinez',
    },
    {
      id: '4',
      time: '8:45 AM',
      action: 'Issue Resolved',
      details: 'Issue #16 marked as complete',
      user: 'Chen',
    },
    {
      id: '5',
      time: 'Yesterday',
      action: 'Document Uploaded',
      details: 'Safety briefing document uploaded',
      user: 'Martinez',
    },
    {
      id: '6',
      time: 'Yesterday',
      action: 'User Invited',
      details: 'Thompson invited to job',
      user: 'Admin',
    },
  ];

  const getActionIcon = (action: string) => {
    if (action.includes('Issue')) {
      return { ios: 'exclamationmark.triangle', android: 'warning' };
    } else if (action.includes('Question')) {
      return { ios: 'questionmark.circle', android: 'help' };
    } else if (action.includes('Document')) {
      return { ios: 'doc', android: 'description' };
    } else if (action.includes('User')) {
      return { ios: 'person.badge.plus', android: 'person_add' };
    } else {
      return { ios: 'pencil', android: 'edit' };
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Change Log</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.map((entry, index) => {
          const icon = getActionIcon(entry.action);
          return (
            <View
              key={index}
              style={[styles.entryCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={styles.entryHeader}>
                <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
                  <IconSymbol
                    ios_icon_name={icon.ios}
                    android_material_icon_name={icon.android}
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.entryContent}>
                  <View style={styles.entryTitleRow}>
                    <Text style={[styles.actionText, { color: theme.colors.text }]}>
                      {entry.action}
                    </Text>
                    <Text style={[styles.timeText, { color: theme.colors.text }]}>
                      {entry.time}
                    </Text>
                  </View>
                  <Text style={[styles.detailsText, { color: theme.colors.text }]}>
                    {entry.details}
                  </Text>
                  <View style={styles.userRow}>
                    <IconSymbol
                      ios_icon_name="person.circle"
                      android_material_icon_name="account_circle"
                      size={14}
                      color={theme.colors.text}
                      style={{ opacity: 0.6 }}
                    />
                    <Text style={[styles.userText, { color: theme.colors.text }]}>
                      {entry.user}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })}
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
  entryCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  entryHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryContent: {
    flex: 1,
    gap: 6,
  },
  entryTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  userText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.6,
  },
});
