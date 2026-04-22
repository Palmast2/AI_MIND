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

export default function AvisoPrivacidad({ navigation }: any) {
  return (
    <SafeAreaView className="flex-1 bg-emerald-900">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View className="flex-1 px-6 pt-6">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="text-sm font-bold text-white underline">&lt; Volver</Text>
            </TouchableOpacity>

            <Text className="mb-4 mt-4 text-2xl font-extrabold text-white">
              AVISO DE PRIVACIDAD
            </Text>

            <Text className="mt-2 text-xl font-bold text-white">
              1. Identidad y domicilio del responsable
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              De conformidad con lo dispuesto por la legislación mexicana en materia de protección de
              datos personales, se informa que el responsable del tratamiento de los datos personales
              recabados a través de la aplicación IA MIND es:
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V.{"\n"}
              (RFC: SVI030115QD6){"\n"}
              con domicilio en:{"\n"}
              Montecito No. 38{"\n"}
              Piso 28 Oficina 16{"\n"}
              Col. Nápoles{"\n"}
              Delegación Benito Juárez{"\n"}
              Ciudad de México{"\n"}
              C.P. 03810{"\n"}
              México{"\n"}
              Correo de contacto:{"\n"}
              info@svis.com.mx
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              2. Datos personales recopilados
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación IA MIND puede recopilar los siguientes datos personales del usuario:
            </Text>
            <Text className="mt-2 text-lg font-semibold text-white">Datos de identificación</Text>
            <Text className="mt-1 text-white/90 leading-6">• correo electrónico del usuario</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • identificador de usuario dentro de la aplicación
            </Text>
            <Text className="mt-3 text-lg font-semibold text-white">
              Datos demográficos (cuando el usuario otorgue consentimiento)
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• año de nacimiento</Text>
            <Text className="mt-1 text-white/90 leading-6">• género</Text>
            <Text className="mt-1 text-white/90 leading-6">• sexo</Text>
            <Text className="mt-1 text-white/90 leading-6">• nivel educativo</Text>
            <Text className="mt-1 text-white/90 leading-6">• ocupación</Text>
            <Text className="mt-1 text-white/90 leading-6">• estado civil</Text>
            <Text className="mt-1 text-white/90 leading-6">• situación laboral</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • entidad federativa de residencia
            </Text>
            <Text className="mt-3 text-lg font-semibold text-white">
              Datos de contacto de terceros proporcionados por el usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • contactos personales de apoyo emocional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • correo electrónico de psicólogo o profesional de salud mental
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario es responsable de contar con autorización para proporcionar datos de
              terceros.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">3. Datos personales sensibles</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Durante el uso de la aplicación, pueden generarse o procesarse datos relacionados con
              el estado emocional del usuario. Esto puede incluir:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• contenido de conversaciones</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • emociones detectadas automáticamente
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • indicadores de posibles eventos críticos
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • estadísticas emocionales derivadas del uso del sistema
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Estos datos pueden considerarse información sensible relacionada con el bienestar
              emocional del usuario. IA MIND implementa medidas razonables para proteger esta
              información.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              4. Información generada por el uso del servicio
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación puede generar o almacenar información relacionada con el uso del
              sistema, incluyendo:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • historial de conversaciones recientes
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • eventos emocionales detectados
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • estadísticas de emociones identificadas
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • reportes informáticos generados en formato PDF
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• métricas de uso del servicio</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • tipo de dispositivo utilizado para acceder a la aplicación
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              5. Finalidades del tratamiento de datos
            </Text>
            <Text className="mt-2 text-lg font-semibold text-white">Finalidades primarias</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • permitir el funcionamiento de la aplicación
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • proporcionar interacción conversacional con inteligencia artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • analizar emociones expresadas en los mensajes del usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • generar reportes emocionales automatizados
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • detectar posibles eventos críticos o crisis emocionales
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • permitir al usuario acceder a recursos de apoyo emocional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • enviar notificaciones relacionadas con eventos críticos cuando corresponda
            </Text>
            <Text className="mt-3 text-lg font-semibold text-white">Finalidades secundarias</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • mejorar el funcionamiento de los sistemas de inteligencia artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • realizar análisis estadísticos sobre el uso del servicio
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• mejorar la experiencia del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario puede oponerse al tratamiento de datos para finalidades secundarias mediante
              solicitud al correo de contacto.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              6. Tecnologías utilizadas en la aplicación
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación utiliza tecnologías de sesión necesarias para el funcionamiento del
              sistema. Estas incluyen:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• identificadores de sesión</Text>
            <Text className="mt-1 text-white/90 leading-6">• tokens de autenticación</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación no utiliza cookies publicitarias ni herramientas de seguimiento para
              fines comerciales o de marketing.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              7. Uso de servicios tecnológicos de terceros
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para proporcionar ciertas funcionalidades, IA MIND puede utilizar servicios
              tecnológicos externos. Esto incluye el uso de tecnologías de inteligencia artificial
              proporcionadas por terceros, como:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • servicios de procesamiento de lenguaje natural
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• sistemas de generación de texto</Text>
            <Text className="mt-1 text-white/90 leading-6">• sistemas de síntesis de voz</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Durante este proceso, el contenido de las conversaciones puede enviarse a estos
              servicios para generar respuestas automatizadas. Cuando sea posible, se aplicarán
              configuraciones diseñadas para evitar el uso de estos datos en el entrenamiento de
              modelos externos. Sin embargo, las configuraciones de los proveedores tecnológicos
              pueden cambiar con el tiempo.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              8. Transferencia internacional de datos
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los datos procesados por la aplicación pueden almacenarse en infraestructura
              tecnológica ubicada fuera de México. Actualmente, los servidores utilizados para el
              funcionamiento del sistema se encuentran en infraestructura de computación en la nube
              operada por proveedores tecnológicos internacionales. Esto puede implicar el
              almacenamiento de información en servidores ubicados en Estados Unidos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">9. Seguridad de la información</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V. implementa medidas técnicas y
              organizativas razonables para proteger la información personal de los usuarios. Estas
              medidas pueden incluir:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• controles de acceso</Text>
            <Text className="mt-1 text-white/90 leading-6">• mecanismos de autenticación</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • infraestructura segura en la nube
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• monitoreo de sistemas</Text>
            <Text className="mt-2 text-white/90 leading-6">
              No obstante, ningún sistema tecnológico puede garantizar seguridad absoluta.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">10. Derechos ARCO</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios tienen derecho a ejercer los siguientes derechos respecto a sus datos
              personales:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• Acceso</Text>
            <Text className="mt-1 text-white/90 leading-6">• Rectificación</Text>
            <Text className="mt-1 text-white/90 leading-6">• Cancelación</Text>
            <Text className="mt-1 text-white/90 leading-6">• Oposición</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para ejercer estos derechos, el usuario deberá enviar una solicitud al correo:
              info@svis.com.mx
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">11. Eliminación de datos</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios pueden solicitar la eliminación de su información personal enviando una
              solicitud al correo de contacto. Las solicitudes serán evaluadas por el equipo técnico
              responsable del servicio. En algunos casos, ciertos datos podrán conservarse
              temporalmente para cumplir obligaciones legales o de seguridad.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">12. Conservación de la información</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los datos personales se conservarán durante el tiempo necesario para:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• proporcionar el servicio</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • mantener el contexto de las interacciones
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • cumplir con obligaciones legales aplicables
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Posteriormente, los datos podrán ser eliminados o anonimizados.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              13. Modificaciones al aviso de privacidad
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V. se reserva el derecho de
              modificar el presente aviso de privacidad cuando sea necesario para cumplir con cambios
              legales o mejoras en el servicio. Las modificaciones podrán publicarse dentro de la
              aplicación o en los canales oficiales del servicio.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">14. Consentimiento del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Al utilizar la aplicación IA MIND, el usuario reconoce haber leído y aceptado el
              presente Aviso de Privacidad.
            </Text>

            <Text className="mt-8 text-sm text-white/80">Para su mayor información:</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("UsoResponsableIA")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="mt-2 text-sm font-bold text-white underline">
                Uso responsable de la IA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("CondicionesGeneralesUso")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="mt-2 text-sm font-bold text-white underline">
                Condiciones generales de uso
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("PoliticaManejoCrisis")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="mt-2 text-sm font-bold text-white underline">
                Política de manejo de crisis emocionales
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("TerminosCondicionesServicio")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text className="mt-2 text-sm font-bold text-white underline">
                Términos y Condiciones del Servicio
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}