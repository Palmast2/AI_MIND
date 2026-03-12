import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
import { SendIcon } from "icons/Enviar"; // ajusta la ruta si es necesario

export default function MenuContactoEmergencia({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6 pt-6">

            {/* Botón 1 */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
              onPress={() => navigation.navigate("OptionsInfoContacto")}
            >
              <Text className="text-white text-lg font-semibold">
                Crear Contacto
              </Text>
              <SendIcon />
            </TouchableOpacity>

          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}