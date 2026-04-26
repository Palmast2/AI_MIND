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

/* ========= Validaciones anti-payloads (cliente) ========= */
const MAX_EMAIL_LEN = 128;
const MAX_PASS_LEN = 128;

const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const SUSPICIOUS_PATTERNS: RegExp[] = [
  /(\bor\b|\band\b)\s+(\d+\s*=\s*\d+|true|false|null)\b/i,
  /\bunion\b\s+\bselect\b/i,
  /\bdrop\b\s+(table|database)\b/i,
  /\bdelete\b\s+from\b/i,
  /\binsert\b\s+into\b/i,
  /\bupdate\b\s+\w+\s+\bset\b/i,
  /--/,
  /\/\*|\*\//,
  /;/,
  /['"`\\]/,
];

function normalizeInput(s: string) {
  return s.normalize("NFKC").trim();
}
function isValidEmail(email: string) {
  return email.length <= MAX_EMAIL_LEN && EMAIL_RX.test(email);
}
function hasSuspiciousPayload(s: string) {
  const low = s.toLowerCase();
  return SUSPICIOUS_PATTERNS.some((rx) => rx.test(low));
}
/* ======================================================== */

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
      accessible={false}
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
        maxLength={MAX_PASS_LEN}
        accessible={true}
        accessibilityLabel={placeholder}
        accessibilityHint={
          show
            ? `Campo ${placeholder.toLowerCase()} visible`
            : `Campo ${placeholder.toLowerCase()} oculto`
        }
        importantForAccessibility="yes"
      />
      <TouchableOpacity
        onPress={() => setShow(!show)}
        accessibilityRole="button"
        accessibilityLabel={show ? "Ocultar contraseña" : "Mostrar contraseña"}
        accessibilityHint="Presiona para alternar la visibilidad de la contraseña"
        accessibilityState={{ expanded: show }}
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
    const emailN = normalizeInput(email);
    const passN = normalizeInput(password);
    const passCN = normalizeInput(passwordConfirm);

    if (!emailN || !passN) {
      Alert.alert("Campos requeridos", "Ingresa tu correo y contraseña.");
      return;
    }
    if (!isValidEmail(emailN)) {
      Alert.alert("Correo inválido", "Verifica el formato de tu correo.");
      return;
    }
    if (passN.length > MAX_PASS_LEN) {
      Alert.alert("Contraseña demasiado larga", `Máximo ${MAX_PASS_LEN} caracteres.`);
      return;
    }
    if (passN !== passCN) {
      Alert.alert("Validación", "Las contraseñas no coinciden.");
      return;
    }

    if (hasSuspiciousPayload(emailN) || hasSuspiciousPayload(passN)) {
      Alert.alert("Entrada no permitida", "Se detectaron patrones no permitidos.");
      return;
    }

    try {
      setLoading(true);
      const result = await registerApi(emailN, passN);
      setLoading(false);

      if (result.ok) {
        Alert.alert(
          "Registro exitoso",
          result.message || "Tu cuenta fue creada correctamente.",
          [
            {
              text: "Aceptar",
              onPress: () => {
                setPassword("");
                setPasswordConfirm("");
                navigation.navigate("Login", { initialMessage: emailN });
              },
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

      if (response.status === 409) {
        return { ok: false, message: "El correo ya está registrado." };
      }
      if (response.status === 400 || response.status === 422) {
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

      let msg: string | undefined = undefined;
      try {
        const data = await response.json();
        msg = data?.message;
        console.log("registerApi:", data);
      } catch {}
      return { ok: true, message: msg };
    } catch (error) {
      console.error("Hubo un error al llamar a la API", error);
      return { ok: false, message: "Problema de conexión. Intenta nuevamente." };
    }
  };

  return (
    <SafeAreaView
      className="flex-1 bg-emerald-900"
      accessible={true}
      accessibilityLabel="Pantalla de registro"
      accessibilityHint="Aquí puedes crear tu cuenta con correo y contraseña"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          accessible={false}
        >
          <View className="flex-1 px-6">
            <View
              className="items-center mt-6 mb-10 pt-10"
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel="IA MIND"
            >
              <Text className="text-white text-5xl font-extrabold tracking-widest">
                IA MIND
              </Text>
            </View>

            <View className="gap-4 flex-1 justify-center" accessible={false}>
              <Text
                className="text-white text-3xl font-extrabold mb-2"
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel="Crea tu cuenta"
              >
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
                maxLength={MAX_EMAIL_LEN}
                accessible={true}
                accessibilityLabel="Correo electrónico"
                accessibilityHint="Ingresa tu correo electrónico para registrarte"
                importantForAccessibility="yes"
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
                <Text
                  className={`text-sm ${passwordsMatch ? "text-emerald-300" : "text-red-300"}`}
                  accessible={true}
                  accessibilityLiveRegion="polite"
                  accessibilityLabel={
                    passwordsMatch
                      ? "Las contraseñas coinciden"
                      : "Las contraseñas no coinciden"
                  }
                >
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
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={loading ? "Registrando cuenta" : "Registrarse"}
                accessibilityHint="Presiona para crear tu cuenta"
                accessibilityState={{
                  disabled: !email || !password || !passwordsMatch || loading,
                  busy: loading,
                }}
              >
                {loading ? (
                  <View
                    accessible={true}
                    accessibilityLiveRegion="polite"
                    accessibilityLabel="Cargando"
                    accessibilityHint="Se está procesando el registro"
                  >
                    <ActivityIndicator />
                  </View>
                ) : (
                  <Text className="text-emerald-900 text-xl font-extrabold">
                    Registrarse
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="mt-auto mb-6 items-center" accessible={false}>
              <View className="flex-row items-center" accessible={false}>
                <Text
                  className="text-white/80 text-base"
                  accessible={true}
                  accessibilityLabel="¿Ya tienes una cuenta?"
                >
                  ¿Ya tienes una cuenta?
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Login")}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Inicia sesión"
                  accessibilityHint="Abre la pantalla para iniciar sesión"
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