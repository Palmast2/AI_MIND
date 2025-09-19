import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";

// 👇 recibe navigation desde React Navigation
export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const onRegister = async () => {
    // TODO: lógica de login
    console.log({ email, password, passwordConfirm });
    if (password === passwordConfirm) {
      if(await registerApi(email, password)) {
        navigation.navigate("Login", { initialMessage: email, password, passwordConfirm });
      } else {
        alert("El registro no fue exitoso");
      }
    } else {
      alert("La contraseña no coincide");
    }
  };

  const registerApi = async (email: string, password: string): Promise<string> => {
  try {
    const response = await fetch("https://api.aimind.portablelab.work/api/v1/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: email, password: password }),
    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    // 👀 Ajusta según lo que devuelva tu backend
    console.log(data)
    return JSON.stringify(data);
  } catch (error) {
    console.error(error);
    return "Hubo un error al llamar a la API";
  }
};

  const onGoogle = () => {
    // TODO: lógica de login con Google
    console.log("Google Sign-In");
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6">
            {/* Título */}
            <View className="items-center mt-6 mb-10 pt-10">
              <Text className="text-white text-5xl font-extrabold tracking-widest">
                IA MIND
              </Text>
            </View>

            {/* Formulario */}
            <View className="gap-4 flex-1 justify-center">
              <Text className="text-white text-3xl font-extrabold mb-2">
                Crea tu cuenta
              </Text>

              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="Email"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Contraseña"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
              />

              <TextInput
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                secureTextEntry
                placeholder="Confirma Contraseña"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
              />

              <TouchableOpacity
                onPress={onRegister}
                className="mt-6 w-full rounded-2xl bg-white py-4 items-center"
              >
                <Text className="text-emerald-900 text-xl font-extrabold">
                  Registrarse
                </Text>
              </TouchableOpacity>
            </View>

            {/* Otras opciones */}
            <View className="mt-16 items-center">
              <Text className="text-white/90 text-lg mb-4">
                Otras Opciones
              </Text>

              <TouchableOpacity
                onPress={onGoogle}
                className="flex-row items-center gap-3 bg-white rounded-2xl px-5 py-3 mb-12"
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg",
                  }}
                  style={{ width: 28, height: 28 }}
                />
                <Text className="text-emerald-900 text-lg font-semibold">
                  Google
                </Text>
              </TouchableOpacity>
            </View>

            {/* Link a registro */}
            <View className="mt-auto mb-6 items-center">
              <View className="flex-row items-center">
                <Text className="text-white/80 text-base">
                  ¿Ya tienes una cuenta?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-white text-base font-bold ml-2 underline">
                    Inicia Sesion
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
