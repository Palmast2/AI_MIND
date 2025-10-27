import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  findNodeHandle,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadarChart } from 'react-native-gifted-charts';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { SKINS, STORAGE_KEY } from './skins';

// Utilidad: año/mes actuales (1..12)
function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// Convierte ArrayBuffer -> Base64 (para guardar PDF en Expo)
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
      base64 += chars[(bytes[i] & 3) << 4];
      base64 += '==';
    } else {
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[(bytes[i + 1] & 15) << 2];
      base64 += '=';
    }
  }
  return base64;
}

// === GET /pdf/{year}/{month} usando fetch (respeta cookies) -> guardar -> compartir
async function downloadAndOpenMonthlyPdfExpo(): Promise<void> {
  const cookiesString = await AsyncStorage.getItem('cookies');
  if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

  const cookies = JSON.parse(cookiesString);
  const token = cookies.csrf_access_token;

  const { year, month } = getCurrentYearMonth();
  const url = `https://api.aimind.portablelab.work/api/v1/pdf/${year}/${month}`;

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': token,
      // Si tu backend requiere cookie explícita, podrías añadir:
      // Cookie: cookies.cookieHeader || `session=${cookies.sessionId}`
    },
    credentials: 'include', // igual que tu callAPI
  });

  if (!resp.ok) {
    throw new Error(`Error PDF: ${resp.status}`);
  }

  // Leemos como ArrayBuffer (mantiene cookies) y lo guardamos como Base64
  const buffer = await resp.arrayBuffer();
  const base64 = arrayBufferToBase64(buffer);

  const fileName = `informe-${year}-${String(month).padStart(2, '0')}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'application/pdf', dialogTitle: 'Informe mensual' });
  } else {
    Alert.alert('PDF descargado', `Guardado en: ${fileUri}`);
  }
}

// === GET emociones/semanales (mantiene tus headers y cookies)
async function fetchWeeklyEmotions(): Promise<number[]> {
  // Devuelve [Tristeza, Alegría, Tranquilidad, Crisis]
  const cookiesString = await AsyncStorage.getItem('cookies');
  if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

  const cookies = JSON.parse(cookiesString);
  const token = cookies.csrf_access_token;

  const resp = await fetch(
    'https://api.aimind.portablelab.work/api/v1/emociones/semanales',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': token,
      },
      credentials: 'include',
    }
  );

  if (!resp.ok) throw new Error(`Error emociones: ${resp.status}`);

  const data = await resp.json();
  const w = data?.weekly_emotions ?? {};

  const tristeza = Number(w['tristeza'] ?? 0);
  const alegria = Number(w['alegría'] ?? w['alegria'] ?? 0);
  const tranquilidad = Number(w['tranquilidad'] ?? 0);
  const sorpresa = Number(w['sorpresa'] ?? 0); // si no llega, quedará 0
  const otros = Number(w['otros'] ?? 0); // si no llega, quedará 0
  

  return [tristeza, alegria, tranquilidad, sorpresa, otros];
}

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState('');

  const [skinKey, setSkinKey] = useState<string>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  // RadarChart
  const [radarValues, setRadarValues] = useState<number[]>([0, 0, 0, 0, 0]);
  const radarLabels = ['Tristeza', 'Alegría', 'Tranquilidad', 'Sorpresa', 'Otros'];
  const [radarDataLabels, setRadarDataLabels] = useState<string[]>(['0', '0', '0', '0', '0']);

  const scrollRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  // Botón Informe -> descarga y abre el PDF (no navegamos a 'Informe')
  const handleInformePress = async () => {
    try {
      await downloadAndOpenMonthlyPdfExpo();
    } catch (e: any) {
      console.error(e);
      Alert.alert('No se pudo abrir el PDF', e?.message ?? 'Error desconocido');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className='flex flex-row'>
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

  // Carga de SKINS
  useFocusEffect(
    React.useCallback(() => {
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

  // Cargar emociones al enfocar la pantalla
  useFocusEffect(
    React.useCallback(() => {
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
          setRadarValues([0, 0, 0, 0]);
          setRadarDataLabels(['0', '0', '0', '0']);
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
    requestAnimationFrame(() => {
      const node = findNodeHandle(inputRef.current);
      scrollRef.current?.scrollToFocusedInput?.(node);
    });
  };

  const handleBlur = () => setIsFocused(false);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    Keyboard.dismiss();
    navigation.navigate('Chat', { initialMessage: msg });
    setText('');
  };

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
            paddingBottom: isFocused ? 8 : insets.bottom + 16,
          }}
          enableOnAndroid
          enableAutomaticScroll={false}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={12}
          extraHeight={0}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}>

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

          <View style={{ flex: 1 }}>
            {/* Imagen */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image source={imageSource} style={{ width: 300, height: 300 }} resizeMode="contain" />
            </View>

            {/* Input burbuja */}
            <View
              style={{
                alignSelf: 'stretch',
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
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Enter') handleSend();
                }}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
