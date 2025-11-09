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
  Modal,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadarChart } from 'react-native-gifted-charts';
import * as FileSystem from 'expo-file-system/legacy';
import * as IntentLauncher from 'expo-intent-launcher';
import * as Linking from 'expo-linking';

import { SKINS, STORAGE_KEY } from './skins';

// Utilidad: año/mes actuales (1..12)
function getCurrentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

// === GET /pdf/{year}/{month} usando fetch (respeta cookies) -> guardar -> compartir
// Convierte ArrayBuffer -> Base64 (fallback si no hay Buffer)
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
      const r = await fetch(current, { method: 'GET', headers, redirect: 'manual' as RequestRedirect });
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
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
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

  // Guardar binario como Base64
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

  // 👇 Abrir directamente el PDF
  try {
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        type: 'application/pdf',
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
    } else {
      // iOS (y también funciona en Android en muchos casos)
      await Linking.openURL(fileUri);
    }
  } catch (err) {
    console.error('Error abriendo PDF:', err);
    // Respaldo: menú de compartir
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/pdf',
        UTI: 'com.adobe.pdf',
        dialogTitle: 'Informe mensual',
      });
    } else {
      Alert.alert('PDF descargado', `Guardado en: ${fileUri}`);
    }
  }
}


// === GET emociones/semanales (mantiene tus headers y cookies)
async function fetchWeeklyEmotions(): Promise<number[]> {
  // Devuelve [Tristeza, Alegría, Tranquilidad, Sorpresa, Otros]
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
  const sorpresa = Number(w['sorpresa'] ?? 0);
  const otros = Number(w['otros'] ?? 0);

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

  // Estado para modal de carga
  const [isDownloading, setIsDownloading] = useState(false);

  // Botón Informe -> descarga y abre el PDF (no navegamos a 'Informe')
  const handleInformePress = async () => {
    try {
      setIsDownloading(true);
      await downloadAndOpenMonthlyPdfExpo();
    } catch (e: any) {
      console.error(e);
      Alert.alert('No se pudo abrir el PDF', 'Por cuestiones de costos generaremos el informe mas adelante');
    } finally {
      setIsDownloading(false);
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

      {/* Modal de carga para la descarga/generación del PDF */}
      <Modal visible={isDownloading} transparent animationType="fade" statusBarTranslucent>
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.4)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: 280,
              padding: 20,
              borderRadius: 16,
              backgroundColor: 'white',
              alignItems: 'center',
            }}
          >
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
