
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

export default function IssueDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { issueId, issueNumber } = useLocalSearchParams();

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Issue #{issueNumber}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20' }]}>
            <Text style={[styles.statusText, { color: '#F59E0B' }]}>Open</Text>
          </View>
          
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Electrical conduit blocking tank B access
          </Text>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Assigned To</Text>
            <View style={styles.assignedRow}>
              <IconSymbol
                ios_icon_name="person.circle.fill"
                android_material_icon_name="account_circle"
                size={24}
                color={theme.colors.primary}
              />
              <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
                Rogers (Electrician)
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Last Updated</Text>
            <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
              Today at 11:42 AM
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Description</Text>
            <Text style={[styles.description, { color: theme.colors.text }]}>
              The electrical conduit installed yesterday is blocking access to the maintenance hatch on Tank B. 
              The rope access team cannot proceed with their inspection until this is resolved. 
              The conduit needs to be rerouted approximately 2 feet to the east to provide adequate clearance.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Priority</Text>
            <View style={[styles.priorityBadge, { backgroundColor: '#EF444420' }]}>
              <Text style={[styles.priorityText, { color: '#EF4444' }]}>High</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Created</Text>
            <Text style={[styles.sectionValue, { color: theme.colors.text }]}>
              Yesterday at 3:15 PM by Sarah Chen
            </Text>
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
  title: {
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
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
