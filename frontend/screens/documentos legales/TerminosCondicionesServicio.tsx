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

export default function TerminosCondicionesServicio({ navigation }: any) {
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
              TERMINOS Y CONDICIONES DEL SERVICIO
            </Text>

            <Text className="mt-2 text-xl font-bold text-white">1. Introducción</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los presentes Términos y Condiciones regulan el acceso y uso de la aplicación IA MIND,
              desarrollada y operada por Santillan Valencia Integration Systems S.A. de C.V., también
              conocida como SVIS Integration Systems, con RFC SVI030115QD6, con domicilio en:
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Montecito No. 38{"\n"}
              Piso 28 Oficina 16{"\n"}
              Col. Nápoles{"\n"}
              Delegación Benito Juárez{"\n"}
              Ciudad de México{"\n"}
              C.P. 03810
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Al utilizar la aplicación IA MIND, el usuario acepta quedar obligado por los presentes
              términos. Si el usuario no está de acuerdo con estos términos, deberá abstenerse de
              utilizar la aplicación.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">2. Definiciones</Text>
            <Text className="mt-2 text-white/90 leading-6">Para efectos de estos términos:</Text>
            <Text className="mt-1 text-white/90 leading-6">Aplicación</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Se refiere al software IA MIND disponible en plataformas móviles.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">Usuario</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Persona que utiliza la aplicación con fines de apoyo emocional.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">Proveedor del servicio</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Santillan Valencia Integration Systems S.A. de C.V.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">Profesional de salud mental</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Psicólogo o terapeuta que el usuario haya asociado voluntariamente a su cuenta.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">Sistema de inteligencia artificial</Text>
            <Text className="mt-1 text-white/90 leading-6">
              Tecnología automatizada utilizada para generar respuestas, analizar emociones y apoyar
              la interacción con el usuario.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">3. Naturaleza del servicio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND es una plataforma digital que utiliza inteligencia artificial para proporcionar
              herramientas de apoyo emocional mediante:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• conversación automatizada por texto</Text>
            <Text className="mt-1 text-white/90 leading-6">• interacción mediante audio</Text>
            <Text className="mt-1 text-white/90 leading-6">• detección automatizada de emociones</Text>
            <Text className="mt-1 text-white/90 leading-6">• generación de reportes emocionales</Text>
            <Text className="mt-1 text-white/90 leading-6">• acceso a recursos de apoyo emocional</Text>
            <Text className="mt-1 text-white/90 leading-6">• acompañamiento mediante avatar digital</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación tiene fines informativos y de acompañamiento emocional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">4. Descargo médico</Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND no es un servicio médico ni psicológico. La aplicación:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• no realiza diagnósticos clínicos</Text>
            <Text className="mt-1 text-white/90 leading-6">• no prescribe tratamientos</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituye terapia psicológica</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituye atención psiquiátrica</Text>
            <Text className="mt-1 text-white/90 leading-6">• no sustituye atención médica profesional</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Las respuestas generadas por la inteligencia artificial no deben interpretarse como
              consejo médico o psicológico profesional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              5. Limitaciones del sistema de inteligencia artificial
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Las respuestas proporcionadas por la aplicación son generadas mediante sistemas
              automatizados de inteligencia artificial. Estos sistemas pueden:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• generar información incorrecta</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • interpretar de forma errónea el contenido del usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • no comprender completamente el contexto emocional
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• producir respuestas incompletas</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario reconoce que las respuestas del sistema no sustituyen el criterio humano ni
              el asesoramiento profesional.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">
              6. Manejo de situaciones de crisis emocional
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              IA MIND puede detectar indicadores de posibles crisis emocionales durante la
              interacción. Cuando el sistema detecta un posible evento crítico:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • la conversación con inteligencia artificial puede suspenderse
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • el sistema mostrará mensajes de apoyo predefinidos
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• se ofrecerán recursos de ayuda</Text>
            <Text className="mt-2 text-white/90 leading-6">Estos recursos pueden incluir:</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • contactos de apoyo previamente definidos por el usuario
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • acceso a recursos de asistencia emocional como la Línea de la Vida
            </Text>
            <Text className="mt-2 text-white/90 leading-6">El usuario podrá decidir si desea:</Text>
            <Text className="mt-1 text-white/90 leading-6">• detener la interacción</Text>
            <Text className="mt-1 text-white/90 leading-6">• contactar ayuda externa</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • continuar la conversación bajo su propia responsabilidad.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">7. Requisitos de edad</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación está destinada a usuarios de 13 años o más. Los usuarios menores de edad
              deberán contar con:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • autorización de su psicólogo tratante
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • supervisión profesional cuando corresponda.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              Las instituciones o profesionales que proporcionen acceso a la aplicación son
              responsables de validar estos requisitos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">8. Registro de usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para utilizar la aplicación es necesario crear una cuenta mediante el registro de:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• correo electrónico</Text>
            <Text className="mt-1 text-white/90 leading-6">• información básica de usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario es responsable de mantener la confidencialidad de su cuenta y credenciales.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">9. Información proporcionada por el usuario</Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario puede proporcionar información personal y contextual para mejorar la
              experiencia del servicio. Esto puede incluir:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• información demográfica</Text>
            <Text className="mt-1 text-white/90 leading-6">• datos emocionales</Text>
            <Text className="mt-1 text-white/90 leading-6">• contactos de apoyo</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • información de su profesional de salud mental.
            </Text>
            <Text className="mt-2 text-white/90 leading-6">
              El usuario es responsable de la veracidad de los datos proporcionados.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">10. Reportes emocionales automatizados</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación puede generar reportes informáticos que incluyan:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • análisis emocional del historial de conversación
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • detección de eventos emocionales relevantes
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • estadísticas sobre emociones detectadas
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• resumen de interacciones recientes</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Estos reportes tienen fines informativos y no constituyen diagnóstico psicológico.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">11. Comunicación con profesionales de salud mental</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Cuando el usuario proporcione voluntariamente el correo electrónico de su psicólogo o
              terapeuta, la aplicación podrá enviar notificaciones relacionadas con eventos
              emocionales relevantes detectados durante el uso del servicio. El usuario es
              responsable de proporcionar dicha información con el consentimiento del profesional
              correspondiente.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">12. Servicios de terceros</Text>
            <Text className="mt-2 text-white/90 leading-6">
              La aplicación puede utilizar tecnologías de terceros para operar ciertas
              funcionalidades, incluyendo servicios de inteligencia artificial y procesamiento de
              lenguaje natural. Estas tecnologías pueden incluir modelos ejecutados localmente o
              servicios externos utilizados para:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• generación de texto</Text>
            <Text className="mt-1 text-white/90 leading-6">• síntesis de voz</Text>
            <Text className="mt-1 text-white/90 leading-6">• procesamiento de lenguaje natural.</Text>

            <Text className="mt-4 text-xl font-bold text-white">13. Propiedad intelectual</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Todos los derechos sobre la aplicación IA MIND, incluyendo:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• software</Text>
            <Text className="mt-1 text-white/90 leading-6">• diseño</Text>
            <Text className="mt-1 text-white/90 leading-6">• funcionalidades</Text>
            <Text className="mt-1 text-white/90 leading-6">• contenido visual</Text>
            <Text className="mt-1 text-white/90 leading-6">• avatar digital</Text>
            <Text className="mt-1 text-white/90 leading-6">• reportes generados</Text>
            <Text className="mt-2 text-white/90 leading-6">
              pertenecen a Santillan Valencia Integration Systems S.A. de C.V.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">14. Licencia de uso</Text>
            <Text className="mt-2 text-white/90 leading-6">
              SVIS Integration Systems concede al usuario una licencia limitada, no exclusiva, no
              transferible y revocable para utilizar la aplicación únicamente para fines personales
              y conforme a los presentes términos.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">15. Uso permitido</Text>
            <Text className="mt-2 text-white/90 leading-6">El usuario podrá utilizar la aplicación para:</Text>
            <Text className="mt-1 text-white/90 leading-6">• apoyo emocional</Text>
            <Text className="mt-1 text-white/90 leading-6">• reflexión personal</Text>
            <Text className="mt-1 text-white/90 leading-6">• interacción conversacional</Text>
            <Text className="mt-1 text-white/90 leading-6">• seguimiento personal del estado emocional.</Text>

            <Text className="mt-4 text-xl font-bold text-white">16. Uso prohibido</Text>
            <Text className="mt-2 text-white/90 leading-6">Está prohibido utilizar la aplicación para:</Text>
            <Text className="mt-1 text-white/90 leading-6">• actividades ilegales</Text>
            <Text className="mt-1 text-white/90 leading-6">• acoso o amenazas</Text>
            <Text className="mt-1 text-white/90 leading-6">• manipulación del sistema</Text>
            <Text className="mt-1 text-white/90 leading-6">• ingeniería inversa</Text>
            <Text className="mt-1 text-white/90 leading-6">• uso comercial no autorizado.</Text>

            <Text className="mt-4 text-xl font-bold text-white">17. Limitación de responsabilidad</Text>
            <Text className="mt-2 text-white/90 leading-6">SVIS Integration Systems no será responsable por:</Text>
            <Text className="mt-1 text-white/90 leading-6">
              • decisiones tomadas por el usuario basadas en las respuestas del sistema
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • daños derivados del uso del servicio
            </Text>
            <Text className="mt-1 text-white/90 leading-6">
              • errores generados por sistemas de inteligencia artificial
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• interrupciones del servicio</Text>
            <Text className="mt-1 text-white/90 leading-6">• pérdida de información.</Text>

            <Text className="mt-4 text-xl font-bold text-white">18. Fuerza mayor</Text>
            <Text className="mt-2 text-white/90 leading-6">
              SVIS Integration Systems no será responsable por interrupciones del servicio causadas
              por eventos fuera de su control razonable, incluyendo:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• fallas de infraestructura</Text>
            <Text className="mt-1 text-white/90 leading-6">• interrupciones de internet</Text>
            <Text className="mt-1 text-white/90 leading-6">• desastres naturales</Text>
            <Text className="mt-1 text-white/90 leading-6">• fallas de proveedores tecnológicos.</Text>

            <Text className="mt-4 text-xl font-bold text-white">19. Terminación del servicio</Text>
            <Text className="mt-2 text-white/90 leading-6">
              SVIS Integration Systems podrá suspender o limitar el acceso al servicio cuando:
            </Text>
            <Text className="mt-1 text-white/90 leading-6">• se detecte uso indebido</Text>
            <Text className="mt-1 text-white/90 leading-6">• se violen los presentes términos</Text>
            <Text className="mt-1 text-white/90 leading-6">• exista riesgo para el usuario o terceros.</Text>

            <Text className="mt-4 text-xl font-bold text-white">20. Modificaciones</Text>
            <Text className="mt-2 text-white/90 leading-6">
              SVIS Integration Systems se reserva el derecho de modificar estos términos en cualquier
              momento. Las modificaciones serán publicadas dentro de la aplicación o en los canales
              oficiales del servicio.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">21. Legislación aplicable</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Los presentes términos se regirán por las leyes aplicables de los Estados Unidos
              Mexicanos. Cualquier controversia derivada del uso del servicio será sometida a la
              jurisdicción de los tribunales competentes de la Ciudad de México, renunciando las
              partes a cualquier otro fuero que pudiera corresponderles por razón de su domicilio
              presente o futuro.
            </Text>

            <Text className="mt-4 text-xl font-bold text-white">22. Contacto</Text>
            <Text className="mt-2 text-white/90 leading-6">
              Para cualquier consulta relacionada con estos términos, los usuarios pueden comunicarse
              a: info@svis.com.mx
            </Text>
          </View>
        </KeyboardAwareScrollView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}