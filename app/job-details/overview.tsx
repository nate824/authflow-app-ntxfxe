
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

export default function JobOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const overviewText = `This is a comprehensive industrial maintenance project at the Riverside Refinery Complex. The scope includes:

• Complete inspection and maintenance of Tank B storage system
• Electrical conduit routing and clearance verification
• Rope access operations for high-elevation work
• Scaffold installation and quality assurance
• Non-destructive testing (NDT) of critical welds
• Safety compliance and documentation

The project is scheduled to run for 3 weeks with multiple specialized teams coordinating their efforts. All work must comply with OSHA regulations and site-specific safety protocols.

Key stakeholders include the site operations manager, safety coordinator, and various trade supervisors. Daily briefings are mandatory, and all incidents must be reported immediately.`;

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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.iconHeader}>
            <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
              <IconSymbol
                ios_icon_name="doc.text"
                android_material_icon_name="description"
                size={32}
                color={theme.colors.primary}
              />
            </View>
          </View>
          <Text style={[styles.overviewText, { color: theme.colors.text }]}>
            {overviewText}
          </Text>
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
  iconHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
  },
});
