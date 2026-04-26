import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import LoginScreen from 'screens/LoginScreen';
import RegisterScreen from 'screens/RegisterScreen';
import SkinScreen from 'screens/SkinsScreen'
import FormScreen from 'screens/FormScreen';
import OptionsScreen from 'screens/OptionScreen';
import AvisoPrivacidad from 'screens/AvisoPrivacidad';
import InfoContacto from 'screens/screensOptions/screensContactoEmergencia/InfoContacto'
import InfoPsicologo from 'screens/screensOptions/screensContactoEmergencia/InfoPsicologo';
import ListaContactos from 'screens/screensOptions/screensContactoEmergencia/ListContacto'
import ModificarContacto from 'screens/screensOptions/screensContactoEmergencia/ModificarContacto';
import MenuContactoEmergencia from 'screens/screensOptions/screensContactoEmergencia/MenuContactoEmergencia';
import InfoPersonal from 'screens/screensOptions/screenInformacionPersonal/InfoPersonal';
import ListaContactosEmergencia from 'screens/ListContactosEmergency';
import ListaPsicologo from 'screens/screensOptions/screensContactoEmergencia/ListaPsicologo';
import ModificarPsicologo from 'screens/screensOptions/screensContactoEmergencia/ModificarPsicologo';
import { StatusBar } from 'expo-status-bar';
import './global.css';



const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Form" component={FormScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Skins" component={SkinScreen} options={{ title: "Skins" }}/>
        <Stack.Screen name="Options" component={OptionsScreen} options={{title: "Ajustes"}}/>
        <Stack.Screen name="ListaContactosEmergencia" component={ListaContactosEmergencia} options={{title: "Lista de Emergencia"}}/>

        {/*SCREAN DE AVISO DE PRIVACIDAD*/}
        <Stack.Screen name="AvisoPrivacidad" component={AvisoPrivacidad} options={{title: "Aviso de Privacidad"}}/>
        {/*SCREANS DE OPCIONES*/}

        {/*SCREANS DE INFORMACION PERSONAL*/}
        <Stack.Screen name="OptionsInfoPersonal" component={InfoPersonal} options={{title: "Informacion Personal"}}/>
        {/*SCREANS CONTACTO DE EMERGENCIA*/}
        <Stack.Screen name="OptionsMenuContactoEmergencia" component={MenuContactoEmergencia} options={{title: "Contactos de Emergencia"}}/>
        <Stack.Screen name="OptionsInfoContacto" component={InfoContacto} options={{title: "Informacion de Contacto"}}/>
        <Stack.Screen name="OptionsInfoPsicologo" component={InfoPsicologo} options={{title: "Informacion de Psicologo"}}/>
        <Stack.Screen name="OptionsListaPsicologo" component={ListaPsicologo} options={{title: "Lista de Psicologos"}}/>
        <Stack.Screen name="OptionsListaContacto" component={ListaContactos} options={{title: "Lista de Contacto"}}/>
        <Stack.Screen name="OptionsModificarContacto" component={ModificarContacto} options={{title: "Modificar Contacto"}}/>
        <Stack.Screen name="OptionsModificarPsicologo" component={ModificarPsicologo} options={{title: "Modificar Contacto"}}/>
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
