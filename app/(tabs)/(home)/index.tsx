
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol';
import ScopeUploadModal from '@/components/job/ScopeUploadModal';

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string | null;
  is_admin: boolean;
}

interface Job {
  id: string;
  job_name: string;
  site_name: string;
  start_date: string;
  is_archived: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  processing_status: 'idle' | 'scheduled' | 'running' | 'completed' | 'failed';
  processing_scheduled_for: string | null;
  last_processed_at: string | null;
  unread_count?: number;
}

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  is_invited?: boolean;
}

interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScopeModal, setShowScopeModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedAuthUser, setSelectedAuthUser] = useState<AuthUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Form states
  const [jobName, setJobName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState('');

  const loadProfile = useCallback(async () => {
    try {
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
    }
  }, [user?.id]);

  const getUnreadMessageCount = useCallback(async (jobId: string): Promise<number> => {
    try {
      if (!user?.id) return 0;

      // Get the last read timestamp for this user and job
      const { data: readStatus, error: readError } = await supabase
        .from('chat_read_status')
        .select('last_read_at')
        .eq('user_id', user.id)
        .eq('job_id', jobId)
        .single();

      if (readError && readError.code !== 'PGRST116') {
        console.error('Error fetching read status:', readError);
        return 0;
      }

      // If no read status exists, count all messages except user's own
      if (!readStatus) {
        const { count, error: countError } = await supabase
          .from('chat_messages')
          .select('*', { count: 'exact', head: true })
          .eq('job_id', jobId)
          .neq('user_id', user.id);

        if (countError) {
          console.error('Error counting messages:', countError);
          return 0;
        }

        return count || 0;
      }

      // Count messages created after last read time, excluding user's own messages
      const { count, error: countError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('job_id', jobId)
        .gt('created_at', readStatus.last_read_at)
        .neq('user_id', user.id);

      if (countError) {
        console.error('Error counting unread messages:', countError);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Exception getting unread count:', error);
      return 0;
    }
  }, [user?.id]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_archived', false)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error loading jobs:', error);
      } else {
        console.log('Jobs loaded:', data);
        
        // Load unread counts for each job
        if (data && data.length > 0) {
          const jobsWithUnreadCounts = await Promise.all(
            data.map(async (job) => {
              const unreadCount = await getUnreadMessageCount(job.id);
              return { ...job, unread_count: unreadCount };
            })
          );
          setJobs(jobsWithUnreadCounts);
        } else {
          setJobs([]);
        }
      }
    } catch (error) {
      console.error('Exception loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }, [getUnreadMessageCount]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadJobs();
    }
  }, [user, loadProfile, loadJobs]);

  const loadAllUsers = async () => {
    if (!selectedJob) return;
    
    try {
      setLoadingUsers(true);
      
      // Get all users except the current admin
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name')
        .neq('user_id', user?.id)
        .order('display_name', { ascending: true });

      if (usersError) {
        console.error('Error loading users:', usersError);
        return;
      }

      // Get existing invitations for this job
      const { data: invitationsData, error: invitationsError } = await supabase
        .from('job_invitations')
        .select('user_id')
        .eq('job_id', selectedJob.id);

      if (invitationsError) {
        console.error('Error loading invitations:', invitationsError);
      }

      // Mark users who are already invited
      const invitedUserIds = new Set(invitationsData?.map(inv => inv.user_id) || []);
      const usersWithInviteStatus = (usersData || []).map(user => ({
        ...user,
        is_invited: invitedUserIds.has(user.user_id)
      }));

      console.log('Users loaded:', usersWithInviteStatus);
      setAllUsers(usersWithInviteStatus);
    } catch (error) {
      console.error('Exception loading users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

const loadAuthUsers = async () => {
  try {
    setLoadingUsers(true);
    
    // Query user_profiles directly (same approach as loadAllUsers)
    const { data: usersData, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .order('display_name', { ascending: true });

    if (usersError) {
      console.error('Error loading users:', usersError);
      Alert.alert('Error', 'Failed to load users');
      return;
    }

    // Map to AuthUser format
    const authUsersWithEmails: AuthUser[] = (usersData || []).map(profile => ({
      id: profile.user_id,
      email: profile.email || 'No email',
      display_name: profile.display_name
    }));

    console.log('Auth users loaded:', authUsersWithEmails);
    setAuthUsers(authUsersWithEmails);
  } catch (error) {
    console.error('Exception loading auth users:', error);
    Alert.alert('Error', 'An unexpected error occurred');
  } finally {
    setLoadingUsers(false);
  }
};

  const handleJobPress = (job: Job) => {
    console.log('Navigating to job:', job.id);
    router.push(`/(tabs)/(home)/job/${job.id}` as any);
  };

  const handleLongPress = (job: Job) => {
    if (profile?.is_admin) {
      setSelectedJob(job);
      setShowMenu(true);
    }
  };

  const handleArchiveJob = async () => {
    if (!selectedJob) return;

    Alert.alert(
      'Archive Job',
      `Are you sure you want to archive "${selectedJob.job_name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('jobs')
                .update({ is_archived: true })
                .eq('id', selectedJob.id);

              if (error) {
                console.error('Error archiving job:', error);
                Alert.alert('Error', 'Failed to archive job');
              } else {
                Alert.alert('Success', 'Job archived successfully');
                loadJobs();
              }
            } catch (error) {
              console.error('Exception archiving job:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
            setShowMenu(false);
            setSelectedJob(null);
          },
        },
      ]
    );
  };

  const handleEditJob = () => {
    if (!selectedJob) return;
    setJobName(selectedJob.job_name);
    setSiteName(selectedJob.site_name);
    setStartDate(selectedJob.start_date);
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedJob || !jobName.trim() || !siteName.trim() || !startDate.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .update({
          job_name: jobName.trim(),
          site_name: siteName.trim(),
          start_date: startDate.trim(),
        })
        .eq('id', selectedJob.id);

      if (error) {
        console.error('Error updating job:', error);
        Alert.alert('Error', 'Failed to update job');
      } else {
        Alert.alert('Success', 'Job updated successfully');
        loadJobs();
        setShowEditModal(false);
        setSelectedJob(null);
        setJobName('');
        setSiteName('');
        setStartDate('');
      }
    } catch (error) {
      console.error('Exception updating job:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleInviteTechnicians = () => {
    setShowMenu(false);
    setSelectedUsers([]);
    setShowInviteModal(true);
    loadAllUsers();
  };

  const handleUploadScope = () => {
    setShowMenu(false);
    setShowScopeModal(true);
  };

  const handleScopeUploadSuccess = () => {
    console.log('Scope uploaded successfully');
    loadJobs();
  };

  const toggleUserSelection = (userId: string, isInvited: boolean) => {
    if (isInvited) {
      Alert.alert('Already Invited', 'This user has already been invited to this job.');
      return;
    }
    
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendInvites = async () => {
    if (!selectedJob || selectedUsers.length === 0) {
      Alert.alert('Error', 'Please select at least one user');
      return;
    }

    try {
      const invitations = selectedUsers.map((userId) => ({
        job_id: selectedJob.id,
        user_id: userId,
        invited_by: user?.id,
      }));

      const { error } = await supabase
        .from('job_invitations')
        .insert(invitations);

      if (error) {
        console.error('Error sending invitations:', error);
        Alert.alert('Error', 'Failed to send invitations');
      } else {
        Alert.alert('Success', `Invited ${selectedUsers.length} user(s) to the job`);
        setShowInviteModal(false);
        setSelectedJob(null);
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Exception sending invitations:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleCreateJob = () => {
    setJobName('');
    setSiteName('');
    setStartDate('');
    setShowCreateModal(true);
  };

  const handleSaveNewJob = async () => {
    if (!jobName.trim() || !siteName.trim() || !startDate.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          job_name: jobName.trim(),
          site_name: siteName.trim(),
          start_date: startDate.trim(),
          created_by: user?.id,
        });

      if (error) {
        console.error('Error creating job:', error);
        Alert.alert('Error', 'Failed to create job');
      } else {
        Alert.alert('Success', 'Job created successfully');
        loadJobs();
        setShowCreateModal(false);
        setJobName('');
        setSiteName('');
        setStartDate('');
      }
    } catch (error) {
      console.error('Exception creating job:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    }
  };

  const handleOpenSettings = () => {
    setShowSettingsModal(true);
  };

  const handleResetPasswords = () => {
    setShowSettingsModal(false);
    setShowPasswordResetModal(true);
    loadAuthUsers();
  };

  const handleSelectUserForPasswordReset = (authUser: AuthUser) => {
    setSelectedAuthUser(authUser);
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordResetModal(false);
    setShowPasswordChangeModal(true);
  };

  const handleUpdatePassword = async () => {
    if (!selectedAuthUser) return;

    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        selectedAuthUser.id,
        { password: newPassword }
      );

      if (error) {
        console.error('Error updating password:', error);
        Alert.alert('Error', 'Failed to update password: ' + error.message);
      } else {
        Alert.alert('Success', `Password updated successfully for ${selectedAuthUser.email}`);
        setShowPasswordChangeModal(false);
        setSelectedAuthUser(null);
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Exception updating password:', error);
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const getProcessingStatusBadge = (job: Job) => {
    const { processing_status, processing_scheduled_for } = job;

    if (processing_status === 'running') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }]}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.statusBadgeText, { color: theme.colors.primary }]}>Processing</Text>
        </View>
      );
    }

    if (processing_status === 'scheduled') {
      const scheduledTime = processing_scheduled_for ? new Date(processing_scheduled_for) : null;
      const isPast = scheduledTime && scheduledTime < new Date();
      
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#F59E0B20', borderColor: '#F59E0B' }]}>
          <IconSymbol
            ios_icon_name="clock"
            android_material_icon_name="schedule"
            size={12}
            color="#F59E0B"
          />
          <Text style={[styles.statusBadgeText, { color: '#F59E0B' }]}>
            {isPast ? 'Pending' : 'Scheduled'}
          </Text>
        </View>
      );
    }

    if (processing_status === 'failed') {
      return (
        <View style={[styles.statusBadge, { backgroundColor: '#EF444420', borderColor: '#EF4444' }]}>
          <IconSymbol
            ios_icon_name="exclamationmark.triangle"
            android_material_icon_name="error"
            size={12}
            color="#EF4444"
          />
          <Text style={[styles.statusBadgeText, { color: '#EF4444' }]}>Failed</Text>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.card, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Jobs</Text>
          {profile?.is_admin && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>Admin</Text>
            </View>
          )}
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.signOutButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={handleSignOut}
          >
            <IconSymbol
              ios_icon_name="rectangle.portrait.and.arrow.right"
              android_material_icon_name="logout"
              size={20}
              color={theme.colors.text}
            />
          </TouchableOpacity>
          {profile?.is_admin && (
            <>
              <TouchableOpacity
                style={[styles.settingsButton, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={handleOpenSettings}
              >
                <IconSymbol
                  ios_icon_name="gearshape"
                  android_material_icon_name="settings"
                  size={20}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleCreateJob}
              >
                <IconSymbol
                  ios_icon_name="plus"
                  android_material_icon_name="add"
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Jobs List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>Loading jobs...</Text>
        </View>
      ) : jobs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <IconSymbol
            ios_icon_name="briefcase"
            android_material_icon_name="work"
            size={64}
            color={theme.colors.text}
            style={{ opacity: 0.3 }}
          />
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            {profile?.is_admin
              ? 'No jobs yet. Create your first job!'
              : 'No jobs assigned yet. Contact your admin.'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.jobsContainer}
          showsVerticalScrollIndicator={false}
        >
          {jobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={[styles.jobCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onPress={() => handleJobPress(job)}
              onLongPress={() => handleLongPress(job)}
              delayLongPress={500}
              activeOpacity={0.7}
            >
              <View style={styles.jobCardHeader}>
                <View style={styles.jobCardTitleRow}>
                  <Text style={[styles.jobName, { color: theme.colors.text }]}>{job.job_name}</Text>
                  {job.unread_count !== undefined && job.unread_count > 0 && (
                    <View style={[styles.unreadBadge, { backgroundColor: theme.colors.notification }]}>
                      <Text style={styles.unreadBadgeText}>
                        {job.unread_count > 99 ? '99+' : job.unread_count}
                      </Text>
                    </View>
                  )}
                </View>
                {profile?.is_admin && (
                  <IconSymbol
                    ios_icon_name="ellipsis.circle"
                    android_material_icon_name="more_vert"
                    size={20}
                    color={theme.colors.text}
                    style={{ opacity: 0.5 }}
                  />
                )}
              </View>
              <View style={styles.jobCardDetails}>
                <View style={styles.jobCardRow}>
                  <IconSymbol
                    ios_icon_name="building.2"
                    android_material_icon_name="location_city"
                    size={16}
                    color={theme.colors.text}
                    style={{ opacity: 0.6 }}
                  />
                  <Text style={[styles.jobDetail, { color: theme.colors.text }]}>{job.site_name}</Text>
                </View>
                <View style={styles.jobCardRow}>
                  <IconSymbol
                    ios_icon_name="calendar"
                    android_material_icon_name="calendar_today"
                    size={16}
                    color={theme.colors.text}
                    style={{ opacity: 0.6 }}
                  />
                  <Text style={[styles.jobDetail, { color: theme.colors.text }]}>{formatDate(job.start_date)}</Text>
                </View>
              </View>
              {/* Processing Status Badge */}
              {getProcessingStatusBadge(job)}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Admin Menu Modal */}
      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
              {selectedJob?.job_name}
            </Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleEditJob}
            >
              <IconSymbol
                ios_icon_name="pencil"
                android_material_icon_name="edit"
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Edit Job Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleInviteTechnicians}
            >
              <IconSymbol
                ios_icon_name="person.badge.plus"
                android_material_icon_name="person_add"
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Invite Technician</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleUploadScope}
            >
              <IconSymbol
                ios_icon_name="doc.badge.plus"
                android_material_icon_name="upload_file"
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Add Scope</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemDanger]}
              onPress={handleArchiveJob}
            >
              <IconSymbol
                ios_icon_name="archivebox"
                android_material_icon_name="archive"
                size={20}
                color="#DC3545"
              />
              <Text style={[styles.menuItemText, { color: '#DC3545' }]}>Archive Job</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowMenu(false)}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSettingsModal(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.menuTitle, { color: theme.colors.text }]}>
              Admin Settings
            </Text>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleResetPasswords}
            >
              <IconSymbol
                ios_icon_name="key"
                android_material_icon_name="vpn_key"
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Reset Passwords</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowSettingsModal(false)}
            >
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Password Reset User List Modal */}
      <Modal
        visible={showPasswordResetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordResetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.inviteContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Reset User Password</Text>
            <Text style={[styles.inviteSubtitle, { color: theme.colors.text }]}>
              Select a user to reset their password
            </Text>
            
            {loadingUsers ? (
              <View style={styles.loadingUsersContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingUsersText, { color: theme.colors.text }]}>Loading users...</Text>
              </View>
            ) : authUsers.length === 0 ? (
              <View style={styles.emptyUsersContainer}>
                <Text style={[styles.emptyUsersText, { color: theme.colors.text }]}>
                  No users available
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
                {authUsers.map((authUser, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.userItem,
                      { borderColor: theme.colors.border }
                    ]}
                    onPress={() => handleSelectUserForPasswordReset(authUser)}
                  >
                    <View style={styles.userItemContent}>
                      <IconSymbol
                        ios_icon_name="person.circle"
                        android_material_icon_name="account_circle"
                        size={24}
                        color={theme.colors.text}
                      />
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                          {authUser.display_name || 'Unknown User'}
                        </Text>
                        <Text style={[styles.userEmail, { color: theme.colors.text }]}>
                          {authUser.email}
                        </Text>
                      </View>
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={theme.colors.text}
                      style={{ opacity: 0.5 }}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowPasswordResetModal(false);
                }}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordChangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordChangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Change Password</Text>
            <Text style={[styles.inviteSubtitle, { color: theme.colors.text, marginBottom: 16 }]}>
              {selectedAuthUser?.display_name || selectedAuthUser?.email}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="New Password"
              placeholderTextColor={theme.colors.text + '80'}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Confirm Password"
              placeholderTextColor={theme.colors.text + '80'}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowPasswordChangeModal(false);
                  setSelectedAuthUser(null);
                  setNewPassword('');
                  setConfirmPassword('');
                }}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleUpdatePassword}
              >
                <Text style={[styles.formButtonText, { color: '#fff' }]}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Job Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Edit Job</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Job Name"
              placeholderTextColor={theme.colors.text + '80'}
              value={jobName}
              onChangeText={setJobName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Site Name"
              placeholderTextColor={theme.colors.text + '80'}
              value={siteName}
              onChangeText={setSiteName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Start Date (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.text + '80'}
              value={startDate}
              onChangeText={setStartDate}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowEditModal(false);
                  setSelectedJob(null);
                  setJobName('');
                  setSiteName('');
                  setStartDate('');
                }}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveEdit}
              >
                <Text style={[styles.formButtonText, { color: '#fff' }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Job Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.formContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Create New Job</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Job Name"
              placeholderTextColor={theme.colors.text + '80'}
              value={jobName}
              onChangeText={setJobName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Site Name"
              placeholderTextColor={theme.colors.text + '80'}
              value={siteName}
              onChangeText={setSiteName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text, borderColor: theme.colors.border }]}
              placeholder="Start Date (YYYY-MM-DD)"
              placeholderTextColor={theme.colors.text + '80'}
              value={startDate}
              onChangeText={setStartDate}
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowCreateModal(false);
                  setJobName('');
                  setSiteName('');
                  setStartDate('');
                }}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSaveNewJob}
              >
                <Text style={[styles.formButtonText, { color: '#fff' }]}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Invite Technicians Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.inviteContainer, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.formTitle, { color: theme.colors.text }]}>Invite Technicians</Text>
            <Text style={[styles.inviteSubtitle, { color: theme.colors.text }]}>
              Select users to invite to {selectedJob?.job_name}
            </Text>
            
            {loadingUsers ? (
              <View style={styles.loadingUsersContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={[styles.loadingUsersText, { color: theme.colors.text }]}>Loading users...</Text>
              </View>
            ) : allUsers.length === 0 ? (
              <View style={styles.emptyUsersContainer}>
                <Text style={[styles.emptyUsersText, { color: theme.colors.text }]}>
                  No other users available to invite
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
                {allUsers.map((userItem, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.userItem,
                      { borderColor: theme.colors.border },
                      selectedUsers.includes(userItem.user_id) && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary },
                      userItem.is_invited && { opacity: 0.5 }
                    ]}
                    onPress={() => toggleUserSelection(userItem.user_id, userItem.is_invited || false)}
                    disabled={userItem.is_invited}
                  >
                    <View style={styles.userItemContent}>
                      <IconSymbol
                        ios_icon_name="person.circle"
                        android_material_icon_name="account_circle"
                        size={24}
                        color={theme.colors.text}
                      />
                      <View style={styles.userInfo}>
                        <Text style={[styles.userName, { color: theme.colors.text }]}>
                          {userItem.display_name || 'Unknown User'}
                        </Text>
                        {userItem.is_invited && (
                          <Text style={[styles.invitedLabel, { color: theme.colors.text }]}>
                            Already invited
                          </Text>
                        )}
                      </View>
                    </View>
                    {selectedUsers.includes(userItem.user_id) && !userItem.is_invited && (
                      <IconSymbol
                        ios_icon_name="checkmark.circle.fill"
                        android_material_icon_name="check_circle"
                        size={24}
                        color={theme.colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonSecondary, { borderColor: theme.colors.border }]}
                onPress={() => {
                  setShowInviteModal(false);
                  setSelectedJob(null);
                  setSelectedUsers([]);
                }}
              >
                <Text style={[styles.formButtonText, { color: theme.colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.formButtonPrimary, { backgroundColor: theme.colors.primary }]}
                onPress={handleSendInvites}
                disabled={selectedUsers.length === 0}
              >
                <Text style={[styles.formButtonText, { color: '#fff' }]}>
                  Invite ({selectedUsers.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Scope Upload Modal */}
      {selectedJob && (
        <ScopeUploadModal
          visible={showScopeModal}
          jobId={selectedJob.id}
          jobName={selectedJob.job_name}
          onClose={() => {
            setShowScopeModal(false);
            setSelectedJob(null);
          }}
          onSuccess={handleScopeUploadSuccess}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
  },
  headerBadge: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  signOutButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  jobsContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  jobCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  jobName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  jobCardDetails: {
    gap: 8,
    marginBottom: 8,
  },
  jobCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jobDetail: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  menuContainer: {
    borderRadius: 16,
    padding: 8,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '700',
    padding: 16,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
  },
  menuItemDanger: {
    marginTop: 8,
  },
  menuItemCancel: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    justifyContent: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  formContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formButtonPrimary: {
    // backgroundColor set dynamically
  },
  formButtonSecondary: {
    borderWidth: 1,
  },
  formButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inviteContainer: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  inviteSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
  },
  loadingUsersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  loadingUsersText: {
    fontSize: 14,
    opacity: 0.7,
  },
  emptyUsersContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyUsersText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  userList: {
    maxHeight: 300,
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  userItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  invitedLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});
