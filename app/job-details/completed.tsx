
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

interface CompletedItem {
  id: string;
  text: string;
  completedBy: string;
  completedAt: string;
}

export default function CompletedItemsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const items: CompletedItem[] = [
    {
      id: '1',
      text: 'Radiography on welds 8–13 completed.',
      completedBy: 'Davis',
      completedAt: 'Today 11:00 AM',
    },
    {
      id: '2',
      text: 'Safety briefing filed.',
      completedBy: 'Martinez',
      completedAt: 'Today 8:30 AM',
    },
    {
      id: '3',
      text: 'Scaffold platform alignment verified.',
      completedBy: 'Chen',
      completedAt: 'Yesterday 4:15 PM',
    },
    {
      id: '4',
      text: 'Tank B pressure test passed.',
      completedBy: 'Johnson',
      completedAt: 'Yesterday 2:30 PM',
    },
    {
      id: '5',
      text: 'Rope access equipment inspection.',
      completedBy: 'Thompson',
      completedAt: 'Yesterday 10:00 AM',
    },
  ];

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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Completed Items</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {items.map((item, index) => (
          <View
            key={index}
            style={[styles.itemCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.itemHeader}>
              <View style={[styles.checkIcon, { backgroundColor: '#10B98120' }]}>
                <IconSymbol
                  ios_icon_name="checkmark.circle.fill"
                  android_material_icon_name="check_circle"
                  size={24}
                  color="#10B981"
                />
              </View>
              <View style={styles.itemContent}>
                <Text style={[styles.itemText, { color: theme.colors.text }]}>
                  {item.text}
                </Text>
                <View style={styles.itemFooter}>
                  <Text style={[styles.completedBy, { color: theme.colors.text }]}>
                    {item.completedBy}
                  </Text>
                  <Text style={[styles.completedAt, { color: theme.colors.text }]}>
                    {item.completedAt}
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
  itemCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  completedBy: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  completedAt: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.5,
  },
});
