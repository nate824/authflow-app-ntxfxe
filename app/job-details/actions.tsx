
import React, { useEffect, useState, useCallback } from 'react';
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

interface Action {
  id: string;
  title: string;
  description: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
  message_id?: string;
}

export default function ActionsScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { jobId } = useLocalSearchParams();
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadActions = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('next_actions')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error loading actions:', error);
      } else {
        setActions(data.next_actions || []);
      }
    } catch (error) {
      console.error('Exception loading actions:', error);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    loadActions();
  }, [loadActions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadActions();
    setRefreshing(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#10B981';
      default: return '#6B7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <IconSymbol ios_icon_name="chevron.left" android_material_icon_name="arrow_back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Next Actions</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : actions.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        >
          <View style={[styles.aiLabel, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
            <IconSymbol ios_icon_name="sparkles" android_material_icon_name="auto_awesome" size={14} color={theme.colors.primary} />
            <Text style={[styles.aiLabelText, { color: theme.colors.primary }]}>AI-Detected Actions</Text>
          </View>

          {actions.map((action, index) => (
            <View key={index} style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B98120' }]}>
                  <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check_circle" size={20} color="#10B981" />
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.cardTitle, { color: theme.colors.text }]} numberOfLines={2}>{action.title}</Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(action.priority) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getPriorityColor(action.priority) }]}>{action.priority}</Text>
                    </View>
                  </View>
                  {action.description && action.description !== action.title && (
                    <Text style={[styles.cardDescription, { color: theme.colors.text }]} numberOfLines={2}>{action.description}</Text>
                  )}
                  <Text style={[styles.cardDate, { color: theme.colors.text }]}>
                    {new Date(action.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.emptyScrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
        >
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: '#10B98110' }]}>
              <IconSymbol ios_icon_name="checkmark.circle" android_material_icon_name="check_circle" size={48} color="#10B981" style={{ opacity: 0.5 }} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No Actions</Text>
            <Text style={[styles.emptyText, { color: theme.colors.text }]}>The AI hasn&apos;t detected any action items yet.</Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, paddingTop: Platform.OS === 'android' ? 48 : 12, borderBottomWidth: 1 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  headerSpacer: { width: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  aiLabel: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, marginBottom: 16, gap: 6 },
  aiLabelText: { fontSize: 12, fontWeight: '600' },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)', elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconContainer: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 16, fontWeight: '600' },
  priorityBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8 },
  priorityText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  cardDescription: { fontSize: 14, opacity: 0.7 },
  cardDate: { fontSize: 12, opacity: 0.5, marginTop: 4 },
  emptyScrollContent: { flexGrow: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40, gap: 16, minHeight: 400 },
  emptyIconContainer: { width: 96, height: 96, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptyText: { fontSize: 15, textAlign: 'center', opacity: 0.6, lineHeight: 22 },
});
