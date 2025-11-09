import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { EyeClosed } from "../icons/EyeClosed";
import { EyeOpen } from "../icons/EyeOpen";

type RegisterResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

function PasswordInput({
  value,
  onChangeText,
  placeholder,
  className,
  testID,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  className?: string;
  testID?: string;
}) {
  const [show, setShow] = useState(false);

  return (
    <View
      className={`w-full flex-row items-center rounded-2xl border border-emerald-700 bg-emerald-800/60 px-3 ${className || ""}`}
    >
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!show}
        placeholder={placeholder}
        placeholderTextColor="rgba(255,255,255,0.7)"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="password"
        importantForAutofill="yes"
        className="flex-1 py-4 px-2 text-white"
        testID={testID ? `${testID}-input` : undefined}
      />
      <TouchableOpacity
        onPress={() => setShow(!show)}
        accessibilityRole="button"
        accessibilityLabel={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        testID={testID ? `${testID}-toggle` : undefined}
      >
        {show ? <EyeOpen size={24} color="white" /> : <EyeClosed size={24} color="white" />}
      </TouchableOpacity>
    </View>
  );
}

export default function RegisterScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordsMatch = password.length > 0 && password === passwordConfirm;

  const onRegister = async () => {
    if (!email || !password) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }
    if (!passwordsMatch) {
      Alert.alert("Validación", "Las contraseñas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      const result = await registerApi(email, password);
      setLoading(false);

      if (result.ok) {
        // Mostrar confirmación y navegar SOLO cuando el usuario acepte
        Alert.alert(
          "Registro exitoso",
          result.message || "Tu cuenta fue creada correctamente.",
          [
            {
              text: "Aceptar",
              onPress: () =>
                navigation.navigate("Login", {
                  initialMessage: email,
                }),
            },
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert("No se pudo registrar", result.message);
      }
    } catch (e) {
      setLoading(false);
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta de nuevo.");
    }
  };

  const registerApi = async (email: string, password: string): Promise<RegisterResult> => {
    try {
      const response = await fetch("https://api.aimind.portablelab.work/api/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      // Manejo de estados comunes
      if (response.status === 409) {
        return { ok: false, message: "El correo ya está registrado." };
      }
      if (response.status === 400 || response.status === 422) {
        // Si el backend envía detalle de validación en JSON
        let detail = "";
        try {
          const err = await response.json();
          detail = err?.message || err?.detail || "";
        } catch {}
        return { ok: false, message: detail || "Datos inválidos. Verifica la información." };
      }
      if (!response.ok) {
        return { ok: false, message: `Error del servidor.` };
      }

      // Éxito
      // Puedes leer algún mensaje/usuario si lo devuelve el backend
      let msg: string | undefined = undefined;
      try {
        const data = await response.json();
        msg = data?.message;
        console.log("registerApi:", data);
      } catch {
        // si no hay cuerpo JSON, no pasa nada
      }
      return { ok: true, message: msg };
    } catch (error) {
      console.error("Hubo un error al llamar a la API", error);
      return { ok: false, message: "Problema de conexión. Intenta nuevamente." };
    }
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
                textContentType="emailAddress"
                autoCorrect={false}
                editable={!loading}
              />

              <PasswordInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                testID="password"
              />

              <PasswordInput
                value={passwordConfirm}
                onChangeText={setPasswordConfirm}
                placeholder="Confirma Contraseña"
                testID="passwordConfirm"
              />

              {passwordConfirm.length > 0 && (
                <Text className={`text-sm ${passwordsMatch ? "text-emerald-300" : "text-red-300"}`}>
                  {passwordsMatch ? "✔ Las contraseñas coinciden" : "✖ Las contraseñas no coinciden"}
                </Text>
              )}

              <TouchableOpacity
                onPress={onRegister}
                disabled={!email || !password || !passwordsMatch || loading}
                className={`mt-6 w-full rounded-2xl py-4 items-center ${
                  !email || !password || !passwordsMatch || loading
                    ? "bg-white/50"
                    : "bg-white"
                }`}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-emerald-900 text-xl font-extrabold">
                    Registrarse
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Link a login */}
            <View className="mt-auto mb-6 items-center">
              <View className="flex-row items-center">
                <Text className="text-white/80 text-base">¿Ya tienes una cuenta?</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text className="text-white text-base font-bold ml-2 underline">
                    Inicia Sesión
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
