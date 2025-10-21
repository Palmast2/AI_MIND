// components/InputBar.tsx
import React from "react";
import { View, TextInput, Keyboard, StyleSheet } from "react-native";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
};

export default function InputBar({ value, onChangeText, onSubmit, autoFocus }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Escribe un mensaje..."
        placeholderTextColor="#00634C"
        style={styles.input}
        multiline
        numberOfLines={4}
        maxLength={1000}
        returnKeyType="send"
        blurOnSubmit={false}
        onSubmitEditing={() => {
          Keyboard.dismiss();
          onSubmit();
        }}
        autoFocus={autoFocus}
        scrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
  },
  input: {
    color: "#00634C",
    fontSize: 16,
    minHeight: 40,
    maxHeight: 140,
    textAlignVertical: "top",
  },
});
