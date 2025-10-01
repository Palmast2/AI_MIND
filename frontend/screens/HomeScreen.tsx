import React, { useMemo, useRef, useState, useLayoutEffect } from 'react';
import {
  View,
  Image,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  findNodeHandle,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RadarChart } from 'react-native-gifted-charts';

import { SKINS, STORAGE_KEY } from './skins';

export default function HomeScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState('');

  const [skinKey, setSkinKey] = useState<string>('default');
  const [remoteUri, setRemoteUri] = useState<string | null>(null);

  const scrollRef = useRef<any>(null);
  const inputRef = useRef<any>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View className='flex flex-row'>
          <TouchableOpacity
            onPress={() => navigation.navigate('Skins')}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Skins</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('Informe')}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Informe</Text>
          </TouchableOpacity>
        </View>
      ),
      headerStyle: { backgroundColor: '#00634C' },
      headerTitleStyle: { color: '#fff' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      (async () => {
        try {
          const saved = await AsyncStorage.getItem(STORAGE_KEY);
          if (!isActive) return;
          if (!saved) {
            setSkinKey('default');
            setRemoteUri(null);
            return;
          }
          if (/^https?:\/\//i.test(saved) || /^file:\/\//i.test(saved)) {
            setRemoteUri(saved);
            setSkinKey('default');
          } else if ((SKINS as any)[saved]) {
            setSkinKey(saved);
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
        isActive = false;
      };
    }, [])
  );

  const imageSource = useMemo(() => {
    if (remoteUri) return { uri: remoteUri };
    return SKINS[skinKey] ?? SKINS.default;
  }, [skinKey, remoteUri]);

  const handleFocus = () => {
    setIsFocused(true);
    requestAnimationFrame(() => {
      const node = findNodeHandle(inputRef.current);
      scrollRef.current?.scrollToFocusedInput?.(node);
    });
  };

  const handleBlur = () => setIsFocused(false);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    Keyboard.dismiss();
    navigation.navigate('Chat', { initialMessage: msg });
    setText('');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#00634C' }}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 16,
            paddingHorizontal: 16,
            // 👇 cuando está enfocado, NO agregues padding inferior grande
            paddingBottom: isFocused ? 8 : insets.bottom + 16,
          }}
          enableOnAndroid
          // 👇 evita el doble desplazamiento (usamos scrollToFocusedInput manual)
          enableAutomaticScroll={false}
          enableResetScrollToCoords={false}
          keyboardOpeningTime={0}
          keyboardShouldPersistTaps="handled"
          // 👇 reduce mucho estos valores (evita “hoyo” al fondo)
          extraScrollHeight={12}
          extraHeight={0}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'none'}>
          <View style={{ width: 25, height: 25, alignSelf: 'center', transform: [{ scale: 0.5 }] }}>
            <RadarChart
              data={[8, 3, 5, 1]}
              labels={['Tristeza', 'Alegria', 'Tranquilidad', 'Crisis']}
              labelConfig={{ stroke: 'white', fontWeight: 'bold', fontSize: 10 }}
              dataLabels={['8', '3', '5', '1']}
              maxValue={10}
              noOfSections={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            {/* Imagen */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Image
                source={imageSource}
                style={{ width: 300, height: 300 }}
                resizeMode="contain"
              />
            </View>

            {/* Input burbuja */}
            <View
              style={{
                alignSelf: 'stretch',
                width: '100%',
                backgroundColor: 'white',
                borderRadius: 24,
                paddingHorizontal: 16,
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                // 👇 separa del borde inferior sin exagerar
                marginBottom: 8,
              }}>
              <TextInput
                ref={inputRef}
                placeholder="¿Cómo ha estado tu día?"
                placeholderTextColor="#00634C"
                style={{
                  color: '#00634C',
                  fontSize: 16,
                  minHeight: 40,
                  maxHeight: 140,
                  textAlignVertical: 'top',
                }}
                value={text}
                onChangeText={setText}
                multiline
                // 👇 evita cambiar dinámicamente las líneas (causa re-layouts grandes)
                numberOfLines={1}
                scrollEnabled
                returnKeyType="send"
                blurOnSubmit={true}
                onSubmitEditing={handleSend}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Enter') {
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
