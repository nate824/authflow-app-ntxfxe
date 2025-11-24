
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

interface Dependency {
  id: string;
  dependent: string;
  dependsOn: string;
  status: 'blocked' | 'waiting' | 'ready';
}

export default function DependenciesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();

  const dependencies: Dependency[] = [
    {
      id: '1',
      dependent: 'Rope access climb',
      dependsOn: 'Scaffold QA',
      status: 'blocked',
    },
    {
      id: '2',
      dependent: 'Weld inspection',
      dependsOn: 'Mechanical clearance',
      status: 'waiting',
    },
    {
      id: '3',
      dependent: 'Tank B access',
      dependsOn: 'Electrical conduit clearance',
      status: 'blocked',
    },
    {
      id: '4',
      dependent: 'Final NDT report',
      dependsOn: 'All weld inspections complete',
      status: 'waiting',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'blocked':
        return '#EF4444';
      case 'waiting':
        return '#F59E0B';
      case 'ready':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'blocked':
        return 'Blocked';
      case 'waiting':
        return 'Waiting';
      case 'ready':
        return 'Ready';
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dependencies</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {dependencies.map((dependency, index) => (
          <View
            key={index}
            style={[styles.dependencyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          >
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dependency.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(dependency.status) }]}>
                  {getStatusLabel(dependency.status)}
                </Text>
              </View>
            </View>
            <View style={styles.dependencyContent}>
              <Text style={[styles.dependentText, { color: theme.colors.text }]}>
                {dependency.dependent}
              </Text>
              <View style={styles.arrowContainer}>
                <IconSymbol
                  ios_icon_name="arrow.down"
                  android_material_icon_name="arrow_downward"
                  size={20}
                  color={theme.colors.text}
                  style={{ opacity: 0.4 }}
                />
              </View>
              <View style={styles.dependsOnContainer}>
                <Text style={[styles.dependsOnLabel, { color: theme.colors.text }]}>
                  Depends on:
                </Text>
                <Text style={[styles.dependsOnText, { color: theme.colors.text }]}>
                  {dependency.dependsOn}
                </Text>
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
  dependencyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  dependencyContent: {
    gap: 8,
  },
  dependentText: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  arrowContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dependsOnContainer: {
    gap: 4,
  },
  dependsOnLabel: {
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.5,
    textTransform: 'uppercase',
  },
  dependsOnText: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
});
