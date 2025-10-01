// screens/skins.ts
export const STORAGE_KEY = "catSkin";

// Mapa de skins locales (clave → require)
export const SKINS: Record<string, any> = {
  default: require("../assets/gato/main.png"),
  perro: require("../assets/perro/main.png"),
  oso: require("../assets/oso/main.png"),
  ave: require("../assets/ave/main.png"),
  gallina: require("../assets/gallo/main.png"),
};

// Tipos compartidos (opcional, para no duplicar)
export type LocalSkinItem = { type: "local"; key: keyof typeof SKINS };
export type RemoteSkinItem = { type: "remote"; uri: string };
export type SkinItem = LocalSkinItem | RemoteSkinItem;

// Helpers (opcionales)
export const isRemoteValue = (v: string) =>
  /^https?:\/\//i.test(v) || /^file:\/\//i.test(v);

export const resolveSource = (item: SkinItem) =>
  item.type === "remote" ? { uri: item.uri } : SKINS[item.key] ?? SKINS.default;