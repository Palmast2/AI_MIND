import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EyeClosed } from '../icons/EyeClosed';
import { EyeOpen } from '../icons/EyeOpen';

type LoginResult = { ok: true } | { ok: false; error: string };

// --------- Config de validación en cliente ----------
const MAX_EMAIL_LEN = 128;
const MAX_PASS_LEN = 128;

// Email RFC 5322 lite (suficiente para app)
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

// Patrones comunes de payloads SQLi (minificados)
const SUSPICIOUS_PATTERNS: RegExp[] = [
  /(\bor\b|\band\b)\s+(\d+\s*=\s*\d+|true|false|null)\b/i, // or 1=1, and 0=0
  /\bunion\b\s+\bselect\b/i,
  /\bdrop\b\s+(table|database)\b/i,
  /\bdelete\b\s+from\b/i,
  /\binsert\b\s+into\b/i,
  /\bupdate\b\s+\w+\s+\bset\b/i,
  /--/, // comentario línea
  /\/\*|\*\//, // comentario bloque
  /;/, // separador de sentencias
  /['"`\\]/, // comillas, backticks, backslash
];

// Normaliza para validar
function normalizeInput(s: string) {
  return s
    .normalize('NFKC') // forma canónica (evita homoglyphs básicos)
    .trim();
}

function isValidEmail(email: string) {
  return email.length <= MAX_EMAIL_LEN && EMAIL_RX.test(email);
}

function hasSuspiciousPayload(s: string) {
  const low = s.toLowerCase();
  return SUSPICIOUS_PATTERNS.some((rx) => rx.test(low));
}
// ----------------------------------------------------

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    const emailN = normalizeInput(email);
    const passN = normalizeInput(password);

    if (!emailN || !passN) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }
    if (!isValidEmail(emailN)) {
      Alert.alert('Correo inválido', 'Verifica el formato de tu correo.');
      return;
    }
    if (passN.length > MAX_PASS_LEN) {
      Alert.alert('Contraseña demasiado larga', `Máximo ${MAX_PASS_LEN} caracteres.`);
      return;
    }
    if (hasSuspiciousPayload(emailN) || hasSuspiciousPayload(passN)) {
      Alert.alert('Entrada no permitida', 'Se detectaron caracteres o patrones no permitidos.');
      return;
    }

    setLoading(true);
    const result = await loginApi(emailN, passN);
    setLoading(false);

    if (result.ok) {
      setPassword('');

      // 👇 Validación extra: si datos_demograficos viene null => Form
      console.log(result)
      const datos = result.data?.user?.datos_demograficos; // usa el path real de tu respuesta
      console.log(datos)

      if (datos == null) {
        navigation.navigate('Form'); // o navigation.reset(...) si quieres evitar volver a Login
        return;
      }

      navigation.navigate('Home', { initialMessage: emailN });
    } else {
      Alert.alert('Inicio de sesión', result.error);
    }
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

  const loginApi = async (email: string, password: string): Promise<LoginResult> => {
  try {
    const response = await fetch('https://api.aimind.portablelab.work/api/v1/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' as any,
      body: JSON.stringify({ email, password }),
    });

    // intenta leer el json SIEMPRE (cuando exista)
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (response.status === 401) {
      return { ok: false, error: 'Credenciales inválidas. Verifica tu correo y contraseña.' };
    }
    if (!response.ok) {
      return { ok: false, error: data?.msg || data?.message || 'No se pudo iniciar sesión.' };
    }

    // OJO: en React Native normalmente NO puedes leer "set-cookie"
    // pero de todas formas mantengo tu lógica.
    const setCookie = response.headers.get('set-cookie');
    if (setCookie) {
      const cookiesObj: Record<string, string> = {};
      setCookie.split(/,(?=[^;]+=[^;]+)/g).forEach((cookieStr) => {
        const [pair] = cookieStr.split(';');
        const [name, value] = pair.split('=').map((s) => s.trim());
        if (name) cookiesObj[name] = value ?? '';
      });
      await saveCookies(cookiesObj);
    }

    // ✅ aquí ya regresamos el JSON esperado
    return { ok: true, data: data as LoginResponse };
  } catch (error) {
    console.error(error);
    return { ok: false, error: 'Hubo un problema de conexión. Intenta nuevamente.' };
  }
};

  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6">
            {/* Título */}
            <View className="mb-10 mt-6 items-center pt-10">
              <Text className="text-5xl font-extrabold tracking-widest text-white">IA MIND</Text>
            </View>

            {/* Formulario */}
            <View className="flex-1 justify-center gap-4">
              <Text className="mb-2 text-3xl font-extrabold text-white">
                Inicia sesión en tu cuenta
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl border border-emerald-700 bg-emerald-800/60 px-5 py-4 text-white"
                editable={!loading}
                maxLength={MAX_EMAIL_LEN}
              />

              {/* Input de contraseña con botón de ojo */}
              <View className="w-full flex-row items-center rounded-2xl border border-emerald-700 bg-emerald-800/60 px-3">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Contraseña"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  className="flex-1 px-2 py-4 text-white"
                  editable={!loading}
                  maxLength={MAX_PASS_LEN}
                  textContentType="password"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  disabled={loading}>
                  {showPassword ? (
                    <EyeOpen size={24} color="white" />
                  ) : (
                    <EyeClosed size={24} color="white" />
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={onLogin}
                disabled={loading}
                className={`mt-6 w-full items-center rounded-2xl ${loading ? 'bg-white/70' : 'bg-white'} py-4`}>
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-xl font-extrabold text-emerald-900">Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Link a registro */}
            <View className="mb-6 mt-auto items-center">
              <View className="flex-row items-center">
                <Text className="text-base text-white/80">¿No estás registrado?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Register')}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <Text className="ml-2 text-base font-bold text-white underline">Regístrate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
