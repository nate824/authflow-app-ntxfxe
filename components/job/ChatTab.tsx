
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface Message {
  id: string;
  message_text: string;
  user_id: string;
  created_at: string;
  message_type: 'text' | 'image' | 'voice';
  image_url?: string;
  user_profiles?: {
    display_name: string;
  };
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchMessages();
    getCurrentUser();
  }, [jobId]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user_profiles!chat_messages_user_id_fkey(display_name)
        `)
        .eq('job_id', jobId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
        // Scroll to bottom after messages load
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (message.trim() && currentUserId) {
      try {
        const { error } = await supabase
          .from('chat_messages')
          .insert({
            job_id: jobId,
            user_id: currentUserId,
            message_text: message.trim(),
            message_type: 'text',
          });

        if (error) {
          console.error('Error sending message:', error);
        } else {
          setMessage('');
          fetchMessages();
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleAttachment = () => {
    console.log('Opening attachment picker');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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
            return (
              <React.Fragment key={index}>
                <View
                  style={[
                    styles.messageWrapper,
                    isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
                  ]}
                >
                  {!isCurrentUser && (
                    <Text style={[styles.senderName, { color: theme.colors.text }]}>
                      {msg.user_profiles?.display_name || 'Unknown User'}
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
                    {msg.message_type === 'image' && (
                      <View>
                        <Text
                          style={[
                            styles.messageText,
                            { color: isCurrentUser ? '#fff' : theme.colors.text },
                          ]}
                        >
                          {msg.message_text}
                        </Text>
                        {msg.image_url && (
                          <Image
                            source={{ uri: msg.image_url }}
                            style={styles.messageImage}
                            resizeMode="cover"
                          />
                        )}
                      </View>
                    )}
                    {msg.message_type === 'voice' && (
                      <View style={styles.voiceMessage}>
                        <IconSymbol
                          ios_icon_name="waveform"
                          android_material_icon_name="graphic_eq"
                          size={20}
                          color={isCurrentUser ? '#fff' : theme.colors.primary}
                        />
                        <Text
                          style={[
                            styles.messageText,
                            { color: isCurrentUser ? '#fff' : theme.colors.text },
                          ]}
                        >
                          {msg.message_text}
                        </Text>
                        <IconSymbol
                          ios_icon_name="play.circle.fill"
                          android_material_icon_name="play_circle"
                          size={24}
                          color={isCurrentUser ? '#fff' : theme.colors.primary}
                        />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.timestamp, { color: theme.colors.text }]}>
                    {formatTime(msg.created_at)}
                  </Text>
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
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleSend}
        >
          <IconSymbol
            ios_icon_name="arrow.up"
            android_material_icon_name="send"
            size={20}
            color="#fff"
          />
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
    maxWidth: '80%',
  },
  messageWrapperLeft: {
    alignSelf: 'flex-start',
  },
  messageWrapperRight: {
    alignSelf: 'flex-end',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 12,
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
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginTop: 8,
  },
  voiceMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    marginLeft: 12,
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
