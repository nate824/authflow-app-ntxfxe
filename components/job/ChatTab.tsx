
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Keyboard } from 'react-native';
import { KeyboardGestureArea, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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
  isOptimistic?: boolean;
}

interface ChatTabProps {
  jobId: string;
}

// Separate component for message text to isolate Android rendering
function MessageTextContent({ 
  text, 
  isCurrentUser 
}: { 
  text: string; 
  isCurrentUser: boolean;
}) {
  // Force the text to be a string
  const displayText = String(text || '');
  
  return (
    <Text
      style={{
        color: '#FFFFFF',
        fontSize: 16,
        lineHeight: 22,
      }}
    >
      {displayText}
    </Text>
  );
}

// Separate component for message bubble
function MessageBubble({
  message,
  isCurrentUser,
  theme,
}: {
  message: Message;
  isCurrentUser: boolean;
  theme: any;
}) {
  const displayName = message.userProfile?.display_name || 'User';
  const initials = getInitials(message.userProfile?.display_name, message.user_id);
  const avatarColor = getAvatarColor(message.user_id);
  const messageText = message.message_text || '[Empty message]';

  return (
    <View
      style={[
        styles.messageWrapper,
        isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
      ]}
    >
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
              styles.bubbleContainer,
              isCurrentUser
                ? { backgroundColor: theme.colors.primary }
                : { backgroundColor: '#10B981', borderWidth: 0, borderColor: 'transparent' },
              message.isOptimistic && { opacity: 0.7 },
            ]}
          >
            <MessageTextContent 
              text={messageText} 
              isCurrentUser={isCurrentUser} 
            />
          </View>

          <View style={styles.timestampRow}>
            <Text style={[styles.timestamp, { color: theme.colors.text }]}>
              {formatMessageTime(message.created_at)}
            </Text>
            {message.isOptimistic && (
              <Text style={[styles.sendingText, { color: theme.colors.text }]}>
                Sending...
              </Text>
            )}
          </View>
        </View>

        {isCurrentUser && (
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Helper functions defined outside component
function getInitials(displayName: string | null | undefined, userId: string): string {
  if (displayName) {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
  return userId.substring(0, 2).toUpperCase();
}

function getAvatarColor(userId: string): string {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
  ];
  const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
}

function formatMessageTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Get keyboard animation height
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();

  // Create animated style for input container
  const inputAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: keyboardHeight.value }],
  }));

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

  useEffect(() => {
    const keyboardDidShow = Keyboard.addListener('keyboardDidShow', () => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => keyboardDidShow.remove();
  }, []);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);

      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setCurrentUserProfile(profileData);
      } else {
        setCurrentUserProfile({
          user_id: user.id,
          display_name: null,
          avatar_url: null,
        });
      }
    }
  };

  const setupRealtimeSubscription = () => {
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
          console.log('New message received via Realtime:', payload);

          setMessages((prev) => {
            const hasOptimistic = prev.some(
              (msg) => msg.isOptimistic && msg.message_text === payload.new.message_text
            );

            if (hasOptimistic) {
              return prev.map((msg) =>
                msg.isOptimistic && msg.message_text === payload.new.message_text
                  ? { ...(payload.new as Message), isOptimistic: false }
                  : msg
              );
            } else {
              fetchMessages();
              return prev;
            }
          });
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    channelRef.current = channel;
  };

  const fetchMessages = async () => {
    try {
      if (messages.length === 0) setLoading(true);

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

      console.log('Fetched messages count:', messagesData.length);

      // Log each message for debugging
      messagesData.forEach((msg, idx) => {
        console.log(`[DEBUG] Message ${idx}:`, {
          id: msg.id,
          text: msg.message_text?.substring(0, 50),
          type: msg.message_type,
          hasText: Boolean(msg.message_text),
        });
      });

      const userIds = [...new Set(messagesData.map((msg) => msg.user_id))];

      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const messagesWithProfiles = messagesData.map((msg) => {
        const userProfile = profilesData?.find((profile) => profile.user_id === msg.user_id);
        return {
          ...msg,
          userProfile: userProfile || {
            user_id: msg.user_id,
            display_name: null,
            avatar_url: null,
          },
          isOptimistic: false,
        };
      });

      setMessages(messagesWithProfiles);

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
      return;
    }

    try {
      setSending(true);

      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        message_text: trimmedMessage,
        user_id: currentUserId,
        created_at: new Date().toISOString(),
        message_type: 'text',
        userProfile: currentUserProfile || {
          user_id: currentUserId,
          display_name: null,
          avatar_url: null,
        },
        isOptimistic: true,
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setMessage('');

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 50);

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
        setMessages((prev) => prev.filter((msg) => msg.id !== optimisticMessage.id));
        alert('Failed to send message. Please try again.');
      } else if (data && data.length > 0) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === optimisticMessage.id
              ? {
                  ...data[0],
                  userProfile: currentUserProfile || {
                    user_id: currentUserId,
                    display_name: null,
                    avatar_url: null,
                  },
                  isOptimistic: false,
                }
              : msg
          )
        );
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
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardGestureArea style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
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
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isCurrentUser={msg.user_id === currentUserId}
              theme={theme}
            />
          ))
        )}
      </ScrollView>

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

      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.card,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 12),
          },
          inputAnimatedStyle,
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.colors.background, color: theme.colors.text },
          ]}
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
              opacity: message.trim() && !sending ? 1 : 0.5,
            },
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
      </Animated.View>
    </KeyboardGestureArea>
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
    paddingBottom: 20,
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
    flexShrink: 1,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
    opacity: 0.7,
  },
  bubbleContainer: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 40,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    opacity: 0.5,
  },
  sendingText: {
    fontSize: 11,
    opacity: 0.5,
    fontStyle: 'italic',
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
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
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
