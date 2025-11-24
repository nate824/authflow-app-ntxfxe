
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

interface ScopeDocument {
  id: string;
  job_id: string;
  raw_content: string;
  summary: string;
  file_name: string | null;
  created_at: string;
}

export default function JobOverviewScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [scopeDoc, setScopeDoc] = useState<ScopeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadScopeDocument();
  }, [jobId]);

  const loadScopeDocument = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scope_documents')
        .select('*')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No scope document found for this job');
          setScopeDoc(null);
        } else {
          console.error('Error loading scope document:', error);
        }
      } else {
        console.log('Scope document loaded:', data);
        setScopeDoc(data);
      }
    } catch (error) {
      console.error('Exception loading scope document:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadScopeDocument();
    setRefreshing(false);
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
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Job Overview</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading overview...</Text>
        </View>
      ) : scopeDoc ? (
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
            
            {scopeDoc.file_name && (
              <View style={[styles.fileInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <IconSymbol
                  ios_icon_name="doc"
                  android_material_icon_name="description"
                  size={16}
                  color={theme.colors.text}
                  style={{ opacity: 0.6 }}
                />
                <Text style={[styles.fileInfoText, { color: theme.colors.text }]}>
                  Source: {scopeDoc.file_name}
                </Text>
              </View>
            )}

            <Text style={[styles.overviewText, { color: theme.colors.text }]}>
              {scopeDoc.summary}
            </Text>

            <View style={[styles.footer, { borderTopColor: theme.colors.border }]}>
              <Text style={[styles.footerText, { color: theme.colors.text }]}>
                Last updated: {new Date(scopeDoc.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          </View>
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
            <View style={[styles.emptyIconContainer, { backgroundColor: theme.colors.primary + '10' }]}>
              <IconSymbol
                ios_icon_name="doc.text.magnifyingglass"
                android_material_icon_name="description"
                size={48}
                color={theme.colors.text}
                style={{ opacity: 0.3 }}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
              No Scope Document
            </Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>
              No scope document has been uploaded for this job yet. An admin can add a scope document from the job menu.
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
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
  },
  fileInfoText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.7,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
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
});
