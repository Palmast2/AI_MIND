import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

type SaveResult = { ok: true; message?: string } | { ok: false; message: string };

const MAX_TEXT_LEN = 120;
const MAX_EMAIL_LEN = 120;
const BASE_URL = 'https://api.aimind.portablelab.work/api/v1/perfil/psicologos';

function normalizeInput(s: string) {
  return s.normalize('NFKC').trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InfoPsicologo({ navigation }: any) {
  const [nombre, setNombre] = useState('');
  const [alias, setAlias] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const nombreNormalizado = useMemo(() => normalizeInput(nombre), [nombre]);
  const aliasNormalizado = useMemo(() => normalizeInput(alias), [alias]);
  const emailNormalizado = useMemo(() => normalizeInput(email), [email]);

  const isFormValid = useMemo(() => {
    return (
      nombreNormalizado.length > 0 &&
      aliasNormalizado.length > 0 &&
      emailNormalizado.length > 0 &&
      isValidEmail(emailNormalizado)
    );
  }, [nombreNormalizado, aliasNormalizado, emailNormalizado]);

  const parseSetCookieHeader = (setCookie: string): Record<string, string> => {
    const cookiesObj: Record<string, string> = {};
    setCookie.split(/,(?=[^;]+=[^;]+)/g).forEach((cookieStr) => {
      const [pair] = cookieStr.split(';');
      const [name, value] = pair.split('=').map((s) => s.trim());
      if (name) cookiesObj[name] = value ?? '';
    });
    return cookiesObj;
  };

  const saveCookies = async (cookiesObj: Record<string, string>) => {
    try {
      await AsyncStorage.setItem('cookies', JSON.stringify(cookiesObj));
    } catch (e) {
      console.error('Error al guardar cookies', e);
    }
  };

  const mergeAndSaveCookies = async (newCookies: Record<string, string>) => {
    const prev = await AsyncStorage.getItem('cookies');
    const prevObj = prev ? JSON.parse(prev) : {};
    const merged = { ...prevObj, ...newCookies };
    await saveCookies(merged);
    return merged;
  };

  const getAccessToken = async (): Promise<string> => {
    const cookiesString = await AsyncStorage.getItem('cookies');
    if (!cookiesString) throw new Error('No se encontraron cookies guardadas');

    const cookies = JSON.parse(cookiesString);
    const token = cookies.csrf_access_token;

    if (!token) throw new Error('Falta csrf_access_token');
    return token;
  };

  const refreshTokens = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cookiesString = await AsyncStorage.getItem('cookies');
      if (!cookiesString) return { ok: false, error: 'No hay cookies guardadas' };

      const cookies = JSON.parse(cookiesString);
      const refreshCsrf = cookies.csrf_refresh_token;

      if (!refreshCsrf) {
        return { ok: false, error: 'Falta csrf_refresh_token' };
      }

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

  function toErrorMessage(value: unknown): string {
    if (typeof value === 'string') return value;

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
        .join('\n');
    }

    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return 'Ocurrió un error inesperado.';
      }
    }

    return 'Ocurrió un error inesperado.';
  }

  const fetchWithAuthRetry = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = await getAccessToken();

    const doRequest = async (csrfToken: string) =>
      fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
          ...(options.headers || {}),
        },
        credentials: 'include' as any,
      });

    let response = await doRequest(token);

    if (response.status === 401) {
      const refreshed = await refreshTokens();
      if (!refreshed.ok) {
        throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);
      }

      const retryToken = await getAccessToken();
      response = await doRequest(retryToken);
    }

    return response;
  };

  const createPsicologo = async (): Promise<SaveResult> => {
    try {
      const payload = {
        nombre: nombreNormalizado,
        alias: aliasNormalizado,
        email: emailNormalizado,
      };

      const response = await fetchWithAuthRetry(BASE_URL, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 400 || response.status === 422) {
        let detail: unknown = '';
        try {
          const err = await response.json();
          detail = err?.message ?? err?.detail ?? err;
        } catch {}

        return {
          ok: false,
          message: toErrorMessage(detail) || 'Datos inválidos. Verifica la información.',
        };
      }

      if (!response.ok) {
        let detail: unknown = 'Error del servidor al guardar la información.';
        try {
          const err = await response.json();
          detail = err?.message ?? err?.detail ?? detail;
        } catch {}

        return {
          ok: false,
          message: toErrorMessage(detail),
        };
      }

      let msg: string | undefined;
      try {
        const data = await response.json();
        msg = data?.message;
      } catch {}

      return { ok: true, message: msg };
    } catch (error) {
      console.error('Error POST psicólogo:', error);
      return {
        ok: false,
        message: 'Problema de conexión. Intenta nuevamente.',
      };
    }
  };

  const onCreate = async () => {
    if (!nombreNormalizado || !aliasNormalizado || !emailNormalizado) {
      Alert.alert('Campos requeridos', 'Completa nombre, alias y correo electrónico.');
      return;
    }

    if (!isValidEmail(emailNormalizado)) {
      Alert.alert('Correo inválido', 'Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setLoading(true);

      const result = await createPsicologo();

      if (result.ok) {
        Alert.alert('Guardado', result.message || 'Información guardada correctamente.');
        setNombre('');
        setAlias('');
        setEmail('');
      } else {
        Alert.alert('No se pudo guardar', result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6">
            <View className="mb-8 mt-8 items-center">
              <Text className="text-4xl font-extrabold text-white">Psicólogos</Text>
            </View>

            <View className="flex-1 justify-center gap-4">
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Nombre"
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="words"
                autoCorrect={false}
                className="w-full rounded-2xl border border-emerald-700 bg-emerald-800/60 px-5 py-4 text-white"
                editable={!loading}
                maxLength={MAX_TEXT_LEN}
              />

              <TextInput
                value={alias}
                onChangeText={setAlias}
                placeholder="Alias"
                placeholderTextColor="rgba(255,255,255,0.7)"
                autoCapitalize="words"
                autoCorrect={false}
                className="w-full rounded-2xl border border-emerald-700 bg-emerald-800/60 px-5 py-4 text-white"
                editable={!loading}
                maxLength={MAX_TEXT_LEN}
              />

              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Correo electrónico"
                placeholderTextColor="rgba(255,255,255,0.7)"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="w-full rounded-2xl border border-emerald-700 bg-emerald-800/60 px-5 py-4 text-white"
                editable={!loading}
                maxLength={MAX_EMAIL_LEN}
              />
            </View>

            <View className="gap-3 pb-6 pt-6">
              <TouchableOpacity
                onPress={onCreate}
                disabled={!isFormValid || loading}
                className={`w-full items-center rounded-2xl py-4 ${
                  !isFormValid || loading ? 'bg-white/50' : 'bg-white'
                }`}>
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-xl font-extrabold text-emerald-900">Guardar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Pressable>
    </SafeAreaView>
  );
}
