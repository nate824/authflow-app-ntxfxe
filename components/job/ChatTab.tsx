
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface Message {
  id: string;
  message_text: string;
  user_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'voice';
  image_url?: string;
  userProfile?: UserProfile;
}

interface ChatTabProps {
  jobId: string;
}

export default function ChatTab({ jobId }: ChatTabProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    getCurrentUser();
    fetchMessages();
    setupRealtimeSubscription();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [jobId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const setupRealtimeSubscription = () => {
    // Create a channel for this specific job's chat
    const channel = supabase
      .channel(`chat:${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `job_id=eq.${jobId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          fetchMessages(); // Refetch to get the message with user profile
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // Step 1: Fetch chat messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, message_text, user_id, created_at, message_type, image_url')
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        setMessages([]);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found for job:', jobId);
        setMessages([]);
        return;
      }

      console.log('Fetched messages:', messagesData.length);

      // Step 2: Get unique user IDs from messages
      const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
      console.log('Fetching profiles for user IDs:', userIds);

      // Step 3: Fetch user profiles for those user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        // Continue without profiles - we'll use fallback display
      }

      console.log('Fetched profiles:', profilesData?.length || 0);

      // Step 4: Map profiles to messages
      const messagesWithProfiles = messagesData.map(msg => {
        const userProfile = profilesData?.find(profile => profile.user_id === msg.user_id);
        return {
          ...msg,
          userProfile: userProfile || {
            user_id: msg.user_id,
            display_name: null,
            avatar_url: null,
          },
        };
      });

      setMessages(messagesWithProfiles);
      
      // Scroll to bottom after messages load
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !currentUserId || sending) {
      console.log('Cannot send message:', { trimmedMessage, currentUserId, sending });
      return;
    }

    try {
      setSending(true);
      console.log('Sending message:', { jobId, userId: currentUserId, message: trimmedMessage });

      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          job_id: jobId,
          user_id: currentUserId,
          message_text: trimmedMessage,
          message_type: 'text',
        })
        .select();

      if (error) {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
      } else {
        console.log('Message sent successfully:', data);
        setMessage('');
        // The realtime subscription will handle adding the message to the list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = () => {
    console.log('Opening attachment picker');
    // TODO: Implement attachment functionality
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const getUserInitials = (displayName: string | null, userId: string) => {
    if (displayName) {
      return displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    // Fallback to first 2 characters of user ID
    return userId.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (userId: string) => {
    // Generate a consistent color based on user ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
      '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
    ];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 140 : 100}
    >
      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: 20 }
        ]}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="bubble.left.and.bubble.right"
              android_material_icon_name="chat"
              size={64}
              color={theme.colors.text}
              style={{ opacity: 0.3 }}
            />
            <Text style={[styles.emptyStateText, { color: theme.colors.text }]}>
              No messages yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: theme.colors.text }]}>
              Start the conversation by sending a message
            </Text>
          </View>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.user_id === currentUserId;
            const displayName = msg.userProfile?.display_name || 'User';
            const initials = getUserInitials(msg.userProfile?.display_name, msg.user_id);
            const avatarColor = getAvatarColor(msg.user_id);

            return (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.messageWrapper,
                    isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
                  ]}
                >
                  {/* Avatar and message container */}
                  <View style={styles.messageRow}>
                    {!isCurrentUser && (
                      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                    
                    <View style={styles.messageContent}>
                      {!isCurrentUser && (
                        <Text style={[styles.senderName, { color: theme.colors.text }]}>
                          {displayName}
                        </Text>
                      )}
                      <View
                        style={[
                          styles.messageBubble,
                          isCurrentUser
                            ? { backgroundColor: theme.colors.primary }
                            : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                        ]}
                      >
                        {msg.message_type === 'text' && (
                          <Text
                            style={[
                              styles.messageText,
                              { color: isCurrentUser ? '#fff' : theme.colors.text },
                            ]}
                          >
                            {msg.message_text}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.timestamp, { color: theme.colors.text }]}>
                        {formatTime(msg.created_at)}
                      </Text>
                    </View>

                    {isCurrentUser && (
                      <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
                        <Text style={styles.avatarText}>{initials}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </React.Fragment>
            );
          })
        )}
      </ScrollView>

      {/* Floating Add Button - Repositioned higher up */}
      <TouchableOpacity
        style={[styles.floatingButton, { backgroundColor: theme.colors.primary }]}
        onPress={handleAttachment}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={24}
          color="#fff"
        />
      </TouchableOpacity>

      {/* Input Bar with Safe Area */}
      <View 
        style={[
          styles.inputContainer, 
          { 
            backgroundColor: theme.colors.card, 
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          }
        ]}
      >
        <TextInput
          style={[styles.input, { backgroundColor: theme.colors.background, color: theme.colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.text + '80'}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={500}
          editable={!sending}
        />
        <TouchableOpacity
          style={[
            styles.sendButton, 
            { 
              backgroundColor: theme.colors.primary,
              opacity: (message.trim() && !sending) ? 1 : 0.5
            }
          ]}
          onPress={handleSend}
          disabled={!message.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <IconSymbol
              ios_icon_name="arrow.up"
              android_material_icon_name="send"
              size={20}
              color="#fff"
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
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
  messageWrapper: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
    opacity: 0.7,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
    opacity: 0.5,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 140,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
    zIndex: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
});
