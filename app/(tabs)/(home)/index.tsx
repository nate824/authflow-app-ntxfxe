
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error loading profile:', error);
      } else {
        console.log('Profile loaded:', data);
        setProfile(data);
      }
    } catch (error) {
      console.error('Exception loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          You have successfully logged in
        </Text>
        
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.infoContainer}>
            {/* User Type Badge */}
            {profile && (
              <View style={[
                styles.badge,
                { backgroundColor: profile.is_admin ? '#10b981' : '#3b82f6' }
              ]}>
                <Text style={styles.badgeText}>
                  {profile.is_admin ? '👑 Admin User' : '👤 Basic User'}
                </Text>
              </View>
            )}

            <Text style={[styles.infoLabel, { color: theme.colors.text, opacity: 0.6 }]}>
              Email:
            </Text>
            <Text style={[styles.infoValue, { color: theme.colors.text }]}>
              {user?.email}
            </Text>

            {profile && (
              <>
                <Text style={[styles.infoLabel, { color: theme.colors.text, opacity: 0.6 }]}>
                  Display Name:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.display_name || 'Not set'}
                </Text>

                <Text style={[styles.infoLabel, { color: theme.colors.text, opacity: 0.6 }]}>
                  Role:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.role || 'user'}
                </Text>

                <Text style={[styles.infoLabel, { color: theme.colors.text, opacity: 0.6 }]}>
                  Account Type:
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                  {profile.is_admin ? 'Administrator' : 'Basic User'}
                </Text>
              </>
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={handleSignOut}
        >
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  loader: {
    marginVertical: 20,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    alignSelf: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  infoContainer: {
    width: '100%',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '400',
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    minWidth: 200,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
