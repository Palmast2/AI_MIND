import React, { useMemo, useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  KeyboardEvent,
  NativeSyntheticEvent,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { RadarChart } from 'react-native-gifted-charts';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';

import { SKINS, STORAGE_KEY } from './skins';

import { Audio } from 'expo-av';
import { VoiceIcon } from 'icons/Voice';
import { DeleteIcon } from 'icons/Delete';
import { PauseIcon } from 'icons/Pause';
import { PlayIcon } from 'icons/Play';
import { SendIcon } from 'icons/Enviar';

function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const bytes = new Uint8Array(buffer);
  let base64 = '';
  let i = 0;
  for (; i < bytes.length - 2; i += 3) {
    base64 += chars[bytes[i] >> 2];
    base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
    base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
    base64 += chars[bytes[i + 2] & 63];
  }
  if (i < bytes.length) {
    base64 += chars[bytes[i] >> 2];
    if (i === bytes.length - 1) {
      base64 += chars[(bytes[i] & 3) << 4] + '==';
    } else {
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[(bytes[i + 1] & 15) << 2] + '=';
    }
  }
  return base64;
}

export async function downloadAndOpenMonthlyPdfExpo(): Promise<void> {
  const cookiesString = await AsyncStorage.getItem('cookies');
  if (!cookiesString) {
    Alert.alert('Sesión requerida', 'Inicia sesión para generar y descargar el informe.');
    throw new Error('No se encontraron cookies guardadas');
  }
  const cookies = JSON.parse(cookiesString);
  const csrf = cookies?.csrf_access_token ?? '';

  const { year, month } = getCurrentYearMonth();
  const url = `https://api.aimind.portablelab.work/api/v1/pdf/${year}/${String(month).padStart(2, '0')}`;

  const headers: Record<string, string> = {
    Accept: 'application/pdf',
    'X-CSRF-TOKEN': csrf,
    'X-Requested-With': 'XMLHttpRequest',
  };

  async function fetchPreservingHeaders(u: string, maxHops = 3): Promise<Response> {
    let current = u;
    for (let i = 0; i < maxHops; i++) {
      const r = await fetch(current, {
        method: 'GET',
        headers,
        redirect: 'manual' as RequestRedirect,
      });
      if (![301, 302, 303, 307, 308].includes(r.status)) return r;
      const next = r.headers.get('location');
      if (!next) return r;
      current = new URL(next, current).toString();
    }
    throw new Error('Demasiadas redirecciones');
  }

  let resp = await fetchPreservingHeaders(url);

  if (resp.status === 202) {
    for (let i = 0; i < 5; i++) {
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
      resp = await fetchPreservingHeaders(url);
      if (resp.ok) break;
    }
  }

  if (resp.status === 401) {
    Alert.alert('No autorizado', 'El servidor no aceptó la solicitud (401).');
    throw new Error('PDF status 401');
  }
  if (!resp.ok) {
    Alert.alert('No se pudo generar el informe', `Código ${resp.status}.`);
    throw new Error(`PDF status ${resp.status}`);
  }

  const buffer = await resp.arrayBuffer();
  const base64 =
    typeof Buffer !== 'undefined'
      ? Buffer.from(buffer).toString('base64')
      : arrayBufferToBase64(buffer);

  const fileName = `informe-${year}-${String(month).padStart(2, '0')}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const info = await FileSystem.getInfoAsync(fileUri);
  if (!info.exists || (info.size ?? 0) < 100) {
    Alert.alert('Informe vacío', 'El archivo descargado parece estar vacío. Intenta de nuevo.');
    throw new Error('PDF muy pequeño o inexistente');
  }

  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/pdf',
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
    } else {
      await Linking.openURL(fileUri);
    }
  } catch (err) {
    console.error('Error abriendo PDF:', err);
    Alert.alert('PDF descargado', `Guardado en: ${fileUri}`);
  }
}

async function fetchWeeklyEmotions(): Promise<number[]> {
  const cookiesString = await AsyncStorage.getItem('cookies');
  if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

  const cookies = JSON.parse(cookiesString);
  const token = cookies.csrf_access_token;

  const resp = await fetch('https://api.aimind.portablelab.work/api/v1/emociones/semanales', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
    },
    credentials: 'include',
  });

  if (!resp.ok) throw new Error(`Error emociones: ${resp.status}`);

  const data = await resp.json();
  const w = data?.weekly_emotions ?? {};

  const tristeza = Number(w['tristeza'] ?? 0);
  const alegria = Number(w['alegría'] ?? w['alegria'] ?? 0);
  const tranquilidad = Number(w['tranquilidad'] ?? 0);
  const sorpresa = Number(w['sorpresa'] ?? 0);
  const otros = Number(w['otros'] ?? 0);

  return [tristeza, alegria, tranquilidad, sorpresa, otros];
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();

  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const [skinKey, setSkinKey] = useState<string>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  const [radarValues, setRadarValues] = useState<number[]>([0, 0, 0, 0, 0]);
  const radarLabels = ['Tristeza', 'Alegría', 'Tranquilidad', 'Sorpresa', 'Otros'];
  const [radarDataLabels, setRadarDataLabels] = useState<string[]>(['0', '0', '0', '0', '0']);

  const scrollRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  // ====== AUDIO (Home composer) ======
  const [composerMode, setComposerMode] = useState<'text' | 'record'>('text');
  const [isPaused, setIsPaused] = useState(false);

  // 👇 igual que ChatScreen: guardamos la grabación también en state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);

  const [recordUri, setRecordUri] = useState<string | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const isStartingRef = useRef(false);
  const isCleaningRef = useRef(false);

  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRecordTimer = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  const startRecordTimer = useCallback(() => {
    stopRecordTimer();
    recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
  }, [stopRecordTimer]);

  const resetRecordTimer = useCallback(() => {
    stopRecordTimer();
    setRecordSeconds(0);
  }, [stopRecordTimer]);

  const formatTime = useCallback((s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const ensureMicPermission = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('Permiso de micrófono denegado');
  }, []);

  // 🔥 limpieza segura (evita bugs de "already unloaded" / "cannot prepare")
  const cleanupRecording = useCallback(async () => {
    if (isCleaningRef.current) return;
    isCleaningRef.current = true;

    try {
      const rec = recordingRef.current;
      recordingRef.current = null;
      setRecording(null);

      if (rec) {
        try {
          const st = await rec.getStatusAsync().catch(() => null);
          if (st && st.isLoaded) {
            await rec.stopAndUnloadAsync().catch(() => {});
          }
        } catch {
          // ignore
        }
      }
    } finally {
      isCleaningRef.current = false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;

    try {
      Keyboard.dismiss();
      setComposerMode('record');

      setIsPaused(false);
      setRecordUri(null);
      resetRecordTimer();

      await ensureMicPermission();

      // suelta cualquier rec previa (clave)
      await cleanupRecording();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      // ✅ estilo ChatScreen: createAsync (más estable que prepare/start manual)
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = rec;
      setRecording(rec);

      startRecordTimer();
    } catch (e) {
      console.log('startRecording error:', e);
      await cleanupRecording();
      setComposerMode('text');
      setIsPaused(false);
      setRecordUri(null);
      resetRecordTimer();
    } finally {
      isStartingRef.current = false;
    }
  }, [cleanupRecording, ensureMicPermission, resetRecordTimer, startRecordTimer]);

  const pauseRecording = useCallback(async () => {
    if (!recording) return;
    try {
      await recording.pauseAsync();
      setIsPaused(true);
      stopRecordTimer();
    } catch (e) {
      console.log('pauseRecording error:', e);
    }
  }, [recording, stopRecordTimer]);

  const resumeRecording = useCallback(async () => {
    if (!recording) return;
    try {
      // En expo-av se reanuda con startAsync()
      await recording.startAsync();
      setIsPaused(false);
      startRecordTimer();
    } catch (e) {
      console.log('resumeRecording error:', e);
    }
  }, [recording, startRecordTimer]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    const rec = recordingRef.current;
    if (!rec) return null;

    try {
      stopRecordTimer();
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();

      // limpiar refs/estado
      recordingRef.current = null;
      setRecording(null);

      setRecordUri(uri ?? null);
      return uri ?? null;
    } catch (e) {
      console.log('stopRecording error:', e);
      return null;
    }
  }, [stopRecordTimer]);

  const deleteRecording = useCallback(async () => {
    try {
      stopRecordTimer();
      if (recording) {
        await recording.stopAndUnloadAsync().catch(() => {});
      }
    } finally {
      setRecording(null);
      setRecordUri(null);
      setIsPaused(false);
      resetRecordTimer();
      setComposerMode('text');
    }
  }, [recording, resetRecordTimer, stopRecordTimer]);

  // ✅ Enviar audio: navegar a Chat con el URI (idéntico a tu intención)
  const onSendRecording = useCallback(async () => {
    let uri = recordUri;

    // si aún no hay uri pero sí hay grabación activa, detenla y obtén uri
    if (!uri && recordingRef.current) {
      uri = await stopRecording();
    }
    if (!uri) return;

    // vuelve a estado normal inmediatamente
    setComposerMode('text');
    setIsPaused(false);

    navigation.navigate('Chat', {
      initialAudioUri: uri,
      initialAudioDurationSec: recordSeconds,
    });

    // resetea UI local
    setRecordUri(null);
    resetRecordTimer();
  }, [navigation, recordUri, recordSeconds, stopRecording, resetRecordTimer]);

  // ✅ Cleanup ÚNICO (borra el duplicado que tenías)
  useEffect(() => {
    return () => {
      stopRecordTimer();
      cleanupRecording();
    };
  }, [cleanupRecording, stopRecordTimer]);

  // 🔽 Altura dinámica del teclado en Android para mover SOLO el composer
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (e: any) => setKeyboardHeight(e.endCoordinates?.height ?? 0);
    const onHide = () => setKeyboardHeight(0);

    const s1 = Keyboard.addListener(showEvt, onShow);
    const s2 = Keyboard.addListener(hideEvt, onHide);

    return () => {
      s1.remove();
      s2.remove();
    };
  }, []);

  const handleInformePress = async () => {
    try {
      setIsDownloading(true);
      await downloadAndOpenMonthlyPdfExpo();
    } catch (e: any) {
      console.error(e);
      Alert.alert(
        'No se pudo abrir el PDF',
        'Por cuestiones de costos generaremos el informe mas adelante'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className="flex flex-row">
          <TouchableOpacity
            onPress={() => navigation.navigate('Skins')}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Skins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleInformePress}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Informe</Text>
          </TouchableOpacity>
        </View>
      ),
      headerStyle: { backgroundColor: '#00634C' },
      headerTitleStyle: { color: '#fff' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  // Carga skin guardada
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (!isActive) return;
          if (!saved) {
            setSkinKey('default');
            setRemoteUri(null);
            return;
          }
          if (/^https?:\/\//i.test(saved) || /^file:\/\//i.test(saved)) {
            setRemoteUri(saved);
            setSkinKey('default');
          } else if ((SKINS as any)[saved]) {
            setSkinKey(saved);
            setRemoteUri(null);
          } else {
            setSkinKey('default');
            setRemoteUri(null);
          }
        } catch {
          setSkinKey('default');
          setRemoteUri(null);
        }
      })();
      return () => {
        isActive = false;
      };
    }, [])
  );

  // Carga emociones
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const values = await fetchWeeklyEmotions();
          if (!mounted) return;
          setRadarValues(values);
          setRadarDataLabels(values.map((v) => String(v)));
        } catch (e) {
          console.error(e);
          if (!mounted) return;
          setRadarValues([0, 0, 0, 0, 0]);
          setRadarDataLabels(['0', '0', '0', '0', '0']);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  const imageSource = useMemo(() => {
    if (remoteUri) return { uri: remoteUri };
    return SKINS[skinKey] ?? SKINS.default;
  }, [skinKey, remoteUri]);

  const handleFocus = () => {
    setIsFocused(true);
    // ⛔️ Ya NO usamos scrollToFocusedInput para que el contenido no se mueva
  };
  const handleBlur = () => setIsFocused(false);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    Keyboard.dismiss();
    navigation.navigate('Chat', { initialMessage: msg });
    setText('');
  };

  // Tamaño del composer para no tapar contenido
  const [composerHeight, setComposerHeight] = useState(72);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#00634C' }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingHorizontal: 16,
            // deja espacio para el composer fijo (no se moverá con el teclado)
            paddingBottom: composerHeight + 16 + insets.bottom,
          }}
          enableOnAndroid
          enableAutomaticScroll={false} // ⛔️ desactivado para que no empuje el layout
          enableResetScrollToCoords={false}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
          {/* Radar de emociones */}
          <View style={{ width: 25, height: 25, alignSelf: 'center', transform: [{ scale: 0.5 }] }}>
            <RadarChart
              data={radarValues}
              labels={radarLabels}
              labelConfig={{ stroke: 'white', fontWeight: 'bold', fontSize: 10 }}
              dataLabels={radarDataLabels}
              maxValue={10}
              noOfSections={5}
            />
          </View>

          {/* Imagen del pet (ya no se moverá con el teclado) */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Image source={imageSource} style={{ width: 300, height: 300 }} resizeMode="contain" />
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>

      {/* Composer FIJO (solo esto sube) */}
      {Platform.OS === 'ios' ? (
        <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={headerHeight + insets.top}>
          <View
            onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              left: 16,
              right: 16,
              bottom: insets.bottom + 8, // iOS lo levanta KAV
            }}>
            {composerMode === 'record' ? (
              <View style={{ width: '100%', gap: 8 }}>
                {/* Barra superior */}
                <View
                  style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: 24,
                    paddingHorizontal: 12,
                    minHeight: 56,
                    elevation: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}>
                  <VoiceIcon size={22} color="#00634C" />
                  <Text style={{ color: '#4A4A4A', fontSize: 18, fontWeight: '600' }}>
                    {formatTime(recordSeconds)}
                  </Text>
                  <View style={{ flex: 1 }} />
                </View>

                {/* Barra inferior */}
                <View
                  style={{
                    width: '100%',
                    backgroundColor: 'white',
                    borderRadius: 24,
                    paddingHorizontal: 12,
                    minHeight: 56,
                    elevation: 3,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                  <TouchableOpacity
                    onPress={deleteRecording}
                    disabled={loading}
                    style={{ padding: 10 }}>
                    <DeleteIcon size={24} color="black" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={isPaused ? resumeRecording : pauseRecording}
                    disabled={loading}
                    style={{ padding: 10 }}>
                    {isPaused ? (
                      <PlayIcon size={28} color="black" />
                    ) : (
                      <PauseIcon size={28} color="black" />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onSendRecording}
                    disabled={loading}
                    style={{ padding: 10 }}>
                    <SendIcon size={24} color="black" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '100%',
                  backgroundColor: 'white',
                  borderRadius: 24,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  shadowColor: '#000',
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  marginBottom: 8,
                }}>
                <TextInput
                  ref={inputRef}
                  placeholder="¿Cómo ha estado tu día?"
                  placeholderTextColor="#00634C"
                  style={{
                    flex: 1,
                    color: '#00634C',
                    fontSize: 16,
                    minHeight: 40,
                    maxHeight: 140,
                    textAlignVertical: 'top',
                  }}
                  value={text}
                  onChangeText={setText}
                  multiline
                  numberOfLines={1}
                  scrollEnabled
                  returnKeyType="send"
                  blurOnSubmit={true}
                  onSubmitEditing={handleSend}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  editable={!loading}
                />

                {/* Enviar texto */}
                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!text.trim() || loading}
                  style={{
                    marginLeft: 8,
                    borderRadius: 999,
                    backgroundColor: '#0b7',
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    opacity: !text.trim() || loading ? 0.6 : 1,
                  }}>
                  <Text style={{ color: 'white', fontWeight: '700' }}>Enviar</Text>
                </TouchableOpacity>

                {/* Mic */}
                <TouchableOpacity
                  onPress={startRecording}
                  disabled={loading}
                  style={{
                    marginLeft: 8,
                    borderRadius: 999,
                    backgroundColor: 'white',
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    opacity: loading ? 0.6 : 1,
                  }}>
                  <VoiceIcon size={22} color="black" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      ) : (
        // ANDROID: movemos SOLO el composer con la altura del teclado
        <View
          onLayout={(e) => setComposerHeight(e.nativeEvent.layout.height)}
          style={{
            position: 'absolute',
            left: 16,
            right: 16,
            bottom: insets.bottom + 8,
          }}>
          {composerMode === 'record' ? (
            <View style={{ width: '100%', gap: 8 }}>
              {/* Barra superior */}
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'white',
                  borderRadius: 24,
                  paddingHorizontal: 12,
                  minHeight: 56,
                  elevation: 3,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                }}>
                <VoiceIcon size={22} color="#00634C" />
                <Text style={{ color: '#4A4A4A', fontSize: 18, fontWeight: '600' }}>
                  {formatTime(recordSeconds)}
                </Text>
                <View style={{ flex: 1 }} />
              </View>

              {/* Barra inferior */}
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'white',
                  borderRadius: 24,
                  paddingHorizontal: 12,
                  minHeight: 56,
                  elevation: 3,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <TouchableOpacity
                  onPress={deleteRecording}
                  disabled={loading}
                  style={{ padding: 10 }}>
                  <DeleteIcon size={24} color="black" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={isPaused ? resumeRecording : pauseRecording}
                  disabled={loading}
                  style={{ padding: 10 }}>
                  {isPaused ? (
                    <PlayIcon size={28} color="black" />
                  ) : (
                    <PauseIcon size={28} color="black" />
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onSendRecording}
                  disabled={loading}
                  style={{ padding: 10 }}>
                  <SendIcon size={24} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                marginBottom: 8,
              }}>
              <TextInput
                ref={inputRef}
                placeholder="¿Cómo ha estado tu día?"
                placeholderTextColor="#00634C"
                style={{
                  flex: 1,
                  color: '#00634C',
                  fontSize: 16,
                  minHeight: 40,
                  maxHeight: 140,
                  textAlignVertical: 'top',
                }}
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={1}
                scrollEnabled
                returnKeyType="send"
                blurOnSubmit={true}
                onSubmitEditing={handleSend}
                onFocus={handleFocus}
                onBlur={handleBlur}
                editable={!loading}
              />

              {/* Enviar texto */}
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || loading}
                style={{
                  marginLeft: 8,
                  borderRadius: 999,
                  backgroundColor: '#0b7',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  opacity: !text.trim() || loading ? 0.6 : 1,
                }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Enviar</Text>
              </TouchableOpacity>

              {/* Mic */}
              <TouchableOpacity
                onPress={startRecording}
                disabled={loading}
                style={{
                  marginLeft: 8,
                  borderRadius: 999,
                  backgroundColor: 'white',
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  opacity: loading ? 0.6 : 1,
                }}>
                <VoiceIcon size={22} color="black" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Modal de carga para la descarga/generación del PDF */}
      <Modal visible={isDownloading} transparent animationType="fade" statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}>
          <View
            style={{
              width: 280,
              padding: 20,
              borderRadius: 16,
              backgroundColor: 'white',
              alignItems: 'center',
            }}>
            <ActivityIndicator size="large" />
            <Text style={{ marginTop: 12, fontWeight: '700', fontSize: 16, color: '#0a0a0a' }}>
              Generando informe…
            </Text>
            <Text style={{ marginTop: 6, textAlign: 'center', color: '#404040' }}>
              Esto puede tardar un poco.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
