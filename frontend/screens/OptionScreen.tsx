import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SendIcon } from 'icons/Enviar'; // ajusta la ruta si es necesario
import { UserIcon } from 'icons/UserIcons/User';
import { HealthUser } from 'icons/UserIcons/HealthUser';
import { PincelIcon } from 'icons/Pincel';

export default function OptionsScreen({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 px-6 pt-6">
            {/* Botón 1 */}
            <TouchableOpacity
              className="mb-4 w-full flex-row items-center justify-between rounded-xl border border-white px-4 py-4"
              onPress={() => navigation.navigate('OptionsInfoPersonal')}>
              <View className="flex-row">
                <UserIcon />
                <Text className="pl-2 text-lg font-semibold text-white">Informacion Personal</Text>
              </View>
              <SendIcon />
            </TouchableOpacity>

            {/* Botón 2 */}
            <TouchableOpacity
              className="mb-4 w-full flex-row items-center justify-between rounded-xl border border-white px-4 py-4"
              onPress={() => navigation.navigate('OptionsMenuContactoEmergencia')}>
              <View className="flex-row">
                <HealthUser />
                <Text className="pl-2 text-lg font-semibold text-white">
                  Contactos de emergencia
                </Text>
              </View>
              <SendIcon />
            </TouchableOpacity>

            {/* Botón 3 */}
            <TouchableOpacity
              className="w-full flex-row items-center justify-between rounded-xl border border-white px-4 py-4"
              onPress={() => navigation.navigate('Skins')}>
              <View className="flex-row">
                <PincelIcon />
                <Text className="pl-2 text-lg font-semibold text-white">Cambiar skin</Text>
              </View>
              <SendIcon />
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}
