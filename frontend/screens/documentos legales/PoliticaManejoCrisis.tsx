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

export default function PoliticaManejoCrisis({ navigation }: any) {
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
              POLITICA DE MANEJO DE CRISIS EMOCIONALES
            </Text>

            <Text className="mt-2 text-xl font-bold text-white">
              1. Propósito del protocolo de crisis
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación IA MIND incluye mecanismos automatizados diseñados para identificar
              señales lingüísticas asociadas con posibles crisis emocionales dentro de las
              conversaciones mantenidas por los usuarios con el sistema. El objetivo de este
              protocolo es:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• priorizar la seguridad del usuario</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • proporcionar mensajes de contención emocional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • orientar al usuario hacia recursos de apoyo humano
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • alertar a profesionales involucrados cuando corresponda
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación no sustituye la atención psicológica ni psiquiátrica profesional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              2. Naturaleza del sistema de detección
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La detección de posibles crisis emocionales se realiza mediante una combinación de:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              1. modelos de análisis emocional basados en aprendizaje automático
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              2. patrones lingüísticos previamente validados por profesionales de la salud mental
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              3. reglas de evaluación de riesgo diseñadas para reducir falsos positivos y falsos
              negativos
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Este sistema analiza los mensajes proporcionados por el usuario para identificar
              posibles indicadores de riesgo emocional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              3. Tecnologías utilizadas para el análisis emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El sistema utiliza modelos de inteligencia artificial especializados en análisis de
              emociones en lenguaje natural. Estos modelos permiten identificar emociones dominantes
              dentro del contenido textual, tales como:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• tristeza</Text>
            <Text className="mt-1 text-white/90 leading-6">• miedo</Text>
            <Text className="mt-1 text-white/90 leading-6">• enojo</Text>
            <Text className="mt-1 text-white/90 leading-6">• alegría</Text>
            <Text className="mt-1 text-white/90 leading-6">• sorpresa</Text>
            <Text className="mt-1 text-white/90 leading-6">• asco</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los resultados del análisis se combinan con reglas adicionales para evaluar el nivel
              potencial de riesgo emocional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              4. Evaluación automatizada del riesgo emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El sistema puede clasificar el riesgo emocional detectado en tres niveles:
            </Text>
            <Text className="mt-2 text-lg font-semibold text-white">Riesgo bajo</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Puede indicar señales leves de malestar emocional. En este caso:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• se registra el evento en el sistema</Text>
            <Text className="mt-1 text-white/90 leading-6">• se puede generar una alerta informativa</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • la conversación con el sistema continúa normalmente
            </Text>

            <Text className="mt-2 text-lg font-semibold text-white">Riesgo medio</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Puede indicar un nivel moderado de malestar emocional. En este caso:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• se registra un evento de alerta</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • se envía una notificación informativa al psicólogo asignado al usuario (cuando
              exista)
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • la conversación puede continuar normalmente
            </Text>

            <Text className="mt-2 text-lg font-semibold text-white">Riesgo alto</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Puede indicar señales asociadas con una posible crisis emocional significativa. En
              estos casos el sistema puede:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• registrar un evento crítico</Text>
            <Text className="mt-1 text-white/90 leading-6">• activar el modo de crisis</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • suspender temporalmente la interacción conversacional generada por inteligencia
              artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • mostrar mensajes de contención emocional previamente validados por profesionales
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • presentar recursos de apoyo y contactos de emergencia
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              5. Mensajes de contención emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Cuando el sistema detecta un nivel de riesgo alto, la aplicación puede mostrar mensajes
              diseñados específicamente para brindar contención emocional. Estas respuestas:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • han sido previamente revisadas por profesionales de salud mental
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • buscan validar las emociones del usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • promueven la búsqueda de apoyo humano
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El objetivo es ofrecer un mensaje seguro mientras se orienta al usuario hacia ayuda
              externa.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              6. Recursos de apoyo mostrados al usuario
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Cuando se detecta una posible crisis emocional, la aplicación puede mostrar recursos
              de apoyo, tales como:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • contactos personales de apoyo registrados por el usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• números de emergencia</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • servicios nacionales de atención en crisis
            </Text>
            <Text className="mt-2 text-white/90 leading-6">Entre ellos puede incluirse:</Text>
            <Text className="mt-1 text-white/90 leading-6">Línea de la Vida (México)</Text>
            <Text className="mt-1 text-white/90 leading-6">Teléfono: 800 911 2000</Text>
            <Text className="mt-2 text-white/90 leading-6">
              También puede mostrarse el número de emergencias: 911
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Estos recursos tienen como objetivo facilitar el acceso inmediato a apoyo humano.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              7. Notificación a profesionales de salud mental
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Cuando se detecta un evento de riesgo emocional, el sistema puede enviar una
              notificación automática por correo electrónico al psicólogo asignado al usuario, cuando
              dicha información haya sido proporcionada. Estas notificaciones tienen como propósito
              informar al profesional sobre posibles eventos relevantes ocurridos durante el uso del
              sistema. El contenido exacto de dichas notificaciones puede variar dependiendo de la
              configuración del sistema.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">8. Limitaciones del sistema</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El sistema de detección de crisis emocional es un mecanismo automatizado basado en
              análisis de lenguaje y reglas predefinidas. Por lo tanto:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • puede no detectar todas las situaciones de riesgo
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • puede generar alertas cuando no exista una crisis real
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • no sustituye la evaluación clínica de un profesional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios no deben depender exclusivamente de la aplicación en situaciones de
              emergencia emocional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">9. Responsabilidad del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario reconoce que:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • IA MIND es una herramienta de apoyo emocional basada en inteligencia artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • no constituye un servicio médico ni psicológico profesional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • no debe utilizarse como único recurso en situaciones de crisis
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              En caso de emergencia, el usuario debe buscar ayuda inmediata de profesionales de la
              salud o servicios de emergencia.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">10. Uso responsable de la herramienta</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación está diseñada como una herramienta complementaria que puede utilizarse
              dentro de procesos terapéuticos o de apoyo emocional. El uso de la aplicación no
              reemplaza:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• terapia psicológica</Text>
            <Text className="mt-1 text-white/90 leading-6">• tratamiento psiquiátrico</Text>
            <Text className="mt-1 text-white/90 leading-6">• atención médica especializada</Text>

            <Text className="mt-4 text-xl font-bold text-white">11. Actualizaciones del protocolo</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El protocolo de detección de crisis emocional puede ser actualizado periódicamente con
              el objetivo de mejorar la seguridad y la eficacia del sistema. Las actualizaciones
              pueden incluir:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• mejoras en los modelos de análisis emocional</Text>
            <Text className="mt-1 text-white/90 leading-6">• ajustes en las reglas de detección</Text>
            <Text className="mt-1 text-white/90 leading-6">• incorporación de nuevos recursos de apoyo</Text>

            <Text className="mt-4 text-xl font-bold text-white">12. Aceptación del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Al utilizar la aplicación IA MIND, el usuario reconoce y acepta el funcionamiento del
              sistema de detección de crisis emocional descrito en este documento.
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}