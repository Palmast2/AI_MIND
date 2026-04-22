import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Alert,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SaveResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };

const MAX_EMAIL_LEN = 120;
const BASE_URL = "https://api.aimind.portablelab.work/api/v1/perfil/psicologo";

function normalizeInput(s: string) {
  return s.normalize("NFKC").trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function InfoPsicologo({ navigation }: any) {
  const [correo, setCorreo] = useState("");
  const [initialCorreo, setInitialCorreo] = useState("");

  const [loading, setLoading] = useState(false);
  const [loadingInitialData, setLoadingInitialData] = useState(true);

  // true = ya existe registro en backend
  const [hasExistingRecord, setHasExistingRecord] = useState(false);

  const correoNormalizado = useMemo(() => normalizeInput(correo), [correo]);
  const isEmailValid = useMemo(
    () => correoNormalizado.length > 0 && isValidEmail(correoNormalizado),
    [correoNormalizado]
  );
  const hasChanges = correoNormalizado !== normalizeInput(initialCorreo);

  const parseSetCookieHeader = (setCookie: string): Record<string, string> => {
    const cookiesObj: Record<string, string> = {};
    setCookie.split(/,(?=[^;]+=[^;]+)/g).forEach((cookieStr) => {
      const [pair] = cookieStr.split(";");
      const [name, value] = pair.split("=").map((s) => s.trim());
      if (name) cookiesObj[name] = value ?? "";
    });
    return cookiesObj;
  };

  const saveCookies = async (cookiesObj: Record<string, string>) => {
    try {
      await AsyncStorage.setItem("cookies", JSON.stringify(cookiesObj));
      console.log("✅ Cookies guardadas");
    } catch (e) {
      console.error("Error al guardar cookies", e);
    }
  };

  const mergeAndSaveCookies = async (newCookies: Record<string, string>) => {
    const prev = await AsyncStorage.getItem("cookies");
    const prevObj = prev ? JSON.parse(prev) : {};
    const merged = { ...prevObj, ...newCookies };
    await saveCookies(merged);
    return merged;
  };

  const getAccessToken = async (): Promise<string> => {
    const cookiesString = await AsyncStorage.getItem("cookies");
    if (!cookiesString) throw new Error("No se encontraron cookies guardadas");

    const cookies = JSON.parse(cookiesString);
    const token = cookies.csrf_access_token;

    if (!token) throw new Error("Falta csrf_access_token");
    return token;
  };

  const refreshTokens = async (): Promise<{ ok: boolean; error?: string }> => {
    try {
      const cookiesString = await AsyncStorage.getItem("cookies");
      if (!cookiesString) return { ok: false, error: "No hay cookies guardadas" };

      const cookies = JSON.parse(cookiesString);
      const refreshCsrf = cookies.csrf_refresh_token;

      if (!refreshCsrf) {
        return { ok: false, error: "Falta csrf_refresh_token" };
      }

      const response = await fetch(
        "https://api.aimind.portablelab.work/api/v1/refresh",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": refreshCsrf,
          },
          credentials: "include" as any,
        }
      );

      if (!response.ok) {
        const txt = await response.text().catch(() => "");
        return { ok: false, error: `Refresh falló (${response.status}): ${txt}` };
      }

      const setCookie = response.headers.get("set-cookie");
      if (setCookie) {
        const cookiesObj = parseSetCookieHeader(setCookie);
        await mergeAndSaveCookies(cookiesObj);
      }

      return { ok: true };
    } catch (e) {
      console.error(e);
      return { ok: false, error: "Error inesperado en refreshTokens" };
    }
  };

  function toErrorMessage(value: unknown): string {
    if (typeof value === "string") return value;

    if (Array.isArray(value)) {
      return value
        .map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
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

  const fetchWithAuthRetry = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const token = await getAccessToken();

    const doRequest = async (csrfToken: string) =>
      fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrfToken,
          ...(options.headers || {}),
        },
        credentials: "include" as any,
      });

    let response = await doRequest(token);

    if (response.status === 401) {
      const refreshed = await refreshTokens();
      if (!refreshed.ok) {
        throw new Error(`Refresh falló: ${refreshed.error ?? "desconocido"}`);
      }

      const retryToken = await getAccessToken();
      response = await doRequest(retryToken);
    }

    return response;
  };

  const fetchPsicologo = async () => {
  try {
    setLoadingInitialData(true);

    const response = await fetch(BASE_URL, {
      method: "GET",
      credentials: "include" as any,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      const refreshed = await refreshTokens();
      if (!refreshed.ok) {
        throw new Error(`Refresh falló: ${refreshed.error ?? "desconocido"}`);
      }

      const retryResponse = await fetch(BASE_URL, {
        method: "GET",
        credentials: "include" as any,
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!retryResponse.ok) {
        const txt = await retryResponse.text().catch(() => "");
        throw new Error(`Error GET (${retryResponse.status}): ${txt}`);
      }

      const retryData = await retryResponse.json().catch(() => null);
      const email = retryData?.email_asignado ?? null;

      if (email) {
        setCorreo(email);
        setInitialCorreo(email);
        setHasExistingRecord(true);
      } else {
        setCorreo("");
        setInitialCorreo("");
        setHasExistingRecord(false);
      }

      return;
    }

    if (!response.ok) {
      const txt = await response.text().catch(() => "");
      throw new Error(`Error GET (${response.status}): ${txt}`);
    }

    const data = await response.json().catch(() => null);
    const email = data?.email_asignado ?? null;

    if (email) {
      setCorreo(email);
      setInitialCorreo(email);
      setHasExistingRecord(true);
    } else {
      setCorreo("");
      setInitialCorreo("");
      setHasExistingRecord(false);
    }
  } catch (error) {
    console.error("Error cargando psicólogo:", error);
    setCorreo("");
    setInitialCorreo("");
    setHasExistingRecord(false);
    Alert.alert("Error", "No se pudo cargar el psicólogo asignado.");
  } finally {
    setLoadingInitialData(false);
  }
};

  useEffect(() => {
    fetchPsicologo();
  }, []);

  const createPsicologo = async (): Promise<SaveResult> => {
    try {
      const payload = {
        email_psicologo: correoNormalizado,
      };

      const response = await fetchWithAuthRetry(BASE_URL, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.status === 400 || response.status === 422) {
        let detail: unknown = "";
        try {
          const err = await response.json();
          detail = err?.message ?? err?.detail ?? err;
        } catch {}
        return {
          ok: false,
          message:
            toErrorMessage(detail) || "Datos inválidos. Verifica la información.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          message: "Error del servidor al guardar la información.",
        };
      }

      let msg: string | undefined;
      try {
        const data = await response.json();
        msg = data?.message;
      } catch {}

      return { ok: true, message: msg };
    } catch (error) {
      console.error("Error POST psicólogo:", error);
      return {
        ok: false,
        message: "Problema de conexión. Intenta nuevamente.",
      };
    }
  };

  const updatePsicologo = async (): Promise<SaveResult> => {
    try {
      const payload = {
        email_psicologo: correoNormalizado,
      };

      const response = await fetchWithAuthRetry(BASE_URL, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      if (response.status === 400 || response.status === 422) {
        let detail: unknown = "";
        try {
          const err = await response.json();
          detail = err?.message ?? err?.detail ?? err;
        } catch {}
        return {
          ok: false,
          message:
            toErrorMessage(detail) || "Datos inválidos. Verifica la información.",
        };
      }

      if (!response.ok) {
        return {
          ok: false,
          message: "Error del servidor al actualizar la información.",
        };
      }

      let msg: string | undefined;
      try {
        const data = await response.json();
        msg = data?.message;
      } catch {}

      return { ok: true, message: msg };
    } catch (error) {
      console.error("Error PUT psicólogo:", error);
      return {
        ok: false,
        message: "Problema de conexión. Intenta nuevamente.",
      };
    }
  };

  const deletePsicologo = async (): Promise<SaveResult> => {
    try {
      const response = await fetchWithAuthRetry(BASE_URL, {
        method: "DELETE",
      });

      if (!response.ok) {
        let detail = "Error del servidor al eliminar la información.";

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
      console.error("Error DELETE psicólogo:", error);
      return {
        ok: false,
        message: "Problema de conexión. Intenta nuevamente.",
      };
    }
  };

  const onCreate = async () => {
    if (!isEmailValid) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    try {
      setLoading(true);

      const result = await createPsicologo();

      if (result.ok) {
        Alert.alert("Guardado", result.message || "Correo guardado correctamente.");
        setInitialCorreo(correoNormalizado);
        setHasExistingRecord(true);
      } else {
        Alert.alert("No se pudo guardar", result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onUpdate = async () => {
    if (!isEmailValid) {
      Alert.alert("Correo inválido", "Ingresa un correo electrónico válido.");
      return;
    }

    try {
      setLoading(true);

      const result = await updatePsicologo();

      if (result.ok) {
        Alert.alert(
          "Actualizado",
          result.message || "Correo actualizado correctamente."
        );
        setInitialCorreo(correoNormalizado);
        setHasExistingRecord(true);
      } else {
        Alert.alert("No se pudo actualizar", result.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    Alert.alert(
      "Eliminar",
      "¿Seguro que deseas eliminar el correo del psicólogo?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              const result = await deletePsicologo();

              if (result.ok) {
                Alert.alert(
                  "Eliminado",
                  result.message || "Registro eliminado correctamente."
                );
                setCorreo("");
                setInitialCorreo("");
                setHasExistingRecord(false);
              } else {
                Alert.alert("No se pudo eliminar", result.message);
              }
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
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
                Psicólogo
              </Text>
            </View>

            <View className="flex-1 justify-center gap-4">
              {loadingInitialData ? (
                <View className="py-10 items-center">
                  <ActivityIndicator color="#fff" />
                  <Text className="text-white/80 mt-3">
                    Cargando información...
                  </Text>
                </View>
              ) : (
                <TextInput
                  value={correo}
                  onChangeText={setCorreo}
                  placeholder="Correo electrónico"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  className="w-full rounded-2xl px-5 py-4 bg-emerald-800/60 text-white border border-emerald-700"
                  editable={!loading}
                  maxLength={MAX_EMAIL_LEN}
                />
              )}
            </View>

            {!loadingInitialData && (
              <View className="pb-6 pt-6 gap-3">
                {!hasExistingRecord ? (
                  <TouchableOpacity
                    onPress={onCreate}
                    disabled={!isEmailValid || loading}
                    className={`w-full rounded-2xl py-4 items-center ${
                      !isEmailValid || loading ? "bg-white/50" : "bg-white"
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
                ) : (
                  <>
                    <TouchableOpacity
                      onPress={onUpdate}
                      disabled={!isEmailValid || !hasChanges || loading}
                      className={`w-full rounded-2xl py-4 items-center ${
                        !isEmailValid || !hasChanges || loading
                          ? "bg-white/50"
                          : "bg-white"
                      }`}
                    >
                      {loading ? (
                        <ActivityIndicator />
                      ) : (
                        <Text className="text-emerald-900 text-xl font-extrabold">
                          Actualizar
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onDelete}
                      disabled={loading}
                      className={`w-full rounded-2xl py-4 items-center ${
                        loading ? "bg-red-300" : "bg-red-500"
                      }`}
                    >
                      <Text className="text-white text-xl font-extrabold">
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>
      </Pressable>
    </SafeAreaView>
  );
}