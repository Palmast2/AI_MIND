import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { SendIcon } from "icons/Enviar"; // ajusta la ruta si es necesario
import { HealthUser } from "icons/UserIcons/HealthUser";

type Contacto = {
  nombre: string;
  telefono: number | string;
  alias: string;
  relacion: string;
  id: number;
};

export default function ListaContactosEmergencia({ navigation }: any) {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const callEmergencyContact = async (phone: string | number) => {
    try {
      const cleanPhone = String(phone ?? "").replace(/[^\d+]/g, "");

      if (!cleanPhone) {
        Alert.alert("Error", "No se encontró un número válido.");
        return;
      }

      await Linking.openURL(`tel:${cleanPhone}`);
    } catch (error) {
      console.error("callEmergencyContact error:", error);
      Alert.alert("Error", "No se pudo abrir la llamada.");
    }
  };

  const obtenerContactos = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(
        "https://api.aimind.portablelab.work/api/v1/perfil/contactos",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include" as any,
        }
      );

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      setContactos(Array.isArray(data) ? data : []);
      console.log(data)
    } catch (error) {
      console.error("Error al obtener contactos:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar los contactos de emergencia."
      );
      setContactos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    obtenerContactos();
  }, [obtenerContactos]);

  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => obtenerContactos(true)}
            />
          }
        >
          <View className="flex-1 px-6 pt-6">
            {/* Loading */ }
            {loading ? (
              <View className="py-10 items-center justify-center">
                <ActivityIndicator size="large" color="#ffffff" />
                <Text className="text-white mt-3">Cargando contactos...</Text>
              </View>
            ) : contactos.length === 0 ? (
              /* Sin contactos */
              <View className="py-10 items-center justify-center">
                <Text className="text-white text-base text-center">
                  No hay contactos registrados.
                </Text>
              </View>
            ) : (
              /* Lista de contactos */
              contactos.map((contacto) => (
                <TouchableOpacity
                  key={contacto.id}
                  className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
                  onPress={() => callEmergencyContact(contacto.telefono)}
                >
                  <View className="flex-1">
                    <Text className="text-white text-lg font-semibold">
                      {contacto.alias || contacto.nombre}
                    </Text>
                    <Text className="text-white/80 text-sm mt-1">
                      Nombre: {contacto.nombre}
                    </Text>
                  </View>

                  <SendIcon />
                </TouchableOpacity>
              ))
            )}
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}