import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from '@react-native-async-storage/async-storage';

type Role = {
  id: number;
  relacion: string;
};

type SaveContactResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

const MAX_TEXT_LEN = 120;
const MAX_PHONE_LEN = 20;


function normalizeInput(s: string) {
  return s.normalize("NFKC").trim();
}

export default function InfoContacto({ navigation }: any) {
  const [fullName, setFullName] = useState("");
  const [alias, setAlias] = useState("");
  const [phone, setPhone] = useState("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [selectOpen, setSelectOpen] = useState(false);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  const isFormValid =
    fullName.trim().length > 0 &&
    alias.trim().length > 0 &&
    phone.trim().length > 0 &&
    selectedRole !== null;

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

  const saveCookies = async (cookiesObj: Record<string, string>) => {
    try {
      await AsyncStorage.setItem('cookies', JSON.stringify(cookiesObj));
      console.log(cookiesObj);
      console.log('✅ Cookies guardadas');
    } catch (e) {
      console.error('Error al guardar cookies', e);
    }
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

  const fetchRoles = async () => {
    try {
      setRolesLoading(true);

      const response = await fetch(
        "https://api.aimind.portablelab.work/api/v1/perfil/contactos/relaciones",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("No se pudieron cargar las relaciones");
      }

      const data = await response.json();
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando relaciones:", error);
      Alert.alert("Error", "No se pudieron cargar las relaciones.");
    } finally {
      setRolesLoading(false);
    }
  };

  function toErrorMessage(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string" ? item : JSON.stringify(item)
      )
      .join("\n");
  }

  if (value && typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "Ocurrió un error inesperado.";
    }
  }

  return "Ocurrió un error inesperado.";
}

  const onSave = async () => {
    const fullNameN = normalizeInput(fullName);
    const aliasN = normalizeInput(alias);
    const phoneN = normalizeInput(phone);

    if (!fullNameN || !aliasN || !phoneN || !selectedRole) {
      Alert.alert("Campos requeridos", "Completa todos los campos.");
      return;
    }

    try {
      setLoading(true);

      const result = await saveContactApi({
        nombre: fullNameN,
        alias: aliasN,
        telefono: phoneN,
        relation_id: selectedRole.id,
      });

      if (result.ok) {
        Alert.alert(
          "Guardado",
          result.message || "El contacto se guardó correctamente."
        );
        setFullName("");
        setAlias("");
        setPhone("");
        setSelectedRole(null);
        navigation.navigate("Home")
      } else {
        Alert.alert("No se pudo guardar", toErrorMessage(result.message));
      }
    } catch (error) {
      Alert.alert("Error", "Ocurrió un error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const saveContactApi = async (payload: {
    nombre: string;
    alias: string;
    telefono: string;
    relation_id: number;
  }): Promise<SaveContactResult> => {
    try {
      const token = await getAccessToken()
      const request = async (csrfToken: string) => fetch("https://api.aimind.portablelab.work/api/v1/perfil/contactos", {
        method: "POST",
        headers: {
          'X-CSRF-TOKEN': csrfToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: 'include' as any,
      });

      let response = await request(token)

      if(response.status === 401) {
        const refreshed = await refreshTokens();
        if (!refreshed.ok) throw new Error(`Refresh falló: ${refreshed.error ?? 'desconocido'}`);
        const retryToken = await getAccessToken();
        response = await request(retryToken);
      }

      if (response.status === 400 || response.status === 422) {
        let detail: unknown = "";

        try {
          const err = await response.json();
          detail = err?.message ?? err?.detail ?? err;
          console.log("Error backend contactos:", err);
        } catch {}

        return {
          ok: false,
          message: toErrorMessage(detail) || "Datos inválidos. Verifica la información.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          message: "Error del servidor al guardar el contacto.",
        };
      }

      let msg: string | undefined;
      try {
        const data = await response.json();
        msg = data?.message;
      } catch {}

      return { ok: true, message: msg };
    } catch (error) {
      console.error("Error al guardar contacto:", error);
      return {
        ok: false,
        message: "Problema de conexión. Intenta nuevamente.",
      };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <Pressable className="flex-1" onPress={Keyboard.dismiss}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6">
            <View className="items-center mt-8 mb-8">
              <Text className="text-white text-4xl font-extrabold">
                Contacto
              </Text>
            </View>

            <View className="flex-1 justify-center gap-4">
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre completo"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
                editable={!loading}
                maxLength={MAX_TEXT_LEN}
              />

              <TextInput
                value={alias}
                onChangeText={setAlias}
                placeholder="Alias"
                placeholderTextColor="rgba(255,255,255,0.7)"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
                editable={!loading}
                maxLength={MAX_TEXT_LEN}
              />

              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="Numero"
                placeholderTextColor="rgba(255,255,255,0.7)"
                keyboardType="phone-pad"
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
                editable={!loading}
                maxLength={MAX_PHONE_LEN}
              />

              <TouchableOpacity
                onPress={() => !rolesLoading && setSelectOpen(true)}
                activeOpacity={0.8}
                className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 border border-emerald-700"
                disabled={loading || rolesLoading}
              >
                <Text
                  className={`text-base ${
                    selectedRole ? "text-white" : "text-white/70"
                  }`}
                >
                  {rolesLoading
                    ? "Cargando relaciones..."
                    : selectedRole
                    ? selectedRole.relacion
                    : "Selecciona una relación"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="pb-6 pt-6">
              <TouchableOpacity
                onPress={onSave}
                disabled={!isFormValid || loading}
                className={`w-full rounded-2xl py-4 items-center ${
                  !isFormValid || loading ? "bg-white/50" : "bg-white"
                }`}
              >
                {loading ? (
                  <ActivityIndicator />
                ) : (
                  <Text className="text-emerald-900 text-xl font-extrabold">
                    Guardar
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAwareScrollView>
      </Pressable>

      <Modal
        visible={selectOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/50 justify-end"
          onPress={() => setSelectOpen(false)}
        >
          <Pressable onPress={() => {}}>
            <View className="bg-emerald-950 rounded-t-3xl px-6 pt-6 pb-8 max-h-[70%]">
              <Text className="text-white text-2xl font-bold mb-4">
                Selecciona una relación
              </Text>

              <FlatList
                data={roles}
                keyExtractor={(item) => String(item.id)}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="py-4 border-b border-white/10"
                    onPress={() => {
                      setSelectedRole(item);
                      setSelectOpen(false);
                    }}
                  >
                    <Text className="text-white text-lg">
                      {item.relacion}
                    </Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text className="text-white/70 py-4">
                    No hay relaciones disponibles.
                  </Text>
                }
              />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}