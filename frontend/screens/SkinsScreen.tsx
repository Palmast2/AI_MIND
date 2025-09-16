import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

// 👇 importa todo desde el módulo compartido
import {
  SKINS,
  STORAGE_KEY,
  type SkinItem,
  type LocalSkinItem,
  type RemoteSkinItem,
  isRemoteValue,
  resolveSource,
} from "./skins"; // <-- ajusta el path si tu archivo está en otra carpeta

export default function SkinsScreen() {
  const navigation = useNavigation();

  // Lista base (todas las locales)
  const baseItems: SkinItem[] = useMemo(
    () => Object.keys(SKINS).map((k) => ({ type: "local", key: k as keyof typeof SKINS })),
    []
  );

  const [items, setItems] = useState<SkinItem[]>(baseItems);
  const [selected, setSelected] = useState<SkinItem>({ type: "local", key: "default" });
  const [remoteUrl, setRemoteUrl] = useState("");

  // Cargar selección previa
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        if (isRemoteValue(saved)) {
          const remoteItem: RemoteSkinItem = { type: "remote", uri: saved };
          setItems((prev) => {
            const exists = prev.some((i) => i.type === "remote" && i.uri === saved);
            return exists ? prev : [remoteItem, ...prev];
          });
          setSelected(remoteItem);
        } else if ((SKINS as any)[saved]) {
          setSelected({ type: "local", key: saved as keyof typeof SKINS });
        }
      } catch {}
    })();
  }, []);

  // Fuente para el preview (usando helper)
  const previewSource = useMemo(() => resolveSource(selected), [selected]);

  const handleAddRemote = () => {
    const url = remoteUrl.trim();
    if (!url) return;
    if (!isRemoteValue(url)) {
      Alert.alert("URL inválida", "Usa una URL que inicie con http(s):// o file://");
      return;
    }
    const newItem: RemoteSkinItem = { type: "remote", uri: url };
    setItems((prev) => {
      const exists = prev.some((i) => i.type === "remote" && i.uri === url);
      return exists ? prev : [newItem, ...prev];
    });
    setSelected(newItem);
    setRemoteUrl("");
    Keyboard.dismiss();
  };

  const handleSave = async () => {
    try {
      if (selected.type === "remote") {
        await AsyncStorage.setItem(STORAGE_KEY, selected.uri);
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, selected.key as string);
      }
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar la skin.");
    }
  };

  const handleReset = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, "default");
      setSelected({ type: "local", key: "default" });
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "No se pudo restablecer.");
    }
  };

  const renderItem = ({ item }: { item: SkinItem }) => {
    const isSelected =
      item.type === "remote"
        ? selected.type === "remote" && selected.uri === item.uri
        : selected.type === "local" && selected.key === item.key;

    const source = resolveSource(item); // 👈 helper

    return (
      <TouchableOpacity
        onPress={() => setSelected(item)}
        style={{
          flex: 1 / 3,
          aspectRatio: 1,
          margin: 6,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: isSelected ? "#00634C" : "transparent",
          backgroundColor: "white",
          justifyContent: "center",
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <Image source={source} style={{ width: "80%", height: "80%" }} resizeMode="contain" />
        <Text style={{ marginTop: 4, color: "#00634C", fontSize: 12 }} numberOfLines={1}>
          {item.type === "remote" ? "Remota" : (item.key as string)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F5F7F6" }}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 }}>
        <Text style={{ color: "#003d30", fontSize: 18, fontWeight: "700" }}>
          Selecciona tu skin
        </Text>
      </View>

      {/* Preview grande */}
      <View
        style={{
          marginHorizontal: 16,
          borderRadius: 20,
          backgroundColor: "white",
          padding: 16,
          alignItems: "center",
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 2,
        }}
      >
        <Image source={previewSource} style={{ width: 240, height: 240 }} resizeMode="contain" />
      </View>

      {/* Grid de skins */}
      <FlatList
        data={items}
        keyExtractor={(item, idx) =>
          item.type === "remote" ? `remote-${item.uri}` : `local-${item.key}-${idx}`
        }
        renderItem={renderItem}
        numColumns={3}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      />

      {/* Acciones */}
      <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingBottom: 16 }}>
        <TouchableOpacity
          onPress={handleReset}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#e7f2ef",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "#b9d9d2",
          }}
        >
          <Text style={{ color: "#00634C", fontWeight: "700" }}>Restablecer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderRadius: 12,
            backgroundColor: "#00634C",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>Guardar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
