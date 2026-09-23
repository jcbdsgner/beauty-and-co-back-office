// Données fictives « Mon compte » — front-end uniquement, aucune API, aucune
// persistance. Volontairement indépendant du barlel : importer directement
// `@/lib/mock/compte`.
//
// Un seul utilisateur : la propriétaire. Ce module porte ses informations de
// compte (identité, connexion, canaux de notification) et les règles de
// validation utilisées par l'écran `/compte`.

export type NotifyChannels = {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
};

export type OwnerAccount = {
  name: string;
  role: string; // « Propriétaire » — affiché partout, non modifiable (compte unique)
  email: string;
  phone: string;
  avatarUrl: string; // photo de session (import fonctionnel, cf. `Compte.tsx`), "" = pas de photo
  password: string; // mot de passe de session — jamais persisté, sert juste à valider le champ « actuel »
  notify: NotifyChannels;
};

export const defaultAccount: OwnerAccount = {
  name: "Sokhna Ndour",
  role: "Propriétaire",
  email: "sokhna.ndour@beautyandco.sn",
  phone: "+221 77 402 15 60",
  avatarUrl: "",
  password: "beautyco2026",
  notify: { email: true, sms: true, whatsapp: false },
};

export const NOTIFY_CHANNEL_LABELS: Record<keyof NotifyChannels, string> = {
  email: "Par email",
  sms: "Par SMS",
  whatsapp: "Par WhatsApp",
};

/* ------------------------------------------------------------------ */
/* Validation — tolérante : juste de quoi éviter les fautes grossières */
/* ------------------------------------------------------------------ */

export const isValidEmail = (v: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

// Numéro sénégalais : +221 puis 9 chiffres (espaces / points / tirets tolérés),
// ou les 9 chiffres seuls.
export const isValidPhone = (v: string): boolean => {
  const compact = v.replace(/[\s.\-]/g, "");
  return /^\+?221\d{9}$/.test(compact) || /^\d{9}$/.test(compact);
};

export const PASSWORD_MIN = 8;

// Contrôle du changement de mot de passe. Renvoie le premier problème rencontré
// (ordre : champ actuel → correspondance réelle → longueur → différence →
// confirmation), ou null si tout est bon. `actual` = mot de passe de session
// réellement en vigueur (`OwnerAccount.password`) — le champ « actuel » doit y
// correspondre, comme côté point-de-vente (`verifyPassword`), pas juste être
// non vide.
export function passwordError(
  actual: string,
  current: string,
  next: string,
  confirm: string,
): string | null {
  if (!current) return "Saisissez votre mot de passe actuel.";
  if (current !== actual) return "Mot de passe actuel incorrect.";
  if (next.length < PASSWORD_MIN)
    return `Le nouveau mot de passe doit faire au moins ${PASSWORD_MIN} caractères.`;
  if (next === current)
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (confirm !== next)
    return "La confirmation ne correspond pas au nouveau mot de passe.";
  return null;
}

// Initiales pour l'avatar (2 lettres max) — pas d'import de photo dans ce
// squelette front-end.
export const accountInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
