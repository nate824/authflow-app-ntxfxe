
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconSymbol } from '@/components/IconSymbol';

interface Message {
  id: string;
  text: string;
  sender: string;
  timestamp: string;
  type: 'text' | 'image' | 'voice';
  imageUrl?: string;
  isCurrentUser: boolean;
}

interface ChatTabProps {
  jobId: string;
}

export default function ChatTab({ jobId }: ChatTabProps) {
  const theme = useTheme();
  const [message, setMessage] = useState('');

  // Mock messages for static UI
  const messages: Message[] = [
    {
      id: '1',
      text: 'Morning team. Starting scaffold inspection at 8 AM.',
      sender: 'Sarah Chen',
      timestamp: '8:02 AM',
      type: 'text',
      isCurrentUser: false,
    },
    {
      id: '2',
      text: 'Copy that. Rope access team is ready.',
      sender: 'You',
      timestamp: '8:05 AM',
      type: 'text',
      isCurrentUser: true,
    },
    {
      id: '3',
      text: 'Photo of the conduit issue at tank B',
      sender: 'Mike Rogers',
      timestamp: '9:15 AM',
      type: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400',
      isCurrentUser: false,
    },
    {
      id: '4',
      text: 'Voice note about safety briefing',
      sender: 'Sarah Chen',
      timestamp: '10:30 AM',
      type: 'voice',
      isCurrentUser: false,
    },
    {
      id: '5',
      text: 'Thanks for the update. Will address the conduit issue after lunch.',
      sender: 'You',
      timestamp: '11:42 AM',
      type: 'text',
      isCurrentUser: true,
    },
  ];

  const handleSend = () => {
    if (message.trim()) {
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const handleAttachment = () => {
    console.log('Opening attachment picker');
  };

  return (
    <View style={styles.container}>
      {/* Messages */}
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageWrapper,
              msg.isCurrentUser ? styles.messageWrapperRight : styles.messageWrapperLeft,
            ]}
          >
            {!msg.isCurrentUser && (
              <Text style={[styles.senderName, { color: theme.colors.text }]}>
                {msg.sender}
              </Text>
            )}
            <View
              style={[
                styles.messageBubble,
                msg.isCurrentUser
                  ? { backgroundColor: theme.colors.primary }
                  : { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
              ]}
            >
              {msg.type === 'text' && (
                <Text
                  style={[
                    styles.messageText,
                    { color: msg.isCurrentUser ? '#fff' : theme.colors.text },
                  ]}
                >
                  {msg.text}
                </Text>
              )}
              {msg.type === 'image' && (
                <View>
                  <Text
                    style={[
                      styles.messageText,
                      { color: msg.isCurrentUser ? '#fff' : theme.colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  {msg.imageUrl && (
                    <Image
                      source={{ uri: msg.imageUrl }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                </View>
              )}
              {msg.type === 'voice' && (
                <View style={styles.voiceMessage}>
                  <IconSymbol
                    ios_icon_name="waveform"
                    android_material_icon_name="graphic_eq"
                    size={20}
                    color={msg.isCurrentUser ? '#fff' : theme.colors.primary}
                  />
                  <Text
                    style={[
                      styles.messageText,
                      { color: msg.isCurrentUser ? '#fff' : theme.colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>
                  <IconSymbol
                    ios_icon_name="play.circle.fill"
                    android_material_icon_name="play_circle"
                    size={24}
                    color={msg.isCurrentUser ? '#fff' : theme.colors.primary}
                  />
                </View>
              )}
            </View>
            <Text style={[styles.timestamp, { color: theme.colors.text }]}>
              {msg.timestamp}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Floating Add Button */}
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

      {/* Input Bar */}
      <View style={[styles.inputContainer, { backgroundColor: theme.colors.card, borderTopColor: theme.colors.border }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
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
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
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
  },
});
