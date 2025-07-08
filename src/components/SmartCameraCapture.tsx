import type { ImageClassificationResult } from '../services/AIVisionService';
import { aiVisionService } from '../services/AIVisionService';
import { webSocketService } from '../services/WebSocketService';
import { useTheme } from '../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { Camera, CameraType, FlashMode } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ActivityIndicator,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';

interface SmartCameraCaptureProps {
  mode: 'waste' | 'food' | 'transport' | 'energy';
  onResult: (result: ImageClassificationResult) => void;
  onClose: () => void;
  visible: boolean;
}

interface CaptureState {
  isProcessing: boolean;
  hasPermission: boolean;
  flashMode: FlashMode;
  cameraType: CameraType;
  capturedUri?: string;
  result?: ImageClassificationResult;
  error?: string;
}

const { width: _width, height: _height } = Dimensions.get('window');

export const SmartCameraCapture: React.FC<SmartCameraCaptureProps> = ({
  mode,
  onResult,
  onClose,
  visible,
}) => {
  const theme = useTheme();
  const cameraRef = useRef<Camera>(null);

  const [state, setState] = useState<CaptureState>({
    isProcessing: false,
    hasPermission: false,
    flashMode: FlashMode.off,
    cameraType: CameraType.back,
  });

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      requestCameraPermissions();
      animateIn();
    }
  }, [visible]);

  useEffect(() => {
    if (state.isProcessing) {
      animateProgress();
    }
  }, [state.isProcessing]);

  const requestCameraPermissions = async () => {
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setState(prev => ({ ...prev, hasPermission: status === 'granted' }));

      if (status !== 'granted') {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission to use smart capture features.',
          [
            { text: 'Cancel', onPress: onClose },
            {
              text: 'Settings',
              onPress: () => {
                /* Open settings */
              },
            },
          ],
        );
      }
    } catch (error) {
      console.error('Camera permission error:', error);
      setState(prev => ({ ...prev, error: 'Camera permission denied' }));
    }
  };

  const animateIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateOut = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(callback);
  };

  const animateProgress = () => {
    progressAnim.setValue(0);
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: 3000,
      useNativeDriver: false,
    }).start();
  };

  const capturePhoto = async () => {
    if (!cameraRef.current || state.isProcessing) return;

    try {
      setState(prev => ({ ...prev, isProcessing: true, error: undefined }));

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        skipProcessing: false,
      });

      // Optimize image for AI processing
      const optimizedImage = await optimizeImageForAI(photo.uri);

      // Classify the image based on mode
      const result = await classifyImage(optimizedImage.uri);

      setState(prev => ({
        ...prev,
        isProcessing: false,
        capturedUri: optimizedImage.uri,
        result,
      }));

      // Send result to WebSocket for real-time updates
      await notifyRealTimeClassification(result);
    } catch (error) {
      console.error('Photo capture error:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to capture and process image',
      }));
    }
  };

  const selectFromGallery = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert(
          'Permission required',
          'Please grant photo library access.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setState(prev => ({ ...prev, isProcessing: true }));

        const optimizedImage = await optimizeImageForAI(result.assets[0].uri);
        const classificationResult = await classifyImage(optimizedImage.uri);

        setState(prev => ({
          ...prev,
          isProcessing: false,
          capturedUri: optimizedImage.uri,
          result: classificationResult,
        }));

        await notifyRealTimeClassification(classificationResult);
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: 'Failed to process selected image',
      }));
    }
  };

  const optimizeImageForAI = async (uri: string) => {
    try {
      return await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 512, height: 512 } }],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.JPEG,
        },
      );
    } catch (error) {
      console.error('Image optimization error:', error);
      return { uri }; // Return original if optimization fails
    }
  };

  const classifyImage = async (
    uri: string,
  ): Promise<ImageClassificationResult> => {
    switch (mode) {
      case 'waste':
        return await aiVisionService.classifyWasteImage(uri);
      case 'food':
        return await aiVisionService.recognizeFoodImage(uri);
      case 'transport':
        return await aiVisionService.detectTransportMode(uri);
      case 'energy': {
        const meterReading = await aiVisionService.readEnergyMeter(uri);
        return {
          category: 'energy',
          subcategory: meterReading.meterType,
          confidence: meterReading.confidence,
          carbonImpact: meterReading.carbonEquivalent,
          suggestions: [
            `Reading: ${meterReading.value} ${meterReading.unit}`,
            `Estimated cost: $${meterReading.estimatedCost.toFixed(2)}`,
            `Efficiency: ${meterReading.efficiency}`,
          ],
          metadata: {
            processingTime: 0,
            modelVersion: 'energy-v1',
            imageQuality: 0.8,
          },
        };
      }
      default:
        throw new Error(`Unsupported classification mode: ${mode}`);
    }
  };

  const notifyRealTimeClassification = async (
    result: ImageClassificationResult,
  ) => {
    try {
      await webSocketService.sendMessage({
        id: `classification_${Date.now()}`,
        type: 'ai_classification',
        payload: {
          mode,
          result,
          timestamp: Date.now(),
        },
        timestamp: Date.now(),
        priority: 'normal',
      });
    } catch (error) {
      console.error('Failed to send real-time classification:', error);
    }
  };

  const toggleFlash = () => {
    setState(prev => ({
      ...prev,
      flashMode:
        prev.flashMode === FlashMode.off ? FlashMode.on : FlashMode.off,
    }));
  };

  const _toggleCamera = () => {
    setState(prev => ({
      ...prev,
      cameraType:
        prev.cameraType === CameraType.back
          ? CameraType.front
          : CameraType.back,
    }));
  };

  const retryCapture = () => {
    setState(prev => ({
      ...prev,
      capturedUri: undefined,
      result: undefined,
      error: undefined,
    }));
  };

  const confirmResult = () => {
    if (state.result) {
      onResult(state.result);
      animateOut(() => onClose());
    }
  };

  const getModeInfo = () => {
    const modeInfoMap = {
      waste: {
        title: 'Smart Waste Detection',
        description:
          'Point camera at waste items to identify recycling category',
        icon: 'trash-bin',
        tips: [
          'Ensure good lighting',
          'Center the item in frame',
          'Remove any labels if possible',
        ],
      },
      food: {
        title: 'Food Recognition',
        description: 'Identify food items and get carbon footprint data',
        icon: 'restaurant',
        tips: [
          'Show the whole food item',
          'Use natural lighting',
          'Single items work best',
        ],
      },
      transport: {
        title: 'Transport Detection',
        description: 'Identify transportation modes for carbon tracking',
        icon: 'car',
        tips: [
          'Capture clear view of vehicle',
          'Include identifying features',
          'Avoid motion blur',
        ],
      },
      energy: {
        title: 'Energy Meter Reading',
        description: 'Read utility meters automatically',
        icon: 'speedometer',
        tips: [
          'Ensure meter display is clear',
          'Remove any glare',
          'Frame the entire display',
        ],
      },
    };

    return modeInfoMap[mode];
  };

  const renderHeader = () => {
    const modeInfo = getModeInfo();

    return (
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => animateOut(() => onClose())}
        >
          <Ionicons name='close' size={24} color={theme.colors.onSurface} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Ionicons
            name={modeInfo.icon as any}
            size={24}
            color={theme.colors.primary}
          />
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            {modeInfo.title}
          </Text>
        </View>

        <Text
          style={[styles.headerDescription, { color: theme.colors.outline }]}
        >
          {modeInfo.description}
        </Text>
      </View>
    );
  };

  const renderCamera = () => {
    if (!state.hasPermission) {
      return (
        <View style={styles.permissionContainer}>
          <Ionicons name='camera-off' size={64} color={theme.colors.outline} />
          <Text
            style={[styles.permissionText, { color: theme.colors.onSurface }]}
          >
            Camera permission required
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.cameraContainer}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={state.cameraType}
          flashMode={state.flashMode}
          ratio='1:1'
        >
          <View style={styles.cameraOverlay}>
            {/* Viewfinder */}
            <View style={styles.viewfinder}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            {/* AI Processing Indicator */}
            {state.isProcessing && (
              <View style={styles.processingOverlay}>
                <Animated.View
                  style={[
                    styles.processingBar,
                    {
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
                <Text style={styles.processingText}>AI Processing...</Text>
              </View>
            )}
          </View>
        </Camera>
      </View>
    );
  };

  const renderControls = () => (
    <View style={[styles.controls, { backgroundColor: theme.colors.surface }]}>
      <TouchableOpacity
        style={styles.controlButton}
        onPress={selectFromGallery}
      >
        <Ionicons name='images' size={24} color={theme.colors.onSurface} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.captureButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={capturePhoto}
        disabled={state.isProcessing}
      >
        {state.isProcessing ? (
          <ActivityIndicator color={theme.colors.onPrimary} />
        ) : (
          <Ionicons name='camera' size={32} color={theme.colors.onPrimary} />
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
        <Ionicons
          name={state.flashMode === FlashMode.on ? 'flash' : 'flash-off'}
          size={24}
          color={theme.colors.onSurface}
        />
      </TouchableOpacity>
    </View>
  );

  const renderResult = () => {
    if (!state.result) return null;

    return (
      <ScrollView style={styles.resultContainer}>
        <View
          style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.resultHeader}>
            <Ionicons
              name={
                state.result.confidence > 0.8 ? 'checkmark-circle' : 'warning'
              }
              size={24}
              color={state.result.confidence > 0.8 ? '#4CAF50' : '#FF9800'}
            />
            <Text
              style={[styles.resultTitle, { color: theme.colors.onSurface }]}
            >
              {state.result.subcategory || state.result.category}
            </Text>
            <Text style={[styles.confidence, { color: theme.colors.outline }]}>
              {(state.result.confidence * 100).toFixed(0)}% confidence
            </Text>
          </View>

          <View style={styles.carbonImpact}>
            <Ionicons name='leaf' size={20} color='#4CAF50' />
            <Text
              style={[styles.carbonText, { color: theme.colors.onSurface }]}
            >
              {state.result.carbonImpact.toFixed(2)} kg CO₂
            </Text>
          </View>

          <View style={styles.suggestions}>
            <Text
              style={[
                styles.suggestionsTitle,
                { color: theme.colors.onSurface },
              ]}
            >
              Suggestions:
            </Text>
            {state.result.suggestions.map((suggestion, index) => (
              <Text
                key={index}
                style={[styles.suggestionItem, { color: theme.colors.outline }]}
              >
                • {suggestion}
              </Text>
            ))}
          </View>

          <View style={styles.resultActions}>
            <TouchableOpacity
              style={[
                styles.resultButton,
                { backgroundColor: theme.colors.outline },
              ]}
              onPress={retryCapture}
            >
              <Text
                style={[
                  styles.resultButtonText,
                  { color: theme.colors.onSurface },
                ]}
              >
                Retry
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.resultButton,
                { backgroundColor: theme.colors.primary },
              ]}
              onPress={confirmResult}
            >
              <Text
                style={[
                  styles.resultButtonText,
                  { color: theme.colors.onPrimary },
                ]}
              >
                Confirm
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderTips = () => {
    const modeInfo = getModeInfo();

    return (
      <View
        style={[
          styles.tipsContainer,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <Text style={[styles.tipsTitle, { color: theme.colors.onSurface }]}>
          Tips:
        </Text>
        {modeInfo.tips.map((tip, index) => (
          <Text
            key={index}
            style={[styles.tipItem, { color: theme.colors.outline }]}
          >
            • {tip}
          </Text>
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType='none'
      presentationStyle='fullScreen'
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: theme.colors.background },
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {renderHeader()}

        {state.result ? (
          renderResult()
        ) : (
          <>
            {renderCamera()}
            {renderControls()}
            {renderTips()}
          </>
        )}

        {state.error && (
          <View style={[styles.errorContainer, { backgroundColor: '#FF5252' }]}>
            <Text style={styles.errorText}>{state.error}</Text>
          </View>
        )}
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  headerDescription: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewfinder: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  processingOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 12,
  },
  processingBar: {
    height: 4,
    backgroundColor: '#4CAF50',
    borderRadius: 2,
    marginBottom: 8,
  },
  processingText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
    paddingHorizontal: 40,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tipsContainer: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  resultContainer: {
    flex: 1,
    padding: 20,
  },
  resultCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    textTransform: 'capitalize',
  },
  confidence: {
    fontSize: 14,
    marginTop: 4,
  },
  carbonImpact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  carbonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  suggestions: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  suggestionItem: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  resultButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SmartCameraCapture;
