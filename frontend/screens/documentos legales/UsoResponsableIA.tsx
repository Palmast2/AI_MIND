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

export default function UsoResponsableIA({ navigation }: any) {
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
              USO RESPONSABLE DE LA IA
            </Text>

            <Text className="mt-2 text-xl font-bold text-white">
              1. Naturaleza del sistema de inteligencia artificial
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación IA MIND utiliza sistemas automatizados de inteligencia artificial para
              generar respuestas conversacionales y proporcionar herramientas de apoyo emocional.
              Estas respuestas se generan mediante modelos computacionales de procesamiento de
              lenguaje natural que analizan el contenido de los mensajes enviados por el usuario. El
              sistema está diseñado para proporcionar acompañamiento emocional automatizado, pero no
              constituye una forma de inteligencia humana ni una entidad consciente.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">2. Finalidad del sistema</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El sistema de inteligencia artificial de IA MIND tiene como finalidad:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• ofrecer un espacio de conversación automatizado</Text>
            <Text className="mt-1 text-white/90 leading-6">• ayudar al usuario a reflexionar sobre sus emociones</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • detectar posibles patrones emocionales dentro del lenguaje del usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • proporcionar herramientas de apoyo emocional complementarias
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación está diseñada como una herramienta tecnológica de apoyo, no como un
              servicio clínico.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              3. No constituye atención médica ni psicológica
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El sistema de inteligencia artificial utilizado en IA MIND no proporciona diagnósticos
              médicos, psicológicos ni psiquiátricos. Las respuestas generadas por el sistema:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• no constituyen evaluación clínica</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituyen terapia psicológica</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituyen tratamiento médico</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituyen atención psiquiátrica</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios deben acudir a profesionales de la salud mental calificados para recibir
              diagnóstico o tratamiento.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              4. Posibilidad de errores o imprecisiones
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Debido a la naturaleza probabilística de los sistemas de inteligencia artificial, las
              respuestas generadas por la aplicación pueden contener:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• errores</Text>
            <Text className="mt-1 text-white/90 leading-6">• interpretaciones incorrectas</Text>
            <Text className="mt-1 text-white/90 leading-6">• respuestas incompletas</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • sugerencias no adecuadas para determinadas situaciones
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La empresa responsable del servicio no garantiza que todas las respuestas generadas por
              el sistema sean correctas o apropiadas en todos los casos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              5. Interpretación del contenido generado
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios son responsables de evaluar críticamente cualquier información
              proporcionada por el sistema. Las respuestas generadas por la inteligencia artificial
              deben interpretarse como:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• sugerencias generales</Text>
            <Text className="mt-1 text-white/90 leading-6">• reflexiones automatizadas</Text>
            <Text className="mt-1 text-white/90 leading-6">• apoyo conversacional</Text>
            <Text className="mt-2 text-white/90 leading-6">
              No deben considerarse como recomendaciones profesionales definitivas.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              6. Dependencia del contexto conversacional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Las respuestas del sistema dependen del contenido proporcionado por el usuario durante
              la conversación. Por lo tanto:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• la calidad de las respuestas puede variar</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • el sistema puede interpretar incorrectamente el contexto
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • el sistema puede carecer de información relevante para comprender completamente la
              situación del usuario
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              7. Limitaciones en la comprensión emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Aunque el sistema puede analizar patrones lingüísticos asociados con emociones, la
              inteligencia artificial no experimenta emociones ni comprende las experiencias humanas
              de la misma manera que un profesional de salud mental. El análisis emocional realizado
              por la aplicación se basa únicamente en:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• patrones lingüísticos</Text>
            <Text className="mt-1 text-white/90 leading-6">• modelos estadísticos</Text>
            <Text className="mt-1 text-white/90 leading-6">• probabilidades derivadas del lenguaje</Text>

            <Text className="mt-4 text-xl font-bold text-white">
              8. Detección automatizada de crisis
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación incluye mecanismos automatizados para detectar posibles indicadores de
              crisis emocional. Sin embargo, dichos mecanismos pueden:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• no detectar todas las situaciones de riesgo</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • generar alertas cuando no exista una crisis real
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • interpretar incorrectamente ciertos mensajes
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Por esta razón, el sistema no debe utilizarse como único medio de detección o
              prevención de crisis emocionales.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">9. Uso responsable del sistema</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario acepta utilizar la aplicación de manera responsable y reconoce que:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • el sistema es una herramienta tecnológica de apoyo
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• el sistema tiene limitaciones inherentes</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • el sistema no reemplaza la interacción humana profesional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El uso de la aplicación no debe sustituir la búsqueda de apoyo profesional cuando sea
              necesario.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">10. Situaciones de emergencia</Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND no está diseñado para atender emergencias médicas o psicológicas inmediatas. En
              caso de emergencia, el usuario debe contactar de inmediato con:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• servicios de emergencia</Text>
            <Text className="mt-1 text-white/90 leading-6">• líneas de ayuda especializadas</Text>
            <Text className="mt-1 text-white/90 leading-6">• profesionales de la salud mental</Text>

            <Text className="mt-4 text-xl font-bold text-white">
              11. Uso de servicios de inteligencia artificial de terceros
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para proporcionar ciertas funcionalidades, la aplicación puede utilizar servicios
              tecnológicos externos especializados en inteligencia artificial. Estos servicios pueden
              participar en:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • generación de respuestas conversacionales
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • procesamiento de lenguaje natural
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• síntesis de voz</Text>
            <Text className="mt-1 text-white/90 leading-6">• transcripción de audio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La disponibilidad y funcionamiento de dichos servicios puede cambiar con el tiempo.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">12. Actualización del sistema</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los modelos de inteligencia artificial utilizados en IA MIND pueden ser actualizados
              periódicamente para mejorar su funcionamiento. Estas actualizaciones pueden modificar:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • la forma en que se generan respuestas
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • los sistemas de análisis emocional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • los mecanismos de detección de riesgo
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              13. Ausencia de garantías de resultados
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND no garantiza que el uso de la aplicación produzca resultados específicos
              relacionados con:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• bienestar emocional</Text>
            <Text className="mt-1 text-white/90 leading-6">• mejora psicológica</Text>
            <Text className="mt-1 text-white/90 leading-6">• reducción de síntomas emocionales</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La experiencia del usuario puede variar significativamente.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">14. Aceptación del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Al utilizar la aplicación IA MIND, el usuario reconoce y acepta las limitaciones del
              sistema de inteligencia artificial descritas en el presente documento.
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}