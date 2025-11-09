// screens/skins.ts
export const STORAGE_KEY = "catSkin";

// Emociones soportadas (sin acentos)
export const EMOTIONS = ["comprension", "calma", "seguridad", "alegria", "curiosidad"] as const;
export type EmotionKey = typeof EMOTIONS[number];

// Mapa base: imagen "main" de cada skin
export const SKINS: Record<string, any> = {
  default: require("../assets/gato/main.png"),
  perro: require("../assets/perro/main.png"),
  oso: require("../assets/oso/main.png"),
  ave: require("../assets/ave/main.png"),
  gallina: require("../assets/gallo/main.png"),
};

// Variantes por emoción para cada skin (usa rutas estáticas - RN no admite require dinámico)
export const SKINS_EMOTIONS: Record<string, Partial<Record<EmotionKey, any>>> = {
  default: {
    comprension: require("../assets/gato/comprension.png"),
    calma: require("../assets/gato/calma.png"),
    seguridad: require("../assets/gato/seguridad.png"),
    alegria: require("../assets/gato/alegria.png"),
    curiosidad: require("../assets/gato/curiosidad.png"),
  },
  perro: {
    comprension: require("../assets/perro/comprension.png"),
    calma: require("../assets/perro/calma.png"),
    seguridad: require("../assets/perro/seguridad.png"),
    alegria: require("../assets/perro/alegria.png"),
    curiosidad: require("../assets/perro/curiosidad.png"),
  },
  oso: {
    comprension: require("../assets/oso/comprension.png"),
    calma: require("../assets/oso/calma.png"),
    seguridad: require("../assets/oso/seguridad.png"),
    alegria: require("../assets/oso/alegria.png"),
    curiosidad: require("../assets/oso/curiosidad.png"),
  },
  ave: {
    comprension: require("../assets/ave/comprension.png"),
    calma: require("../assets/ave/calma.png"),
    seguridad: require("../assets/ave/seguridad.png"),
    alegria: require("../assets/ave/alegria.png"),
    curiosidad: require("../assets/ave/curiosidad.png"),
  },
  gallina: {
    comprension: require("../assets/gallo/comprension.png"),
    calma: require("../assets/gallo/calma.png"),
    seguridad: require("../assets/gallo/seguridad.png"),
    alegria: require("../assets/gallo/alegria.png"),
    curiosidad: require("../assets/gallo/curiosidad.png"),
  },
};

// Tipos compartidos
export type LocalSkinItem = { type: "local"; key: keyof typeof SKINS };
export type RemoteSkinItem = { type: "remote"; uri: string };
export type SkinItem = LocalSkinItem | RemoteSkinItem;

// Helpers para remotos
export const isRemoteValue = (v: string) =>
  /^https?:\/\//i.test(v) || /^file:\/\//i.test(v);

// Normaliza texto de emoción: minúsculas, sin acentos, sin espacios extremos
export function normalizeEmotion(raw?: string | null): EmotionKey | null {
  if (!raw || typeof raw !== "string") return null;
  const base = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // quita acentos

  // Mapea a las claves soportadas
  if ((EMOTIONS as readonly string[]).includes(base)) {
    return base as EmotionKey;
  }
  return null;
}

// Resuelve la imagen según skin y emoción; si no hay variante, devuelve main
export function resolveSourceByEmotion(
  skinKey: keyof typeof SKINS,
  emotion: EmotionKey | null
): any {
  if (emotion) {
    const variants = SKINS_EMOTIONS[skinKey];
    if (variants && variants[emotion]) return variants[emotion]!;
  }
  return SKINS[skinKey] ?? SKINS.default;
}
