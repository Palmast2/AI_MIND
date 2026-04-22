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
import { UserIcon } from "icons/UserIcons/User";
import { CreateUserIcon } from "icons/UserIcons/CreateUser";
import { HealthUser } from "icons/UserIcons/HealthUser";

export default function MenuContactoEmergencia({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6 pt-6">

            {/* Dar Alta Psicologo */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
              onPress={() => navigation.navigate("OptionsInfoPsicologo")}
            >
              <View className="flex-row">
              <HealthUser/>
              <Text className="text-white pl-2 text-lg font-semibold">
                Añadir Psicologo
              </Text>
              </View>
              <SendIcon />
            </TouchableOpacity>

            {/* Crear Contactos */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
              onPress={() => navigation.navigate("OptionsInfoContacto")}
            >
              <View className="flex-row">
              <CreateUserIcon/>
              <Text className="text-white pl-2 text-lg font-semibold">
                Crear Contacto
              </Text>
              </View>
              <SendIcon />
            </TouchableOpacity>

            {/* Lista de Contactos */}
            <TouchableOpacity
              className="w-full border border-white rounded-xl px-4 py-4 flex-row items-center justify-between mb-4"
              onPress={() => navigation.navigate("OptionsListaContacto")}
            >
              <View className="flex-row">
              <UserIcon/>
              <Text className="text-white pl-2 text-lg font-semibold">
                Lista de Contacto
              </Text>
              </View>
              <SendIcon />
            </TouchableOpacity>

          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}