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

export default function CondicionesGeneralesUso({ navigation }: any) {
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
              CONDICIONES GENERALES DE USO
            </Text>

            <Text className="mt-2 text-xl font-bold text-white">
              1. Objeto de las condiciones de uso
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Las presentes Condiciones Generales de Uso establecen las reglas que deben seguir los
              usuarios al utilizar la aplicación IA MIND. Estas condiciones complementan los
              Términos y Condiciones del Servicio y regulan el uso adecuado de las funcionalidades
              disponibles dentro de la aplicación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">2. Acceso al servicio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El acceso a la aplicación requiere:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• registro mediante correo electrónico</Text>
            <Text className="mt-1 text-white/90 leading-6">• aceptación de los términos y condiciones</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • cumplimiento de los requisitos de edad establecidos.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El acceso al servicio puede depender de la autorización de una institución, clínica o
              profesional de salud mental que haya contratado el servicio con Santillan Valencia
              Integration Systems S.A. de C.V.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">3. Seguridad de la cuenta</Text>
            <Text className="mt-2 text-white/90 leading-6">El usuario es responsable de:</Text>
            <Text className="mt-1 text-white/90 leading-6">• proteger su información de acceso</Text>
            <Text className="mt-1 text-white/90 leading-6">• no compartir sus credenciales con terceros</Text>
            <Text className="mt-1 text-white/90 leading-6">• informar cualquier acceso no autorizado.</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El uso de la cuenta se considera responsabilidad exclusiva del usuario registrado.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              4. Uso del sistema de conversación
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación permite la interacción con un sistema automatizado mediante:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• mensajes de texto</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • mensajes de voz convertidos a texto mediante transcripción automática.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los audios enviados por el usuario no se almacenan, siendo utilizados únicamente para
              su transcripción dentro de la conversación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              5. Uso del sistema de detección emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND analiza el contenido de los mensajes enviados por el usuario con el objetivo
              de detectar posibles emociones expresadas en el texto. El sistema puede identificar
              emociones como parte de un análisis automatizado para:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• apoyar la interacción conversacional</Text>
            <Text className="mt-1 text-white/90 leading-6">• generar estadísticas emocionales</Text>
            <Text className="mt-1 text-white/90 leading-6">• identificar posibles eventos críticos.</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario reconoce que estos análisis son estimaciones automatizadas y no diagnósticos
              clínicos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">6. Uso del avatar emocional</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación incluye un avatar visual representado mediante arte pixelado que actúa
              como acompañante emocional durante la interacción. Este avatar:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• no posee inteligencia propia</Text>
            <Text className="mt-1 text-white/90 leading-6">• no toma decisiones</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • no reemplaza la conversación generada por la inteligencia artificial.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El avatar únicamente muestra expresiones visuales sugeridas según el estado emocional
              detectado en la conversación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">7. Uso de reportes emocionales</Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND puede generar reportes informáticos en formato PDF que incluyen:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • historial de conversación relevante
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• eventos emocionales detectados</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • estadísticas sobre emociones identificadas
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • posibles eventos críticos detectados.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario puede descargar dichos reportes para su consulta personal. Estos reportes
              tienen fines informativos y no constituyen evaluación psicológica profesional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">8. Contactos de apoyo</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación permite al usuario registrar contactos personales de apoyo emocional.
              Estos contactos podrán mostrarse al usuario cuando el sistema detecte posibles
              situaciones de crisis emocional. El usuario es responsable de:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• proporcionar información correcta</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • contar con autorización para registrar dichos contactos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              9. Interacción con profesionales de salud mental
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Cuando el usuario proporcione voluntariamente el correo electrónico de su psicólogo o
              terapeuta, la aplicación podrá generar notificaciones relacionadas con eventos
              emocionales relevantes detectados durante el uso del servicio. El usuario declara
              contar con el consentimiento del profesional correspondiente para registrar su
              información dentro de la aplicación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">10. Conducta del usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los usuarios deben utilizar la aplicación de manera responsable y respetuosa. Está
              prohibido utilizar el servicio para:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• acosar o intimidar a otras personas</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • enviar contenido ofensivo o discriminatorio
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• promover actividades ilegales</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • manipular o intentar vulnerar el sistema.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">11. Uso indebido del servicio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Se considerará uso indebido del servicio cuando el usuario:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • intente manipular los sistemas de inteligencia artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • utilice la aplicación para fines distintos a los previstos
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • intente acceder a información de otros usuarios.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              En estos casos, el proveedor del servicio podrá suspender el acceso a la aplicación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">12. Disponibilidad del servicio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V. procurará mantener el servicio
              disponible de forma continua. No obstante, la aplicación puede experimentar
              interrupciones temporales debido a:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• mantenimiento técnico</Text>
            <Text className="mt-1 text-white/90 leading-6">• actualizaciones del sistema</Text>
            <Text className="mt-1 text-white/90 leading-6">• fallas en proveedores tecnológicos</Text>
            <Text className="mt-1 text-white/90 leading-6">• problemas de conectividad.</Text>

            <Text className="mt-4 text-xl font-bold text-white">13. Actualizaciones de la aplicación</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación puede recibir actualizaciones periódicas que modifiquen:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• funcionalidades</Text>
            <Text className="mt-1 text-white/90 leading-6">• interfaz</Text>
            <Text className="mt-1 text-white/90 leading-6">• sistemas de inteligencia artificial</Text>
            <Text className="mt-1 text-white/90 leading-6">• características del servicio.</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Estas actualizaciones pueden ser necesarias para mejorar la seguridad y funcionamiento
              del sistema.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              14. Conservación del historial de conversaciones
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para garantizar el funcionamiento del sistema y mantener el contexto de la interacción,
              la aplicación puede conservar:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• el historial de conversaciones recientes</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • eventos emocionales detectados
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • estadísticas relacionadas con el uso del sistema.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Actualmente, la aplicación no ofrece una función para eliminar el historial de
              conversaciones desde la interfaz del usuario.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">15. Protección del sistema</Text>
            <Text className="mt-2 text-white/90 leading-6">Los usuarios no deberán:</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • intentar acceder al código fuente del software
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• realizar ingeniería inversa</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • interferir con la infraestructura tecnológica
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • utilizar herramientas automatizadas para manipular el sistema.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              16. Suspensión o cancelación del acceso
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El proveedor del servicio podrá suspender o cancelar el acceso al sistema cuando:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• se detecte uso indebido</Text>
            <Text className="mt-1 text-white/90 leading-6">• se violen las presentes condiciones de uso</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • exista riesgo para la seguridad del sistema.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">17. Cambios en las condiciones de uso</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V. se reserva el derecho de modificar
              estas condiciones cuando sea necesario. Las modificaciones podrán publicarse dentro de
              la aplicación o en los canales oficiales del servicio.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">18. Contacto</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para cualquier consulta relacionada con el uso de la aplicación, los usuarios pueden
              comunicarse a: info@svis.com.mx
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}