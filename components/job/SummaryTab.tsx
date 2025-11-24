
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/IconSymbol';

interface SummaryTabProps {
  jobId: string;
}

interface SummaryCard {
  id: string;
  title: string;
  count?: number;
  icon: string;
  androidIcon: string;
  route: string;
  color?: string;
}

export default function SummaryTab({ jobId }: SummaryTabProps) {
  const theme = useTheme();
  const router = useRouter();

  const cards: SummaryCard[] = [
    {
      id: 'overview',
      title: 'Job Overview',
      icon: 'doc.text',
      androidIcon: 'description',
      route: `/job-details/overview?jobId=${jobId}`,
    },
    {
      id: 'issues',
      title: 'Open Issues',
      count: 6,
      icon: 'exclamationmark.triangle',
      androidIcon: 'warning',
      route: `/job-details/issues?jobId=${jobId}`,
      color: '#F59E0B',
    },
    {
      id: 'questions',
      title: 'Unanswered Questions',
      count: 3,
      icon: 'questionmark.circle',
      androidIcon: 'help',
      route: `/job-details/questions?jobId=${jobId}`,
      color: '#3B82F6',
    },
    {
      id: 'actions',
      title: 'Next Actions',
      count: 4,
      icon: 'checkmark.circle',
      androidIcon: 'check_circle',
      route: `/job-details/actions?jobId=${jobId}`,
      color: '#10B981',
    },
    {
      id: 'completed',
      title: 'Completed Items',
      count: 18,
      icon: 'checkmark.seal',
      androidIcon: 'verified',
      route: `/job-details/completed?jobId=${jobId}`,
      color: '#6B7280',
    },
    {
      id: 'warnings',
      title: 'Warnings & Risks',
      count: 2,
      icon: 'exclamationmark.shield',
      androidIcon: 'shield',
      route: `/job-details/warnings?jobId=${jobId}`,
      color: '#EF4444',
    },
    {
      id: 'deadlines',
      title: 'Deadlines & Timelines',
      count: 3,
      icon: 'clock',
      androidIcon: 'schedule',
      route: `/job-details/deadlines?jobId=${jobId}`,
      color: '#8B5CF6',
    },
    {
      id: 'dependencies',
      title: 'Dependencies',
      icon: 'link',
      androidIcon: 'link',
      route: `/job-details/dependencies?jobId=${jobId}`,
      color: '#06B6D4',
    },
    {
      id: 'changelog',
      title: 'Change Log',
      icon: 'list.bullet.rectangle',
      androidIcon: 'history',
      route: `/job-details/changelog?jobId=${jobId}`,
      color: '#64748B',
    },
  ];

  const handleCardPress = (card: SummaryCard) => {
    console.log('Card pressed:', card.title);
    console.log('Navigating to:', card.route);
    try {
      router.push(card.route as any);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {cards.map((card, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={() => handleCardPress(card)}
          activeOpacity={0.7}
        >
          <View style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: (card.color || theme.colors.primary) + '20' }]}>
              <IconSymbol
                ios_icon_name={card.icon}
                android_material_icon_name={card.androidIcon}
                size={24}
                color={card.color || theme.colors.primary}
              />
            </View>
            <View style={styles.cardText}>
              <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                {card.title}
              </Text>
              {card.count !== undefined && (
                <Text style={[styles.cardCount, { color: card.color || theme.colors.primary }]}>
                  {card.count} {card.count === 1 ? 'item' : 'items'}
                </Text>
              )}
            </View>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={20}
              color={theme.colors.text}
              style={{ opacity: 0.3 }}
            />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  cardCount: {
    fontSize: 14,
    fontWeight: '500',
  },
});
