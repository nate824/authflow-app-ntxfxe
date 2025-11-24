
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
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/app/integrations/supabase/client';
import { IconSymbol } from '@/components/IconSymbol.ios';

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
}

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
}

export default function HomeScreen() {
  const theme = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  
  // Form states
  const [jobName, setJobName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [startDate, setStartDate] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadJobs();
    }
  }, [user]);

  const loadProfile = async () => {
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
  };

  const loadJobs = async () => {
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
        setJobs(data || []);
      }
    } catch (error) {
      console.error('Exception loading jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, display_name')
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error loading users:', error);
      } else {
        console.log('Users loaded:', data);
        setAllUsers(data || []);
      }
    } catch (error) {
      console.error('Exception loading users:', error);
    }
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
    loadAllUsers();
    setSelectedUsers([]);
    setShowInviteModal(true);
  };

  const toggleUserSelection = (userId: string) => {
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
        Alert.alert('Error', 'Failed to send invitations. Some users may already be invited.');
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
          {profile?.is_admin && (
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
          )}
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
          {jobs.map((job, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.jobCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
              onLongPress={() => handleLongPress(job)}
              delayLongPress={500}
            >
              <View style={styles.jobCardHeader}>
                <Text style={[styles.jobName, { color: theme.colors.text }]}>{job.job_name}</Text>
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
              onPress={() => {
                setShowMenu(false);
                Alert.alert('Upload Scope', 'This feature will be implemented in the next step');
              }}
            >
              <IconSymbol
                ios_icon_name="doc.badge.plus"
                android_material_icon_name="upload_file"
                size={20}
                color={theme.colors.text}
              />
              <Text style={[styles.menuItemText, { color: theme.colors.text }]}>Upload Initial Scope</Text>
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
            <ScrollView style={styles.userList} showsVerticalScrollIndicator={false}>
              {allUsers.map((user, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.userItem,
                    { borderColor: theme.colors.border },
                    selectedUsers.includes(user.user_id) && { backgroundColor: theme.colors.primary + '20', borderColor: theme.colors.primary }
                  ]}
                  onPress={() => toggleUserSelection(user.user_id)}
                >
                  <View style={styles.userItemContent}>
                    <IconSymbol
                      ios_icon_name="person.circle"
                      android_material_icon_name="account_circle"
                      size={24}
                      color={theme.colors.text}
                    />
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                      {user.display_name || 'Unknown User'}
                    </Text>
                  </View>
                  {selectedUsers.includes(user.user_id) && (
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
              >
                <Text style={[styles.formButtonText, { color: '#fff' }]}>
                  Invite ({selectedUsers.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  jobCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobName: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
  },
  jobCardDetails: {
    gap: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  inviteSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    opacity: 0.7,
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
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
});
