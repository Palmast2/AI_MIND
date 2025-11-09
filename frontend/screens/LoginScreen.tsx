import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EyeClosed } from "../icons/EyeClosed";
import { EyeOpen } from "../icons/EyeOpen";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 Estado para controlar visibilidad

  const onLogin = async () => {
    console.log({ email, password });
    if (await loginApi(email, password)) {
      navigation.navigate('Home', { initialMessage: email, password });
    } else {
      alert('El registro no fue exitoso');
    }
  };

  const saveCookies = async (cookiesObj: Record<string, string>) => {
    try {
      await AsyncStorage.setItem('cookies', JSON.stringify(cookiesObj));
      console.log('✅ Cookies guardadas');
    } catch (e) {
      console.error('Error al guardar cookies', e);
    }
  };

  const loginApi = async (email: string, password: string): Promise<string> => {
    try {
      const response = await fetch('https://api.aimind.portablelab.work/api/v1/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, password: password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Error en la petición: ${response.status}`);
      }

      const setCookie = response.headers.get('set-cookie');
      if (!setCookie) throw new Error('No se recibió Set-Cookie');

      const cookiesObj: Record<string, string> = {};
      setCookie
        .split(/,(?=[^;]+=[^;]+)/g)
        .forEach((cookieStr) => {
          const [pair] = cookieStr.split(';');
          const [name, value] = pair.split('=').map((s) => s.trim());
          cookiesObj[name] = value;
        });

      await saveCookies(cookiesObj);

      const data = await response.json();
      console.log(data);
      return JSON.stringify(data);
    } catch (error) {
      console.error(error);
      return 'Hubo un error al llamar a la API';
    }
  };

  const onGoogle = () => {
    console.log('Google Sign-In');
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
              />

              {/* Input de contraseña con botón de ojo 👁️ */}
              <View className="w-full flex-row items-center rounded-2xl border border-emerald-700 bg-emerald-800/60 px-3">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword} // 👈 control dinámico
                  placeholder="Contraseña"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  className="flex-1 py-4 px-2 text-white"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-white text-lg"
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}>
                    {showPassword ? (
                    <EyeOpen size={24} color="white" />
                  ) : (
                    <EyeClosed size={24} color="white" />
                  )}
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={onLogin}
                className="mt-6 w-full items-center rounded-2xl bg-white py-4">
                <Text className="text-xl font-extrabold text-emerald-900">Iniciar Sesión</Text>
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
