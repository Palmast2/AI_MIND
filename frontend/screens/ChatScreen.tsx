import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ActivityIndicator,
  Image,
  findNodeHandle,
  TouchableOpacity,
  Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

import { SKINS, STORAGE_KEY } from "./skins"; // 👈 importa el mapa compartido

type Msg = { id: string; role: 'user' | 'assistant'; text: string };

export default function ChatScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const initialMessage = route?.params?.initialMessage as string | undefined;

  // Orden normal: viejo -> nuevo (lo reciente se ve ABAJO)
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

   // 👇 Estado para la skin
  const [skinKey, setSkinKey] = useState<keyof typeof SKINS>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  const listRef = useRef<KeyboardAwareFlatList<Msg>>(null);
  const inputRef = useRef<TextInput>(null);

  const nowId = (s: string) =>
    `${Date.now()}_${Math.random().toString(36).slice(2)}_${s}`;

  const append = (m: Msg) => setMessages(prev => [...prev, m]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      (listRef.current as any)?.scrollToOffset?.({
        offset: 999999,
        animated: true,
      });
    });
  }, []);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      const node = findNodeHandle(inputRef.current);
      (listRef.current as any)?.scrollToFocusedInput?.(node);
    });
  }, []);

  const handleBlur = useCallback(() => setIsFocused(false), []);

  // ====== LÓGICA DE SKINS ======
  const isRemoteValue = (v: string) =>
    /^https?:\/\//i.test(v) || /^file:\/\//i.test(v);

  // Cargar/recargar skin al enfocar (útil al volver de SkinsScreen)
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (!active) return;

          if (!saved) {
            setSkinKey('default');
            setRemoteUri(null);
            return;
          }

          if (isRemoteValue(saved)) {
            setRemoteUri(saved);
            setSkinKey('default'); // clave no se usa cuando hay URI
          } else if ((SKINS as any)[saved]) {
            setSkinKey(saved as keyof typeof SKINS);
            setRemoteUri(null);
          } else {
            setSkinKey('default');
            setRemoteUri(null);
          }
        } catch {
          setSkinKey('default');
          setRemoteUri(null);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  // Fuente para el avatar del asistente
  const imageSource = useMemo(() => {
    if (remoteUri) return { uri: remoteUri };
    return SKINS[skinKey] ?? SKINS.default;
  }, [skinKey, remoteUri]);

  // Mock de API — reemplaza por tu fetch real
  const callAPI = async (userMessage: string): Promise<string> => {
  try {
    const cookiesString  = await AsyncStorage.getItem('cookies');
    if (!cookiesString) {
      throw new Error("No se encontraron cookies guardadas");
    }
    const cookies = JSON.parse(cookiesString);
    const token = cookies.csrf_access_token
    const response = await fetch("https://api.aimind.portablelab.work/api/v1/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-TOKEN": token,
      },
      body: JSON.stringify({ user_message: userMessage }),
      credentials: 'include',

    });

    if (!response.ok) {
      throw new Error(`Error en la petición: ${response.status}`);
    }

    const data = await response.json();
    // 👀 Ajusta según lo que devuelva tu backend
    const content = data.response.choices[0].message.content;

    return content;
  } catch (error) {
    console.error(error);
    return "Hubo un error al llamar a la API";
  }
};

  const sendMessage = useCallback(
    async (payload?: string) => {
      const toSend = (payload ?? text).trim();
      if (!toSend) return;

      append({ id: nowId('u'), role: 'user', text: toSend });
      setText('');
      scrollToEnd();

      try {
        setLoading(true);
        const reply = await callAPI(toSend);
        append({ id: nowId('a'), role: 'assistant', text: reply });
      } catch {
        append({
          id: nowId('e'),
          role: 'assistant',
          text: 'Ups, hubo un problema al contactar la API. Intenta de nuevo.',
        });
      } finally {
        setLoading(false);
        scrollToEnd();
      }
    },
    [text, scrollToEnd]
  );

  // Si viene texto desde Home, envíalo de inmediato
  useEffect(() => {
    if (initialMessage?.trim()) sendMessage(initialMessage.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Burbujas
  const renderItem = ({ item }: { item: Msg }) => {
    const isUser = item.role === 'user';

    if (isUser) {
      return (
        <View className="my-1 max-w-[80%] self-end rounded-2xl bg-[#DCF8C6] px-3 py-2 shadow">
          <Text className="text-[16px] text-[#0F0F0F]">{item.text}</Text>
        </View>
      );
    }

    return (
      <View className="my-1 max-w-[85%] flex-row items-end gap-2 self-start">
        <Image
          source={imageSource}
          style={{ width: 48, height: 48, borderRadius: 14 }}
          resizeMode="contain"
        />
        <View className="max-w-[85%] rounded-2xl bg-white px-3 py-2 shadow">
          <Text className="text-[16px] text-[#0F0F0F]">{item.text}</Text>
        </View>
      </View>
    );
  };

  // Footer memoizado para que NO se remonte el TextInput en cada tecla (mantiene el foco/teclado abierto)
  const ListFooter = useMemo(
    () => (
      <>
        {/* “Escribiendo…” */}
        {loading && (
          <View className="mb-2 items-start">
            <View className="max-w-[60%] flex-row items-center rounded-2xl bg-white px-3 py-2">
              <ActivityIndicator size="small" />
              <Text className="ml-2 text-[#0F0F0F]">Escribiendo…</Text>
            </View>
          </View>
        )}

        {/* Input estilo Home + botón Enviar */}
        <View
          style={{
            alignSelf: 'stretch',
            width: '100%',
            backgroundColor: 'white',
            borderRadius: 24,
            paddingHorizontal: 12,
            paddingVertical: 10,
            shadowColor: '#000',
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
            marginTop: 8,
            flexDirection: 'row',       // 👈 input y botón en la misma línea
            alignItems: 'center',
          }}
        >
          <TextInput
            ref={inputRef}
            placeholder="¿Cómo ha estado tu día?"
            placeholderTextColor="#00634C"
            style={{
              flex: 1,
              color: '#00634C',
              fontSize: 16,
              minHeight: 40,
              maxHeight: 140,
              textAlignVertical: 'center',
              paddingRight: 8,
            }}
            value={text}
            onChangeText={setText}
            multiline
            numberOfLines={1}
            scrollEnabled
            returnKeyType="default"   // ← ya NO enviamos con Enter
            blurOnSubmit={false}      // ← evita cerrar teclado al teclear
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Botón enviar (a la derecha) */}
          <View className="mt-2 flex-row justify-end">
            <TouchableOpacity
              onPress={() => {
                sendMessage();
                Keyboard.dismiss();
              }}
              className="rounded-full bg-[#0b7] px-4 py-2"
              disabled={!text.trim() || loading}
            >
              <Text className="font-semibold text-white">Enviar</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* padding para el safe area inferior */}
        <View style={{ height: insets.bottom }} />
      </>
    ),
    [loading, text, isFocused, insets.bottom, handleFocus, handleBlur, sendMessage]
  );

  return (
    <SafeAreaView className="flex-1 bg-[#00634C]">
      <View className="flex-1 px-4" style={{ paddingTop: 8, paddingBottom: 8 }}>
        <KeyboardAwareFlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          // Ancla el contenido al fondo (mensajes se ven "abajo")
          contentContainerStyle={{
            paddingVertical: 8,
            flexGrow: 1,
            justifyContent: 'flex-end',
          }}
          // Footer abajo, dentro de la lista
          ListFooterComponent={ListFooter}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid
          enableAutomaticScroll
          keyboardOpeningTime={0}
          // 🆙 Subida un poquito más (+5px)
          extraScrollHeight={isFocused ? 190 : 90}
          extraHeight={isFocused ? 145 : 45}
          onContentSizeChange={scrollToEnd}
        />
      </View>
    </SafeAreaView>
  );
}
