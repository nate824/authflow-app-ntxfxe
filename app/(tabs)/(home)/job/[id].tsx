
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@react-navigation/native';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import ChatTab from '@/components/job/ChatTab';
import SummaryTab from '@/components/job/SummaryTab';

interface Job {
  id: string;
  job_name: string;
  site_name: string;
  start_date: string;
}

export default function JobRoomScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'summary'>('chat');

  useEffect(() => {
    loadJob();
  }, [id]);

  const loadJob = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error loading job:', error);
      } else {
        console.log('Job loaded:', data);
        setJob(data);
      }
    } catch (error) {
      console.error('Exception loading job:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading job...</Text>
        </View>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>Job not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => router.back()}
        >
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.jobName, { color: theme.colors.text }]} numberOfLines={1}>
            {job.job_name}
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'chat' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('chat')}
        >
          <IconSymbol
            ios_icon_name="message"
            android_material_icon_name="chat"
            size={20}
            color={activeTab === 'chat' ? theme.colors.primary : theme.colors.text}
            style={{ opacity: activeTab === 'chat' ? 1 : 0.5 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'chat' ? theme.colors.primary : theme.colors.text },
              activeTab !== 'chat' && { opacity: 0.5 }
            ]}
          >
            Chat
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'summary' && { borderBottomColor: theme.colors.primary }
          ]}
          onPress={() => setActiveTab('summary')}
        >
          <IconSymbol
            ios_icon_name="list.bullet.clipboard"
            android_material_icon_name="dashboard"
            size={20}
            color={activeTab === 'summary' ? theme.colors.primary : theme.colors.text}
            style={{ opacity: activeTab === 'summary' ? 1 : 0.5 }}
          />
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'summary' ? theme.colors.primary : theme.colors.text },
              activeTab !== 'summary' && { opacity: 0.5 }
            ]}
          >
            Summary
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'chat' ? (
          <ChatTab jobId={job.id} />
        ) : (
          <SummaryTab jobId={job.id} />
        )}
      </View>
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
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  headerSpacer: {
    width: 40,
  },
  jobName: {
    fontSize: 18,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
