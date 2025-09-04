import React, { useRef, useState } from "react";
import {
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  findNodeHandle,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// 👇 recibe navigation desde React Navigation
export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);

  // 👇 estado para el texto
  const [text, setText] = useState("");

  const scrollRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  const handleFocus = () => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      const node = findNodeHandle(inputRef.current);
      scrollRef.current?.scrollToFocusedInput(node);
    });
  };

  const handleBlur = () => setIsFocused(false);

  // 👇 cuando se “envía” el input
  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    Keyboard.dismiss();
    navigation.navigate("Chat", { initialMessage: msg }); // ← cambia de vista y pasa el texto
    setText("");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#00634C" }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          enableOnAndroid
          enableAutomaticScroll
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={isFocused ? 160 : 60}
          extraHeight={isFocused ? 120 : 24}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            {/* Imagen */}
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <Image
                source={require("../assets/cat-pixel.png")}
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
            </View>

            {/* Input burbuja */}
            <View
              style={{
                alignSelf: "stretch",
                width: "100%",
                backgroundColor: "white",
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: "#000",
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <TextInput
                ref={inputRef}
                placeholder="¿Cómo ha estado tu día?"
                placeholderTextColor="#00634C"
                style={{
                  color: "#00634C",
                  fontSize: 16,
                  minHeight: 40,
                  maxHeight: 140,
                  textAlignVertical: "top",
                }}
                // 👇 controlar el valor
                value={text}
                onChangeText={setText}
                multiline
                numberOfLines={isFocused ? 4 : 1}
                scrollEnabled
                returnKeyType="send"
                blurOnSubmit={true}          // ← necesario para que onSubmitEditing dispare con multiline
                onSubmitEditing={handleSend} // ← navegar al Chat con el mensaje
                onFocus={handleFocus}
                onBlur={handleBlur}
                // Fallback Android si algún teclado inserta salto de línea en vez de enviar
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === "Enter") {
                    handleSend();
                  }
                }}
              />
            </View>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
