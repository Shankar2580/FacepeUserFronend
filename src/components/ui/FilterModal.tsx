import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scale, fontScale, wp } from '../../utils/responsive';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Check if device is tablet (width > 768)
const isTablet = SCREEN_WIDTH >= 768;

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, children }) => {
  const insets = useSafeAreaInsets();
  
  // Calculate safe bottom padding (more on tablets)
  const bottomPadding = Math.max(insets.bottom, scale(24)) + (isTablet ? scale(16) : 0);

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} />
        <View style={[
          styles.modalContainer, 
          { 
            paddingBottom: bottomPadding,
            // Limit max width on tablets for better UX
            maxWidth: isTablet ? 600 : '100%',
            alignSelf: 'center',
            width: isTablet ? '80%' : '100%',
          }
        ]}>
          {/* Handle bar for better UX */}
          <View style={styles.handleBar} />
          
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={scale(24)} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: scale(24),
    borderTopRightRadius: scale(24),
    maxHeight: isTablet ? '70%' : '85%',
    paddingTop: scale(8),
  },
  handleBar: {
    width: scale(40),
    height: scale(4),
    backgroundColor: '#D1D5DB',
    borderRadius: scale(2),
    alignSelf: 'center',
    marginBottom: scale(8),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: scale(24),
    paddingBottom: scale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: fontScale(20),
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: scale(8),
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: scale(24),
    paddingBottom: scale(16),
  },
});

export default FilterModal;
