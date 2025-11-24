
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Dependency {
  id: string;
  dependent_task: string;
  depends_on_task: string;
  status: 'blocked' | 'waiting' | 'ready' | 'completed';
}

export default function DependenciesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDependencies();
  }, [jobId]);

  const fetchDependencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dependencies')
        .select('*')
        .eq('job_id', jobId)
        .neq('status', 'completed')
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching dependencies:', error);
      } else {
        setDependencies(data || []);
      }
    } catch (error) {
      console.error('Error fetching dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dependencies</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dependencies</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {dependencies.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol ios_icon_name="link" android_material_icon_name="link" size={64} color={theme.colors.text} style={{ opacity: 0.3 }} />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>No dependencies</Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>Task dependencies will appear here</Text>
          </View>
        ) : (
          dependencies.map((dependency, index) => (
            <View key={index} style={[styles.dependencyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(dependency.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(dependency.status) }]}>
                    {getStatusLabel(dependency.status)}
                  </Text>
                </View>
              </View>
              <View style={styles.dependencyContent}>
                <Text style={[styles.dependentText, { color: theme.colors.text }]}>{dependency.dependent_task}</Text>
                <View style={styles.arrowContainer}>
                  <IconSymbol ios_icon_name="arrow.down" android_material_icon_name="arrow_downward" size={20} color={theme.colors.text} style={{ opacity: 0.4 }} />
                </View>
                <View style={styles.dependsOnContainer}>
                  <Text style={[styles.dependsOnLabel, { color: theme.colors.text }]}>Depends on:</Text>
                  <Text style={[styles.dependsOnText, { color: theme.colors.text }]}>{dependency.depends_on_task}</Text>
                </View>
              </View>
            </View>
          ))
        )}
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
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    opacity: 0.7,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.5,
    textAlign: 'center',
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
