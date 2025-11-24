
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import * as Speech from 'expo-speech';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

interface ScopeUploadModalProps {
  visible: boolean;
  jobId: string;
  jobName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScopeUploadModal({
  visible,
  jobId,
  jobName,
  onClose,
  onSuccess,
}: ScopeUploadModalProps) {
  const theme = useTheme();
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileUri, setFileUri] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleClose = () => {
    if (!loading) {
      setContent('');
      setFileName('');
      setFileType('');
      setFileUri('');
      onClose();
    }
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.google-apps.document',
          'text/plain',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        console.log('Document picker canceled');
        return;
      }

      const file = result.assets[0];
      console.log('Document picked:', file);

      setFileName(file.name);
      setFileType(file.mimeType || 'unknown');
      setFileUri(file.uri);

      // For text files, try to read content
      if (file.mimeType === 'text/plain') {
        try {
          const response = await fetch(file.uri);
          const text = await response.text();
          setContent(text);
          Alert.alert('Success', 'Text file loaded successfully');
        } catch (error) {
          console.error('Error reading text file:', error);
          Alert.alert('Info', 'File attached. Please add or paste the document content in the text area.');
        }
      } else {
        Alert.alert(
          'Document Attached',
          `${file.name} has been attached. Please paste or type the document content in the text area below.`
        );
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const handleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      Alert.alert(
        'Voice Input',
        'Voice-to-text is not yet fully implemented. Please use the text input or paste content instead.'
      );
    } else {
      Alert.alert(
        'Voice Input',
        'Voice-to-text functionality requires additional setup. For now, please type or paste your content.'
      );
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Error', 'Please enter or paste the scope document content');
      return;
    }

    try {
      setLoading(true);
      console.log('Starting scope document processing...');

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Not authenticated. Please log in again.');
      }

      console.log('Session valid, calling edge function...');
      console.log('Job ID:', jobId);
      console.log('Content length:', content.trim().length);

      // Call edge function to process scope
      const { data, error } = await supabase.functions.invoke('process-scope', {
        body: {
          jobId,
          content: content.trim(),
          fileName: fileName || undefined,
          fileType: fileType || undefined,
          fileUri: fileUri || undefined,
        },
      });

      console.log('Edge function response:', { data, error });

      if (error) {
        console.error('Error processing scope:', error);
        throw new Error(error.message || 'Failed to process scope document');
      }

      if (!data || !data.success) {
        console.error('Unexpected response:', data);
        throw new Error(data?.error || 'Failed to process scope document');
      }

      console.log('Scope processed successfully:', data);

      Alert.alert(
        'Success',
        'Scope document has been processed and the job overview has been updated!',
        [
          {
            text: 'OK',
            onPress: () => {
              handleClose();
              onSuccess();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Exception processing scope:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to process scope document. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Add Scope Document</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={theme.colors.text}
              />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: theme.colors.text }]}>
            {jobName}
          </Text>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={handlePickDocument}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name="doc.badge.plus"
                android_material_icon_name="attach_file"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                Attach File
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
              onPress={handleVoiceInput}
              disabled={loading}
            >
              <IconSymbol
                ios_icon_name={isListening ? 'mic.fill' : 'mic'}
                android_material_icon_name="mic"
                size={20}
                color={isListening ? '#EF4444' : theme.colors.primary}
              />
              <Text style={[styles.actionButtonText, { color: theme.colors.text }]}>
                {isListening ? 'Listening...' : 'Voice Input'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* File Info */}
          {fileName && (
            <View style={[styles.fileInfo, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
              <IconSymbol
                ios_icon_name="doc"
                android_material_icon_name="description"
                size={16}
                color={theme.colors.text}
              />
              <Text style={[styles.fileInfoText, { color: theme.colors.text }]} numberOfLines={1}>
                {fileName}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFileName('');
                  setFileType('');
                  setFileUri('');
                }}
                disabled={loading}
              >
                <IconSymbol
                  ios_icon_name="xmark.circle.fill"
                  android_material_icon_name="cancel"
                  size={20}
                  color={theme.colors.text}
                  style={{ opacity: 0.5 }}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* Text Input */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              placeholder="Type or paste the scope document content here...&#10;&#10;You can also attach a document above and paste its content here."
              placeholderTextColor={theme.colors.text + '80'}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              editable={!loading}
            />
          </ScrollView>

          {/* Submit Button */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: theme.colors.primary },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleSubmit}
              disabled={loading || !content.trim()}
            >
              {loading ? (
                <React.Fragment>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.submitButtonText}>Processing...</Text>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="arrow.up.circle.fill"
                    android_material_icon_name="send"
                    size={20}
                    color="#fff"
                  />
                  <Text style={styles.submitButtonText}>Process Scope Document</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    maxHeight: '90%',
    boxShadow: '0px -4px 16px rgba(0, 0, 0, 0.2)',
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  fileInfoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    marginBottom: 16,
  },
  scrollContent: {
    flexGrow: 1,
  },
  textInput: {
    minHeight: 200,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingTop: 16,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
