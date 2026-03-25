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

export default function OptionsScreen({ navigation }: any) {
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
              onPress={() => navigation.navigate("OptionsInfoPersonal")}
            >
              <Text className="text-white text-lg font-semibold">
                Informacion Personal
              </Text>
              <SendIcon />
            </TouchableOpacity>

            {/* Botón 2 */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
              onPress={() => navigation.navigate("OptionsMenuContactoEmergencia")}
            >
              <Text className="text-white text-lg font-semibold">
                Contactos de emergencia
              </Text>
              <SendIcon />
            </TouchableOpacity>

            {/* Botón 3 */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between"
              onPress={() => navigation.navigate("Skins")}
            >
              <Text className="text-white text-lg font-semibold">
                Cambiar skin
              </Text>
              <SendIcon />
            </TouchableOpacity>

          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}