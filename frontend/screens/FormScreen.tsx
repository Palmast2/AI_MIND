import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  Alert,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const BG = '#00634C';
const CARD = '#008060';
const WHITE = '#FFFFFF';
const TEXT_DIM = 'rgba(255,255,255,0.90)';

function SelectBox({ label, value, placeholder = 'Seleccionar', onPress, disabled }) {
  return (
    <View style={{ marginBottom: 14, opacity: disabled ? 0.6 : 1 }}>
      <Text style={styles.label}>{label}</Text>

      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.select}
        onPress={onPress}
        disabled={disabled}>
        <Text style={[styles.selectText, !value && { opacity: 0.85 }]}>{value ?? placeholder}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function FormScreen() {
  const navigation = useNavigation();

  // ====== YEARS (local) ======
  const [years, setYears] = useState([]);
  useEffect(() => {
    const current = new Date().getFullYear();
    const arr = [];
    for (let y = current - 10; y >= 1940; y--)
      arr.push({ id: y, label: String(y), value: String(y) });
    setYears(arr);
  }, []);

  // ====== OPTIONS FROM API ======
  const [optLoading, setOptLoading] = useState(true);
  const [opt, setOpt] = useState({
    genero: [],
    sexo: [],
    nivel_educativo: [],
    ocupacion: [],
    estado_civil: [],
    situacion_laboral: [],
    estado: [],
  });

  const fetchOpciones = async () => {
    try {
      setOptLoading(true);

      const cookiesString = await AsyncStorage.getItem('cookies');
      const cookies = cookiesString ? JSON.parse(cookiesString) : null;

      // Si tu API requiere CSRF en GET, lo mandas; si no, no pasa nada.
      const csrfToken = cookies?.csrf_refresh_token;

      const res = await fetch('https://api.aimind.portablelab.work/api/v1/demograficos/opciones', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        credentials: 'include',
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = data?.msg || data?.message || 'No se pudieron cargar las opciones.';
        throw new Error(msg);
      }

      // helper: {id,label} -> {id,label,value:label}
      const mapOpts = (arr) =>
        Array.isArray(arr) ? arr.map((x) => ({ ...x, value: x.label })) : [];

      setOpt({
        genero: mapOpts(data?.genero),
        sexo: mapOpts(data?.sexo),
        nivel_educativo: mapOpts(data?.nivel_educativo),
        ocupacion: mapOpts(data?.ocupacion),
        estado_civil: mapOpts(data?.estado_civil),
        situacion_laboral: mapOpts(data?.situacion_laboral),
        estado: mapOpts(data?.estado),
      });
    } catch (e) {
      Alert.alert('Opciones', e?.message ?? 'Error inesperado al cargar opciones.');
    } finally {
      setOptLoading(false);
    }
  };

  useEffect(() => {
    fetchOpciones();
  }, []);

  // ====== STATE (answers) ======
  const [anio, setAnio] = useState('2000');
  const [genero, setGenero] = useState(null);
  const [entidad, setEntidad] = useState(null);
  const [estadoCivil, setEstadoCivil] = useState(null);
  const [nivel, setNivel] = useState(null);
  const [ocupacion, setOcupacion] = useState(null);
  const [situacion, setSituacion] = useState(null);
  const [sexo, setSexo] = useState(null);
  const [consentimiento, setConsentimiento] = useState(false);

  // ====== MODAL (bottom sheet) ======
  const [sheet, setSheet] = useState({
    visible: false,
    title: '',
    options: [],
    onSelect: null,
  });

  const openSheet = (title, options, onSelect) => {
    setSheet({ visible: true, title, options, onSelect });
  };
  const closeSheet = () => setSheet((s) => ({ ...s, visible: false }));

  // ====== ACTIONS ======
  const onSkip = () => {
    Alert.alert('¿Omitir información?', '¿Estás seguro? Puedes completarlo después.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sí, omitir', style: 'destructive', onPress: goHomeReset },
    ]);
  };

  const postDemograficosMe = async (payload, csrfToken) => {
    const response = await fetch('https://api.aimind.portablelab.work/api/v1/demograficos/me', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {}

    console.log(data);
    if (!response.ok) {
      const msg = data?.msg || data?.message || 'No se pudo guardar la información demográfica.';
      throw new Error(msg);
    }

    return data;
  };

  const goHomeReset = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  const onNext = async () => {
    try {
      const cookiesString = await AsyncStorage.getItem('cookies');
      if (!cookiesString) {
        Alert.alert('Sesión', 'No hay cookies guardadas.');
        return;
      }
      const cookies = JSON.parse(cookiesString);
      const csrfToken = cookies.csrf_access_token;

      const payload = {
        birth_year: Number(anio),
        genero: genero ?? null,
        sexo: sexo ?? null,
        nivel_educativo: nivel ?? null,
        ocupacion: ocupacion ?? null,
        estado_civil: estadoCivil ?? null,
        situacion_laboral: situacion ?? null,
        estado: entidad ?? null,
        consentimiento_estadistico: consentimiento,
      };

      await postDemograficosMe(payload, csrfToken);
      goHomeReset();
    } catch (e) {
      Alert.alert('Demográficos', e?.message ?? 'Error inesperado.');
    }
  };

  const ConsentCheck = ({ value, onToggle }) => (
    <TouchableOpacity activeOpacity={0.8} onPress={onToggle} style={styles.consentRow}>
      <View style={[styles.checkbox, value && styles.checkboxOn]}>
        {value ? <Text style={styles.checkMark}>✓</Text> : null}
      </View>
      <Text style={styles.consentText}>Acepto que mis datos se usen con fines estadísticos.</Text>
    </TouchableOpacity>
  );

  const selectsDisabled = optLoading;

  return (
    <SafeAreaView style={styles.safe}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>IA MIND</Text>
            <Text style={styles.subtitle}>
              Esto nos ayuda a brindarte{'\n'}una mejor experiencia.
            </Text>
          </View>

          {/* Loader opciones */}
          {optLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color={WHITE} />
              <Text style={styles.loadingText}>Cargando opciones…</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.col}>
                <SelectBox
                  label="Año de Nacimiento"
                  value={anio}
                  disabled={years.length === 0}
                  onPress={() => openSheet('Año de Nacimiento', years, (v) => setAnio(v))}
                />
              </View>
              <View style={styles.col}>
                <SelectBox
                  label="Género"
                  value={genero}
                  disabled={selectsDisabled}
                  onPress={() => openSheet('Género', opt.genero, (v) => setGenero(v))}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <SelectBox
                  label="Estado de residencia"
                  value={entidad}
                  disabled={selectsDisabled}
                  onPress={() =>
                    openSheet('Estado de residencia', opt.estado, (v) => setEntidad(v))
                  }
                />
              </View>
              <View style={styles.col}>
                <SelectBox
                  label="Estado civil"
                  value={estadoCivil}
                  disabled={selectsDisabled}
                  onPress={() =>
                    openSheet('Estado civil', opt.estado_civil, (v) => setEstadoCivil(v))
                  }
                />
              </View>
            </View>

            <SelectBox
              label="Nivel educativo"
              value={nivel}
              disabled={selectsDisabled}
              onPress={() => openSheet('Nivel educativo', opt.nivel_educativo, (v) => setNivel(v))}
            />

            <SelectBox
              label="Ocupación"
              value={ocupacion}
              disabled={selectsDisabled}
              onPress={() => openSheet('Ocupación', opt.ocupacion, (v) => setOcupacion(v))}
            />

            <SelectBox
              label="Situación laboral"
              value={situacion}
              disabled={selectsDisabled}
              onPress={() =>
                openSheet('Situación laboral', opt.situacion_laboral, (v) => setSituacion(v))
              }
            />

            <SelectBox
              label="Sexo"
              value={sexo}
              disabled={selectsDisabled}
              onPress={() => openSheet('Sexo', opt.sexo, (v) => setSexo(v))}
            />

            <ConsentCheck value={consentimiento} onToggle={() => setConsentimiento((v) => !v)} />
          </View>

          {/* Footer buttons */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnSkip} onPress={onSkip}>
              <Text style={styles.btnSkipText}>Omitir</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnNext} onPress={onNext} disabled={optLoading}>
              <Text style={styles.btnNextText}>Siguiente</Text>
            </TouchableOpacity>
          </View>

          {/* Bottom Sheet */}
          <Modal
            visible={sheet.visible}
            transparent
            animationType="fade"
            onRequestClose={closeSheet}>
            <Pressable style={styles.backdrop} onPress={closeSheet}>
              <Pressable style={styles.sheet} onPress={() => {}}>
                <Text style={styles.sheetTitle}>{sheet.title}</Text>

                <FlatList
                  data={sheet.options}
                  keyExtractor={(item, idx) => `${item.id ?? item.value}-${idx}`}
                  ItemSeparatorComponent={() => <View style={styles.sep} />}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.optionRow}
                      onPress={() => {
                        sheet.onSelect?.(item.value);
                        closeSheet();
                      }}>
                      <Text style={styles.optionText}>{item.label}</Text>
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity style={styles.cancel} onPress={closeSheet}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </Pressable>
            </Pressable>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 18,
  },
  header: { alignItems: 'center', marginTop: 18, marginBottom: 18 },
  title: { color: WHITE, fontSize: 48, fontWeight: '900', letterSpacing: 1 },
  subtitle: {
    color: TEXT_DIM,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    fontWeight: '600',
  },

  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  loadingText: { color: TEXT_DIM, fontWeight: '700' },

  form: { flex: 1, marginTop: 10 },
  row: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },

  label: { color: TEXT_DIM, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  select: {
    backgroundColor: CARD,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectText: { color: WHITE, fontSize: 16, fontWeight: '700' },

  footer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  btnSkip: {
    width: 95,
    height: 48,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  btnSkipText: { color: WHITE, fontWeight: '800', fontSize: 16 },
  btnNext: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnNextText: { color: BG, fontWeight: '900', fontSize: 18 },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 18,
    maxHeight: '70%',
  },
  sheetTitle: { fontSize: 16, fontWeight: '900', marginBottom: 10, color: '#111' },
  optionRow: { paddingVertical: 12 },
  optionText: { fontSize: 16, fontWeight: '700', color: '#111' },
  sep: { height: 1, backgroundColor: 'rgba(0,0,0,0.08)' },
  cancel: {
    marginTop: 10,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontSize: 16, fontWeight: '900', color: '#111' },

  consentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkboxOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  checkMark: { color: BG, fontWeight: '900', fontSize: 16, marginTop: -1 },
  consentText: {
    flex: 1,
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
});
