import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Image,
  findNodeHandle,
  Platform,
  TouchableOpacity,
  Keyboard,
  Modal,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

import {
  SKINS,
  STORAGE_KEY,
  isRemoteValue,
  normalizeEmotion,
  resolveSourceByEmotion,
  type EmotionKey,
} from './skins';
import { VoiceIcon } from 'icons/Voice';
import { DeleteIcon } from 'icons/Delete';
import { PauseIcon } from 'icons/Pause';
import { PlayIcon } from 'icons/Play';
import { SendIcon } from 'icons/Enviar';

type Msg =
  | { id: string; role: 'user' | 'assistant'; type: 'text'; text: string }
  | { id: string; role: 'user' | 'assistant'; type: 'audio'; uri: string; durationSec?: number };

type EmergencyContact = {
  nombre: string;
  telefono: string;
  alias: string;
  relacion: string;
  id: number;
};

export default function ChatScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const initialMessage = route?.params?.initialMessage as string | undefined;
  const initialAudioUri = route?.params?.initialAudioUri as string | undefined;
  const initialAudioDurationSec = route?.params?.initialAudioDurationSec as number | undefined;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingType, setPendingType] = useState<'text' | 'audio' | null>(null);

  const [skinKey, setSkinKey] = useState<keyof typeof SKINS>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);
  const [emotionKey, setEmotionKey] = useState<EmotionKey | null>(null);

  const [crisisModalVisible, setCrisisModalVisible] = useState(false);
  const [rememberModalVisible, setRememberModalVisible] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [loadingEmergencyContacts, setLoadingEmergencyContacts] = useState(false);

  const listRef = useRef<KeyboardAwareFlatList<Msg>>(null);
  const inputRef = useRef<TextInput>(null);

  const nowId = (s: string) => `${Date.now()}_${Math.random().toString(36).slice(2)}_${s}`;

  const append = (m: Msg) => setMessages((prev) => [...prev, m]);

  const [composerMode, setComposerMode] = useState<'text' | 'record'>('text');
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordUri, setRecordUri] = useState<string | null>(null);

  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);

  const stopRecordTimer = useCallback(() => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  }, []);

  const startRecordTimer = useCallback(() => {
    stopRecordTimer();
    recordTimerRef.current = setInterval(() => {
      setRecordSeconds((s) => s + 1);
    }, 1000);
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

  const [playingUri, setPlayingUri] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const stopSound = useCallback(async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync().catch(() => {});
        await soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    } finally {
      setPlayingUri(null);
    }
  }, []);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      (listRef.current as any)?.scrollToOffset?.({
        offset: 999999,
        animated: true,
      });
    });
  }, []);

  const getAccessToken = async (): Promise<string> => {
    const cookiesString = await AsyncStorage.getItem('cookies');
    if (!cookiesString) throw new Error('No se encontraron cookies guardadas');
    const cookies = JSON.parse(cookiesString);
    const token = cookies.csrf_access_token;
    if (!token) throw new Error('Falta csrf_access_token');
    return token;
  };

  const safeJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    const cleaned = raw.replace(/^\uFEFF/, '').trim();

    if (!contentType.includes('application/json')) {
      throw new Error(
        `Respuesta no-JSON (Content-Type: ${contentType}). Status: ${res.status}. Body: ${cleaned.slice(0, 300)}`
      );
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      throw new Error(`JSON inválido. Status: ${res.status}. Body: ${cleaned.slice(0, 300)}`);
    }
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  };

  const saveBinaryAudioToFile = async (arrayBuffer: ArrayBuffer, ext: 'mp3' | 'm4a' = 'mp3') => {
    const base64 = arrayBufferToBase64(arrayBuffer);
    const fileUri = `${FileSystem.cacheDirectory}voice_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64' as any,
    });

    return fileUri;
  };

  const saveCookies = async (cookiesObj: Record<string, string>) => {
    try {
      await AsyncStorage.setItem('cookies', JSON.stringify(cookiesObj));
      console.log(cookiesObj);
      console.log('✅ Cookies guardadas');
    } catch (e) {
      console.error('Error al guardar cookies', e);
    }
  };

  const parseSetCookieHeader = (setCookie: string): Record<string, string> => {
    const cookiesObj: Record<string, string> = {};
    setCookie.split(/,(?=[^;]+=[^;]+)/g).forEach((cookieStr) => {
      const [pair] = cookieStr.split(';');
      const [name, value] = pair.split('=').map((s) => s.trim());
      if (name) cookiesObj[name] = value ?? '';
    });
    return cookiesObj;
  };

  const mergeAndSaveCookies = async (newCookies: Record<string, string>) => {
    const prev = await AsyncStorage.getItem('cookies');
    const prevObj = prev ? JSON.parse(prev) : {};
    const merged = { ...prevObj, ...newCookies };
    await saveCookies(merged);
    return merged;
  };

  const refreshTokens = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cookiesString = await AsyncStorage.getItem('cookies');
      if (!cookiesString) return { ok: false, error: 'No hay cookies guardadas' };

      const cookies = JSON.parse(cookiesString);
      const refreshCsrf = cookies.csrf_refresh_token;
      if (!refreshCsrf) return { ok: false, error: 'Falta csrf_refresh_token' };

      const response = await fetch('https://api.aimind.portablelab.work/api/v1/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': refreshCsrf,
        },
        credentials: 'include' as any,
      });

      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        return { ok: false, error: `Refresh falló (${response.status}): ${txt}` };
      }

      const setCookie = response.headers.get('set-cookie');
      if (setCookie) {
        const cookiesObj = parseSetCookieHeader(setCookie);
        await mergeAndSaveCookies(cookiesObj);
      }

      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: 'Error inesperado en refreshTokens' };
    }
  };

  const getEmergencyContacts = useCallback(async (): Promise<EmergencyContact[]> => {
    try {
      setLoadingEmergencyContacts(true);

      const doGetContacts = async () => {
        const cookiesString = await AsyncStorage.getItem('cookies');
        if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

        const cookies = JSON.parse(cookiesString);
        const token = cookies.csrf_access_token;
        if (!token) throw new Error('Falta csrf_access_token');

        return fetch('https://api.aimind.portablelab.work/api/v1/perfil/contactos', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
          },
          credentials: 'include' as any,
        });
      };

      let response = await doGetContacts();

      if (response.status === 401) {
        const refreshed = await refreshTokens();
        if (!refreshed.ok) {
          throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);
        }
        response = await doGetContacts();
      }

      if (!response.ok) {
        throw new Error(`Error obteniendo contactos: ${response.status}`);
      }

      const data = await safeJson(response);

      if (!Array.isArray(data)) return [];

      return data.slice(0, 3);
    } catch (error) {
      console.error('getEmergencyContacts error:', error);
      return [];
    } finally {
      setLoadingEmergencyContacts(false);
    }
  }, []);

  const callEmergencyContact = useCallback(async (phone: string) => {
    try {
      const cleanPhone = String(phone).replace(/[^\d+]/g, '');
      const url = `tel:${cleanPhone}`;
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('callEmergencyContact error:', error);
    }
  }, []);

  const goToContactsScreen = useCallback(() => {
    setCrisisModalVisible(false);
    setRememberModalVisible(false);
    navigation?.navigate?.('Contactos');
  }, [navigation]);

  const openCrisisFlow = useCallback(async () => {
    const contacts = await getEmergencyContacts();
    setEmergencyContacts(contacts);
    setCrisisModalVisible(true);
  }, [getEmergencyContacts]);

  const ensureMicPermission = useCallback(async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('Permiso de micrófono denegado');
  }, []);

  const startRecording = useCallback(async () => {
    try {
      Keyboard.dismiss();
      setComposerMode('record');

      setIsPaused(false);
      setRecordUri(null);
      resetRecordTimer();

      await ensureMicPermission();

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = rec;
      setRecording(rec);

      startRecordTimer();
    } catch (e) {
      console.log('startRecording error:', e);
      setComposerMode('text');
      recordingRef.current = null;
      setRecording(null);
      setIsPaused(false);
      setRecordUri(null);
      resetRecordTimer();
    }
  }, [ensureMicPermission, resetRecordTimer, startRecordTimer]);

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
      await recording.startAsync();
      setIsPaused(false);
      startRecordTimer();
    } catch (e) {
      console.log('resumeRecording error:', e);
    }
  }, [recording, startRecordTimer]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recording) return null;
    try {
      stopRecordTimer();
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      setRecordUri(uri ?? null);
      return uri ?? null;
    } catch (e) {
      console.log('stopRecording error:', e);
      return null;
    }
  }, [recording, stopRecordTimer]);

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

  const playAudio = useCallback(
    async (uri: string) => {
      if (playingUri === uri) {
        await stopSound();
        return;
      }

      await stopSound();

      const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      soundRef.current = sound;
      setPlayingUri(uri);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) stopSound();
      });
    },
    [playingUri, stopSound]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => setIsFocused(false), []);

  const sendVoice = useCallback(async (audioUri: string) => {
    const token = await getAccessToken();

    const buildForm = () => {
      const form = new FormData();
      form.append('file', {
        uri: audioUri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/mp4',
      } as any);
      return form;
    };

    const doReq = async (csrfToken: string) =>
      fetch('https://api.aimind.portablelab.work/api/v1/voice/chat/voz', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken },
        body: buildForm(),
        credentials: 'include' as any,
      });

    let res = await doReq(token);

    if (res.status === 401) {
      const refreshed = await refreshTokens();
      if (!refreshed.ok) throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);

      const retryToken = await getAccessToken();
      res = await doReq(retryToken);
    }

    if (!res.ok) throw new Error(`Voice endpoint error: ${res.status}`);

    const ct = res.headers.get('content-type') || '';

    if (ct.includes('audio/mpeg') || ct.startsWith('audio/')) {
      const buf = await res.arrayBuffer();
      const uriOut = await saveBinaryAudioToFile(buf, 'mp3');
      return { audioUri: uriOut, format: 'mp3' as const };
    }

    const raw = await res.text();
    const cleaned = raw.replace(/^\uFEFF/, '').trim();
    let data: any;
    try {
      data = JSON.parse(cleaned);
    } catch {
      throw new Error(`Respuesta inesperada. Content-Type: ${ct}. Body: ${cleaned.slice(0, 200)}`);
    }

    return data;
  }, []);

  const onSendRecording = useCallback(async () => {
    let uri = recordUri;

    if (!uri && recording) {
      uri = await stopRecording();
    }
    if (!uri) return;

    append({
      id: nowId('u_audio'),
      role: 'user',
      type: 'audio',
      uri,
      durationSec: recordSeconds,
    });
    scrollToEnd();

    try {
      setLoading(true);
      setPendingType('audio');

      setComposerMode('text');
      setIsPaused(false);

      const data = await sendVoice(uri);
      const assistantAudioUri = data.audioUri;

      append({
        id: nowId('a_audio'),
        role: 'assistant',
        type: 'audio',
        uri: assistantAudioUri,
      });
    } catch (e) {
      console.log('voice chat error:', e);
      append({
        id: nowId('a_err'),
        role: 'assistant',
        type: 'text',
        text: 'No pude procesar el audio. Intenta de nuevo.',
      });
    } finally {
      setLoading(false);
      setPendingType(null);
      scrollToEnd();
    }

    setRecordUri(null);
    setIsPaused(false);
    resetRecordTimer();
    setComposerMode('text');
  }, [
    recordUri,
    recording,
    stopRecording,
    recordSeconds,
    scrollToEnd,
    sendVoice,
    resetRecordTimer,
  ]);

  const callAPI = async (
    userMessage: string
  ): Promise<{ content: string; emotion: EmotionKey | null; isCrisis: boolean }> => {
    try {
      const doChatRequest = async () => {
        const cookiesString = await AsyncStorage.getItem('cookies');
        if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

        const cookies = JSON.parse(cookiesString);
        const token = cookies.csrf_access_token;
        if (!token) throw new Error('Falta csrf_access_token');

        return fetch('https://api.aimind.portablelab.work/api/v1/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': token,
          },
          body: JSON.stringify({ user_message: userMessage }),
          credentials: 'include' as any,
        });
      };

      let response = await doChatRequest();

      if (response.status === 401) {
        const refreshed = await refreshTokens();

        if (!refreshed.ok) {
          throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);
        }

        response = await doChatRequest();
      }

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }

      const data = await safeJson(response);

      const emotionRaw: string | null = data?.emocion_pet ?? null;
      const emotionNorm = normalizeEmotion(emotionRaw);
      const isCrisis = data?.is_crisis === true;

      const content: string =
        data?.response?.choices?.[0]?.message?.content ??
        'Gracias por compartir. ¿Quieres contarme un poco más?';

      return { content, emotion: emotionNorm, isCrisis };
    } catch (error) {
      console.error(error);
      return { content: 'Hubo un error al llamar a la API', emotion: null, isCrisis: false };
    }
  };

  const sendMessage = useCallback(
    async (payload?: string) => {
      const toSend = (payload ?? text).trim();
      if (!toSend) return;

      append({ id: nowId('u'), role: 'user', type: 'text', text: toSend });
      setText('');
      scrollToEnd();

      try {
        setPendingType('text');
        setLoading(true);
        const { content, emotion, isCrisis } = await callAPI(toSend);

        setEmotionKey(emotion ?? null);

        if (isCrisis) {
          openCrisisFlow();
        }

        append({ id: nowId('a'), role: 'assistant', type: 'text', text: content });
      } catch {
        append({
          id: nowId('e'),
          role: 'assistant',
          type: 'text',
          text: 'Ups, hubo un problema al contactar la API. Intenta de nuevo.',
        });
      } finally {
        setLoading(false);
        setPendingType(null);
        scrollToEnd();
      }
    },
    [text, scrollToEnd, openCrisisFlow]
  );

  useEffect(() => {
    return () => {
      stopRecordTimer();
      recordingRef.current?.stopAndUnloadAsync?.().catch(() => {});
    };
  }, [stopRecordTimer]);

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (!active) return;

          if (!saved) {
            setSkinKey('default');
            setRemoteUri(null);
            return;
          }

          if (isRemoteValue(saved)) {
            setRemoteUri(saved);
            setSkinKey('default');
          } else if ((SKINS as any)[saved]) {
            setSkinKey(saved as keyof typeof SKINS);
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
        active = false;
      };
    }, [])
  );

  const imageSource = useMemo(() => {
    if (remoteUri) return { uri: remoteUri };
    return resolveSourceByEmotion(skinKey, emotionKey);
  }, [skinKey, remoteUri, emotionKey]);

  useEffect(() => {
    if (initialMessage?.trim()) sendMessage(initialMessage.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialAudioUri) {
      (async () => {
        append({
          id: nowId('u_audio'),
          role: 'user',
          type: 'audio',
          uri: initialAudioUri,
          durationSec: initialAudioDurationSec,
        });
        scrollToEnd();

        try {
          setPendingType('audio');
          setLoading(true);

          const data = await sendVoice(initialAudioUri);
          append({
            id: nowId('a_audio'),
            role: 'assistant',
            type: 'audio',
            uri: data.audioUri,
          });
        } catch (e) {
          append({
            id: nowId('a_err'),
            role: 'assistant',
            type: 'text',
            text: 'No pude procesar el audio. Intenta de nuevo.',
          });
        } finally {
          setLoading(false);
          setPendingType(null);
          scrollToEnd();
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === 'user';

    if (item.type === 'audio') {
      const isPlaying = playingUri === item.uri;

      return (
        <View
          className={`my-1 max-w-[85%] flex-row items-end gap-2 ${
            isUser ? 'self-end' : 'self-start'
          }`}>
          {!isUser && (
            <Image
              source={imageSource}
              style={{ width: 48, height: 48, borderRadius: 14 }}
              resizeMode="contain"
            />
          )}

          <View
            className={`max-w-[80%] rounded-2xl px-3 py-2 shadow ${
              isUser ? 'bg-[#DCF8C6]' : 'bg-white'
            }`}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <TouchableOpacity onPress={() => playAudio(item.uri)} style={{ padding: 6 }}>
              {isPlaying ? (
                <PauseIcon size={22} color="black" />
              ) : (
                <PlayIcon size={22} color="black" />
              )}
            </TouchableOpacity>

            <Text className="text-[16px] text-[#0F0F0F]">
              Audio {item.durationSec != null ? `(${formatTime(item.durationSec)})` : ''}
            </Text>
          </View>
        </View>
      );
    }

    if (isUser) {
      return (
        <View className="my-1 max-w-[80%] self-end rounded-2xl bg-[#DCF8C6] px-3 py-2 shadow">
          <Text className="text-[16px] text-[#0F0F0F]">{item.text}</Text>
        </View>
      );
    }

    return (
      <View className="my-1 max-w-[85%] flex-row items-end gap-2 self-start">
        <Image
          source={imageSource}
          style={{ width: 48, height: 48, borderRadius: 14 }}
          resizeMode="contain"
        />
        <View className="max-w-[85%] rounded-2xl bg-white px-3 py-2 shadow">
          <Text className="text-[16px] text-[#0F0F0F]">{item.text}</Text>
        </View>
      </View>
    );
  };

  const ListFooter = useMemo(
    () => (
      <>
        {loading && (
          <View className="mb-2 items-start">
            <View className="max-w-[60%] flex-row items-center rounded-2xl bg-white px-3 py-2">
              <ActivityIndicator size="small" />
              <Text className="ml-2 text-[#0F0F0F]">
                {pendingType === 'audio' ? 'Escuchando…' : 'Pensando…'}
              </Text>
            </View>
          </View>
        )}

        {composerMode === 'record' ? (
          <View style={{ width: '100%', marginTop: 8, gap: 8 }}>
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
              alignItems: 'stretch',
              width: '100%',
              marginTop: 8,
            }}>
            <View
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 24,
                paddingHorizontal: 12,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                flexDirection: 'row',
                alignItems: 'center',
                minHeight: 56,
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
                  textAlignVertical: 'center',
                  paddingRight: 8,
                }}
                value={text}
                onChangeText={setText}
                multiline
                scrollEnabled
                returnKeyType="default"
                blurOnSubmit={false}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />

              <TouchableOpacity
                onPress={() => {
                  sendMessage();
                  Keyboard.dismiss();
                }}
                disabled={!text.trim() || loading}
                style={{
                  backgroundColor: '#00bb77',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 20,
                }}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Enviar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={startRecording}
              disabled={loading}
              style={{
                marginLeft: 8,
                alignSelf: 'stretch',
                minHeight: 56,
                borderRadius: 8,
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 12,
                elevation: 3,
              }}>
              <VoiceIcon size={24} color="black" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom }} />
      </>
    ),
    [
      loading,
      pendingType,
      text,
      insets.bottom,
      handleFocus,
      handleBlur,
      sendMessage,
      composerMode,
      recordSeconds,
      isPaused,
      startRecording,
      pauseRecording,
      resumeRecording,
      deleteRecording,
      onSendRecording,
      formatTime,
    ]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#00634C]">
      <View className="flex-1 px-4" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <KeyboardAwareFlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            paddingVertical: 8,
            flexGrow: 1,
            justifyContent: 'flex-end',
          }}
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll={Platform.OS !== 'android'}
          keyboardOpeningTime={0}
          extraScrollHeight={Platform.OS === 'android' ? 0 : isFocused ? 190 : 90}
          extraHeight={Platform.OS === 'android' ? 0 : isFocused ? 145 : 45}
          onContentSizeChange={scrollToEnd}
        />
      </View>

      <Modal
        visible={crisisModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCrisisModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#00634C',
              borderRadius: 24,
              padding: 20,
              borderBlockColor: 'white',
              borderWidth: 5,
              borderColor: 'rgba(255,255,255,0.18)',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '700', flex: 1 }}>
                Respiremos un poco
              </Text>

              <Image
                source={require('../assets/perro/comprension.png')}
                style={{ width: 72, height: 72, marginLeft: 12 }}
                resizeMode="contain"
              />
            </View>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 18,
              }}>
              Respira, esto que estás sintiendo es muy intenso, pero no tienes que cargarlo solo/a.
              Está bien detenerte un momento y darte espacio. Si lo necesitas, puedes buscar a
              alguien de confianza y hablar con esa persona ahora.
            </Text>

            {loadingEmergencyContacts ? (
              <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'stretch',
                }}>
                {emergencyContacts.slice(0, 3).map((contact, index, arr) => {
                  const total = arr.length;

                  const width = total === 1 ? '100%' : total === 2 ? '48%' : '31%';

                  return (
                    <TouchableOpacity
                      key={contact.id}
                      onPress={() => callEmergencyContact(contact.telefono)}
                      style={{
                        width,
                        backgroundColor: 'white',
                        borderRadius: 14,
                        paddingVertical: 14,
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      <Text
                        numberOfLines={1}
                        style={{
                          color: '#00634C',
                          fontWeight: '700',
                          fontSize: 16,
                          textAlign: 'center',
                        }}>
                        {contact.alias || contact.nombre}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity
                onPress={goToContactsScreen}
                style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: '#00634C', fontWeight: '700' }}>Lista de contactos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCrisisModalVisible(false);
                  setRememberModalVisible(true);
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}>
                <Text style={{ color: 'white', fontWeight: '700', textAlign: 'center' }}>
                  Estoy Bien, Puedo Seguir
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={rememberModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRememberModalVisible(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
          <View
            style={{
              width: '100%',
              maxWidth: 420,
              backgroundColor: '#00634C',
              borderRadius: 24,
              padding: 20,
              borderBlockColor: 'white',
              borderWidth: 5,
              borderColor: 'rgba(255,255,255,0.18)',
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 18,
              }}>
              <Text style={{ color: 'white', fontSize: 24, fontWeight: '700', flex: 1 }}>
                Recuerda
              </Text>

              <Image
                source={require('../assets/perro/main.png')}
                style={{ width: 72, height: 72, marginLeft: 12 }}
                resizeMode="contain"
              />
            </View>

            <Text
              style={{
                color: 'white',
                fontSize: 16,
                lineHeight: 24,
                marginBottom: 18,
              }}>
              Me alegra saber que estás bien. Aun así, si en algún momento necesitas apoyo y no
              quieres hablar con alguien cercano, también puedes acudir a un servicio de emergencia
              o línea de ayuda. Lo importante es que no estés solo/a con eso.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={goToContactsScreen}
                style={{
                  flex: 3,
                  backgroundColor: 'white',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                <Text style={{ color: '#00634C', fontWeight: '700' }}>Contactos de Emergencia</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRememberModalVisible(false)}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: 'white',
                }}>
                <Text style={{ color: 'white', fontWeight: '700' }}>Estoy Bien</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
