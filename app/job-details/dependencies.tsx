
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Dependency {
  id: string;
  title: string;
  description: string;
  created_at: string;
  message_id?: string;
}

interface Job {
  id: string;
  job_name: string;
  dependencies: Dependency[];
}

export default function DependenciesScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDependencies();
  }, [jobId]);

  const loadDependencies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_name, dependencies')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading dependencies:', error);
      } else {
        console.log('Dependencies loaded:', data);
        setJob(data);
      }
    } catch (error) {
      console.error('Exception loading dependencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDependencies();
    setRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const dependencies = job?.dependencies || [];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Dependencies</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading dependencies...</Text>
        </View>
      ) : dependencies.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* AI Label */}
          <View style={[styles.aiLabel, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
            <IconSymbol
              ios_icon_name="sparkles"
              android_material_icon_name="auto_awesome"
              size={14}
              color={theme.colors.primary}
            />
            <Text style={[styles.aiLabelText, { color: theme.colors.primary }]}>
              AI-Detected Dependencies
            </Text>
          </View>

          {dependencies.map((dependency, index) => (
            <View 
              key={index} 
              style={[styles.dependencyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            >
              <View style={styles.dependencyHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF620' }]}>
                  <IconSymbol 
                    ios_icon_name="link" 
                    android_material_icon_name="link" 
                    size={20} 
                    color="#8B5CF6" 
                  />
                </View>
                <View style={styles.dependencyContent}>
                  <Text style={[styles.dependencyTitle, { color: theme.colors.text }]}>{dependency.title}</Text>
                  {dependency.description && (
                    <Text style={[styles.dependencyDescription, { color: theme.colors.text }]}>{dependency.description}</Text>
                  )}
                  <Text style={[styles.dependencyDate, { color: theme.colors.text }]}>
                    Added: {formatTime(dependency.created_at)}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: '#8B5CF610' }]}>
              <IconSymbol 
                ios_icon_name="link" 
                android_material_icon_name="link" 
                size={48} 
                color="#8B5CF6" 
                style={{ opacity: 0.5 }} 
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Dependencies
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              Task dependencies detected by the AI will appear here.
            </Text>
            <Text style={[styles.emptyHint, { color: theme.colors.text }]}>
              Pull down to refresh
            </Text>
          </View>
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  aiLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 6,
  },
  aiLabelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyScrollContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
    minHeight: 400,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 22,
  },
  emptyHint: {
    fontSize: 13,
    opacity: 0.4,
    marginTop: 8,
  },
  dependencyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  dependencyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dependencyContent: {
    flex: 1,
    gap: 4,
  },
  dependencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  dependencyDescription: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  dependencyDate: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 4,
  },
});
