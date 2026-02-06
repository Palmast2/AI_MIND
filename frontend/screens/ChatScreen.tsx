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
} from './skins'; // 👈 importa helpers nuevos
import { VoiceIcon } from 'icons/Voice';
import { DeleteIcon } from 'icons/Delete';
import { PauseIcon } from 'icons/Pause';
import { PlayIcon } from 'icons/Play';
import { SendIcon } from 'icons/Enviar';

type Msg =
  | { id: string; role: 'user' | 'assistant'; type: 'text'; text: string }
  | { id: string; role: 'user' | 'assistant'; type: 'audio'; uri: string; durationSec?: number };

export default function ChatScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const initialMessage = route?.params?.initialMessage as string | undefined;
  const initialAudioUri = route?.params?.initialAudioUri as string | undefined;
  const initialAudioDurationSec = route?.params?.initialAudioDurationSec as number | undefined;

  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [pendingType, setPendingType] = useState<'text' | 'audio' | null>(null);


  // Skin seleccionada y posibles remotos
  const [skinKey, setSkinKey] = useState<keyof typeof SKINS>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  // 👇 Emoción actual (normalizada y sin acentos)
  const [emotionKey, setEmotionKey] = useState<EmotionKey | null>(null);

  const listRef = useRef<KeyboardAwareFlatList<Msg>>(null);
  const inputRef = useRef<TextInput>(null);

  const nowId = (s: string) => `${Date.now()}_${Math.random().toString(36).slice(2)}_${s}`;

  const append = (m: Msg) => setMessages((prev) => [...prev, m]);

  // ====== AUDIO (grabación) ======
  const [composerMode, setComposerMode] = useState<'text' | 'record'>('text');
  const [isPaused, setIsPaused] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordUri, setRecordUri] = useState<string | null>(null);

  const [recordSeconds, setRecordSeconds] = useState(0);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const recordingRef = useRef<Audio.Recording | null>(null);

  // ====== TIMER (audio) ======
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

  // ====== AUDIO (expo-av) ======
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

      startRecordTimer(); // ✅ solo una vez y después de crear la grabación
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
      // En expo-av se reanuda con startAsync()
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

  const onSendRecording = useCallback(async () => {
    let uri = recordUri;

    if (!uri && recording) {
      uri = await stopRecording();
    }
    if (!uri) return;

    // 1) Mensaje del usuario (audio)
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

      // 2) Enviar a endpoint de voz
      const data = await sendVoice(uri);

      // 3) Guardar base64 a archivo local
      const assistantAudioUri = data.audioUri;

      // 4) Mensaje del assistant (audio)
      append({
        id: nowId('a_audio'),
        role: 'assistant',
        type: 'audio',
        uri: assistantAudioUri,
      });

      // opcional: auto reproducir
      // await playAudio(assistantAudioUri);
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

    // reset UI
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

  useEffect(() => {
    return () => {
      stopRecordTimer();
      recordingRef.current?.stopAndUnloadAsync?.().catch(() => {});
    };
  }, [stopRecordTimer]);

  // ============ REPRODUCIR AUDIO =======
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

  const playAudio = useCallback(
    async (uri: string) => {
      // toggle
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

  useEffect(() => {
    return () => {
      stopSound();
    };
  }, [stopSound]);

  // ============ Guardar Audio ==============
  const saveBase64AudioToFile = async (base64: string, ext: 'mp3' | 'm4a' = 'mp3') => {
    const fileUri = `${FileSystem.cacheDirectory}voice_${Date.now()}.${ext}`;
    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64' as any, // ✅
    });
    return fileUri;
  };

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
    const raw = await res.text(); // <-- siempre lee texto primero

    // Quita BOM si existe
    const cleaned = raw.replace(/^\uFEFF/, '').trim();

    if (!contentType.includes('application/json')) {
      // Esto te salva la vida para debug
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
    const chunkSize = 0x8000; // evita "call stack size exceeded"

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    // btoa existe en RN/Expo (si no, te doy polyfill)
    return btoa(binary);
  };

  const saveBinaryAudioToFile = async (arrayBuffer: ArrayBuffer, ext: 'mp3' | 'm4a' = 'mp3') => {
    const base64 = arrayBufferToBase64(arrayBuffer);
    const fileUri = `${FileSystem.cacheDirectory}voice_${Date.now()}.${ext}`;

    await FileSystem.writeAsStringAsync(fileUri, base64, {
      encoding: 'base64' as any, // ✅
    });

    return fileUri;
  };

  // ============ COOKIES ==============

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
    await saveCookies(merged); // tu función existente
    return merged;
  };

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      (listRef.current as any)?.scrollToOffset?.({
        offset: 999999,
        animated: true,
      });
    });
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    /*requestAnimationFrame(() => {
      const node = findNodeHandle(inputRef.current);
      (listRef.current as any)?.scrollToFocusedInput?.(node);
    });*/
  }, []);

  const handleBlur = useCallback(() => setIsFocused(false), []);

  // ====== LÓGICA DE SKINS ======
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
            setSkinKey('default'); // clave no se usa cuando hay URI
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

  // Fuente para el avatar del asistente
  const imageSource = useMemo(() => {
    // Si el usuario eligió una imagen remota, la respetamos (no variamos por emoción)
    if (remoteUri) return { uri: remoteUri };
    // Si es local, resolvemos por emoción; si no hay variante, cae a main
    return resolveSourceByEmotion(skinKey, emotionKey);
  }, [skinKey, remoteUri, emotionKey]);

  // Llamada real a API
  // Debe devolver texto + emoción; ajusta si tu backend cambia
  const refreshTokens = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cookiesString = await AsyncStorage.getItem('cookies');
      if (!cookiesString) return { ok: false, error: 'No hay cookies guardadas' };

      const cookies = JSON.parse(cookiesString);

      // 🔑 Este es el CSRF para refresh (cookie csrf_refresh_token)
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

      // Rate limit / inválido / expirado, etc.
      if (!response.ok) {
        const txt = await response.text().catch(() => '');
        return { ok: false, error: `Refresh falló (${response.status}): ${txt}` };
      }

      // Si el backend devuelve set-cookie (a veces NO lo verás en RN)
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

  const callAPI = async (
    userMessage: string
  ): Promise<{ content: string; emotion: EmotionKey | null }> => {
    try {
      // Helper interno para no repetir lógica
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

      // 1) Primer intento
      let response = await doChatRequest();

      // 2) Si es 401 => refresh + retry
      if (response.status === 401) {
        const refreshed = await refreshTokens(); // tu const de refresh

        // Si refresh falló, ya no reintentes chat
        if (!refreshed.ok) {
          throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);
        }

        // Reintento (una sola vez)
        response = await doChatRequest();
      }

      // 3) Si sigue fallando (401 u otro status), ahora sí truena
      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }

      const data = await safeJson(response);

      const emotionRaw: string | null = data?.emocion_pet ?? null;
      const emotionNorm = normalizeEmotion(emotionRaw);

      const content: string =
        data?.response?.choices?.[0]?.message?.content ??
        'Gracias por compartir. ¿Quieres contarme un poco más?';

      return { content, emotion: emotionNorm };
    } catch (error) {
      console.error(error);
      return { content: 'Hubo un error al llamar a la API', emotion: null };
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
        const { content, emotion } = await callAPI(toSend);

        // 👇 Actualiza emoción (esto cambiará la imagen mostrada)
        setEmotionKey(emotion ?? null);

        append({ id: nowId('a'), role: 'assistant', text: content });
      } catch {
        append({
          id: nowId('e'),
          role: 'assistant',
          text: 'Ups, hubo un problema al contactar la API. Intenta de nuevo.',
        });
      } finally {
        setLoading(false);
        setPendingType(null);
        scrollToEnd();
      }
    },
    [text, scrollToEnd]
  );

  const sendVoice = useCallback(async (audioUri: string) => {
    const token = await getAccessToken();

    const form = new FormData();
    form.append('file', {
      uri: audioUri,
      name: `voice_${Date.now()}.m4a`,
      type: 'audio/mp4',
    } as any);

    const doReq = async (csrfToken: string) =>
      fetch('https://api.aimind.portablelab.work/api/v1/voice/chat/voz', {
        method: 'POST',
        headers: { 'X-CSRF-TOKEN': csrfToken },
        body: form,
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

    // ✅ TU BACKEND: audio/mpeg (MP3)
    if (ct.includes('audio/mpeg') || ct.startsWith('audio/')) {
      const buf = await res.arrayBuffer();
      const uriOut = await saveBinaryAudioToFile(buf, 'mp3');
      return { audioUri: uriOut, format: 'mp3' as const };
    }

    // Si algún día te regresa JSON (opcional)
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

  // Si viene texto desde Home, envíalo de inmediato
  useEffect(() => {
    if (initialMessage?.trim()) sendMessage(initialMessage.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Si viene audio desde Home, envíalo de inmediato
  useEffect(() => {
  if (initialAudioUri) {
    // simula lo que haría onSendRecording pero sin grabación activa
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

  // Burbujas
  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === 'user';

    // ===== AUDIO MESSAGE =====
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

    // ===== TEXT MESSAGE =====
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

  // Footer memoizado
  const ListFooter = useMemo(
    () => (
      <>
        {loading && (
          <View className="mb-2 items-start">
            <View className="max-w-[60%] flex-row items-center rounded-2xl bg-white px-3 py-2">
              <ActivityIndicator size="small" />
              <Text className="ml-2 text-[#0F0F0F]">{pendingType === 'audio' ? 'Escuchando…' : 'Pensando…'}</Text>
            </View>
          </View>
        )}

        {composerMode === 'record' ? (
          <View style={{ width: '100%', marginTop: 8, gap: 8 }}>
            {/* Barra superior: VoiceIcon + timer */}
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

            {/* Barra inferior: Delete | Pause/Play | Send */}
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
              <TouchableOpacity onPress={deleteRecording} disabled={loading} style={{ padding: 10 }}>
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

              <TouchableOpacity onPress={onSendRecording} disabled={loading} style={{ padding: 10 }}>
                <SendIcon size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // ====== MODO TEXTO (tu UI actual) ======
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'stretch',
              width: '100%',
              marginTop: 8,
            }}>
            {/* BARRA BLANCA */}
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

            {/* BOTÓN DE VOZ */}
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
      isFocused,
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
    </SafeAreaView>
  );
}
