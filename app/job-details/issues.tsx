
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

interface Issue {
  id: string;
  number: number;
  title: string;
  assignedTo: string;
  role: string;
  lastUpdate: string;
}

export default function OpenIssuesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const issues: Issue[] = [
    {
      id: '1',
      number: 17,
      title: 'Electrical conduit blocking tank B access',
      assignedTo: 'Rogers',
      role: 'Electrician',
      lastUpdate: '11:42 AM',
    },
    {
      id: '2',
      number: 15,
      title: 'Scaffold platform misaligned on west side',
      assignedTo: 'Chen',
      role: 'Scaffold Lead',
      lastUpdate: '10:15 AM',
    },
    {
      id: '3',
      number: 14,
      title: 'Missing safety harness inspection tags',
      assignedTo: 'Martinez',
      role: 'Safety Officer',
      lastUpdate: '9:30 AM',
    },
    {
      id: '4',
      number: 12,
      title: 'Weld prep incomplete on section 8',
      assignedTo: 'Johnson',
      role: 'Welder',
      lastUpdate: 'Yesterday',
    },
    {
      id: '5',
      number: 11,
      title: 'NDT equipment calibration expired',
      assignedTo: 'Davis',
      role: 'NDT Tech',
      lastUpdate: 'Yesterday',
    },
    {
      id: '6',
      number: 9,
      title: 'Rope access anchor points need re-certification',
      assignedTo: 'Thompson',
      role: 'Rope Access',
      lastUpdate: '2 days ago',
    },
  ];

  const handleIssuePress = (issue: Issue) => {
    console.log('Opening issue:', issue);
    router.push(`/job-details/issue-detail?issueId=${issue.id}&issueNumber=${issue.number}` as any);
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Open Issues</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {issues.map((issue, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.issueCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => handleIssuePress(issue)}
            activeOpacity={0.7}
          >
            <View style={styles.issueHeader}>
              <View style={[styles.issueNumber, { backgroundColor: '#F59E0B20' }]}>
                <Text style={[styles.issueNumberText, { color: '#F59E0B' }]}>
                  #{issue.number}
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
            <Text style={[styles.issueTitle, { color: theme.colors.text }]}>
              {issue.title}
            </Text>
            <View style={styles.issueFooter}>
              <View style={styles.assignedInfo}>
                <IconSymbol
                  ios_icon_name="person.circle"
                  android_material_icon_name="account_circle"
                  size={16}
                  color={theme.colors.text}
                  style={{ opacity: 0.6 }}
                />
                <Text style={[styles.assignedText, { color: theme.colors.text }]}>
                  {issue.assignedTo} ({issue.role})
                </Text>
              </View>
              <Text style={[styles.updateTime, { color: theme.colors.text }]}>
                {issue.lastUpdate}
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
