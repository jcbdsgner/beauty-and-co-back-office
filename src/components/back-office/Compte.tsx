"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import PageHeader from "@/components/back-office/PageHeader";
import { CheckCircleIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import { useAccount } from "@/context/AccountContext";
import {
  NOTIFY_CHANNEL_LABELS,
  PASSWORD_MIN,
  accountInitials,
  isValidEmail,
  isValidPhone,
  passwordError,
  type NotifyChannels,
} from "@/lib/mock/compte";

// Écran « Mon compte » — les informations personnelles de la propriétaire.
//
// 1. Où en est-elle ? Elle vient rarement ici, pour une raison précise : corriger
//    l'orthographe de son nom (il s'affiche partout), changer un numéro, refaire
//    son mot de passe après une alerte. Pas pressée, mais deux craintes : que ce
//    ne soit « pas enregistré », et se verrouiller dehors en touchant au mot de
//    passe.
// 2. Ce qui doit sauter aux yeux : ses informations actuelles, lisibles, et le
//    fait que rien ne bouge tant qu'elle n'a pas cliqué « Enregistrer ». Le
//    changement de mot de passe est une action séparée et explicite, jamais un
//    champ perdu au milieu.
// 3. Quand ça se passe mal : email ou téléphone invalide → message sous le champ
//    au moment d'enregistrer, on ne soumet pas ; mot de passe → champ actuel
//    incorrect / vide / trop court / confirmation différente, message clair, on
//    ne soumet pas ; aucun canal de notification actif → avertissement. Aucune
//    persistance : rafraîchir la page remet le compte à zéro (cohérent avec
//    tout le projet) — y compris la photo et le mot de passe changés en session.

/* --------------------------------------------------------------- primitives */

const fieldClass =
  "h-11 w-full rounded-field border border-base-300 bg-white px-4 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]";

const btnPrimary =
  "btn btn-primary btn-sm normal-case text-[15px] font-semibold active:scale-[0.97] disabled:!bg-base-200 disabled:!text-base-content/40 gap-2";

const btnGhost =
  "btn btn-ghost btn-sm normal-case text-[15px] font-semibold text-base-content/70";

const Divider = () => <div className="-mx-6 border-t border-base-300" />;

function Toggle({
  checked,
  onChange,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  "aria-label": string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-brand-500" : "bg-base-300"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function SettingRow({
  title,
  description,
  control,
}: {
  title: string;
  description?: string;
  control: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-sm font-medium text-base-content">{title}</p>
        {description && <p className="mt-0.5 text-xs text-base-content/60">{description}</p>}
      </div>
      <div className="shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
  error,
  hint,
  autoComplete,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "tel" | "password";
  error?: string;
  hint?: string;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-base-content">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={error ? true : undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldClass} ${
          error ? "border-error-300 focus:border-error-300 focus:ring-error-500/10" : ""
        }`}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-error-600">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-base-content/60">{hint}</p>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- écran */

export default function Compte() {
  const { account, updateAccount } = useAccount();
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Brouillon en mémoire de session — rien n'est modifié tant que « Enregistrer »
  // n'est pas cliqué.
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone);
  const [notify, setNotify] = useState<NotifyChannels>(account.notify);
  const [attempted, setAttempted] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const touch = () => setJustSaved(false);

  const nameBad = name.trim().length < 2;
  const emailBad = !isValidEmail(email);
  const phoneBad = !isValidPhone(phone);
  const invalid = nameBad || emailBad || phoneBad;

  const dirty =
    name.trim() !== account.name ||
    email.trim() !== account.email ||
    phone.trim() !== account.phone ||
    notify.email !== account.notify.email ||
    notify.sms !== account.notify.sms ||
    notify.whatsapp !== account.notify.whatsapp;

  const noChannel = !notify.email && !notify.sms && !notify.whatsapp;

  const save = () => {
    setAttempted(true);
    if (invalid || !dirty) return;
    updateAccount({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notify,
    });
    setAttempted(false);
    setJustSaved(true);
  };

  /* --------------------------------------------------------- mot de passe */

  const [pwOpen, setPwOpen] = useState(false);
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNext, setPwNext] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwShow, setPwShow] = useState(false);
  const [pwAttempted, setPwAttempted] = useState(false);
  const [pwJustSaved, setPwJustSaved] = useState(false);

  const pwErr = passwordError(account.password, pwCurrent, pwNext, pwConfirm);

  const closePw = () => {
    setPwOpen(false);
    setPwCurrent("");
    setPwNext("");
    setPwConfirm("");
    setPwShow(false);
    setPwAttempted(false);
  };

  const submitPw = () => {
    setPwAttempted(true);
    if (pwErr) return;
    updateAccount({ password: pwNext });
    closePw();
    setPwJustSaved(true);
  };

  const pwType = pwShow ? "text" : "password";

  return (
    <div className="space-y-6">
      <PageHeader title="Mon compte" />

      <div className="max-w-3xl rounded-box border border-base-300 bg-white">
        {/* Identité ------------------------------------------------------- */}
        <div className="space-y-5 p-6">
          <h2 className="text-lg font-semibold text-base-content">Identité</h2>

          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-lg font-semibold text-secondary">
              {account.avatarUrl ? (
                <Image
                  src={account.avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                accountInitials(name || account.name)
              )}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="btn btn-outline btn-sm normal-case text-[15px] font-semibold border-base-300 text-secondary hover:!bg-base-200 hover:!border-base-300 hover:!text-secondary active:scale-[0.97]"
                >
                  {account.avatarUrl ? "Changer la photo" : "Ajouter une photo"}
                </button>
                {account.avatarUrl && (
                  <button
                    type="button"
                    onClick={() => updateAccount({ avatarUrl: "" })}
                    className="text-xs font-medium text-base-content/45 hover:text-error-600 hover:underline"
                  >
                    Retirer
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-xs text-base-content/60">JPG ou PNG, gardée pour cette session.</p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => updateAccount({ avatarUrl: String(reader.result) });
                  reader.readAsDataURL(file);
                }}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              id="compte-nom"
              label="Nom complet"
              value={name}
              onChange={(v) => {
                setName(v);
                touch();
              }}
              autoComplete="name"
              error={attempted && nameBad ? "Indiquez votre nom." : undefined}
            />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-base-content">Fonction</span>
              <p className="flex h-11 items-center rounded-lg bg-base-200 px-4 text-sm text-base-content/60">
                {account.role}
              </p>
            </div>
          </div>

          <div className="sm:max-w-[280px]">
            <TextField
              id="compte-tel"
              label="Téléphone"
              type="tel"
              value={phone}
              onChange={(v) => {
                setPhone(v);
                touch();
              }}
              autoComplete="tel"
              error={
                attempted && phoneBad
                  ? "Numéro invalide. Format attendu : +221 77 000 00 00."
                  : undefined
              }
              hint="Utilisé pour les alertes par SMS et WhatsApp."
            />
          </div>
        </div>

        <Divider />

        {/* Connexion --------------------------------------------------- */}
        <div className="space-y-5 p-6">
          <h2 className="text-lg font-semibold text-base-content">Connexion</h2>

          <div className="sm:max-w-[360px]">
            <TextField
              id="compte-email"
              label="Adresse email"
              type="email"
              value={email}
              onChange={(v) => {
                setEmail(v);
                touch();
              }}
              autoComplete="email"
              error={attempted && emailBad ? "Adresse email invalide." : undefined}
              hint="Sert d'identifiant de connexion et reçoit les messages du système."
            />
          </div>

          {!pwOpen ? (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-base-300 px-4 py-3.5">
              <div>
                <p className="text-sm font-medium text-base-content">Mot de passe</p>
                <p className="mt-0.5 text-xs text-base-content/60">
                  {pwJustSaved ? "Mis à jour à l'instant." : "••••••••••"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPwOpen(true);
                  setPwJustSaved(false);
                }}
                className="btn btn-outline btn-sm normal-case text-[15px] font-semibold border-base-300 text-secondary hover:!bg-base-200 hover:!border-base-300 hover:!text-secondary active:scale-[0.97] shrink-0"
              >
                Changer le mot de passe
              </button>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-base-300 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-base-content">Changer le mot de passe</p>
                <button
                  type="button"
                  onClick={() => setPwShow((s) => !s)}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-base-content/60 hover:text-base-content"
                >
                  {pwShow ? <EyeCloseIcon className="size-4" /> : <EyeIcon className="size-4" />}
                  {pwShow ? "Masquer" : "Afficher"}
                </button>
              </div>
              <TextField
                id="pw-current"
                label="Mot de passe actuel"
                type={pwType}
                value={pwCurrent}
                onChange={setPwCurrent}
                autoComplete="current-password"
              />
              <TextField
                id="pw-next"
                label="Nouveau mot de passe"
                type={pwType}
                value={pwNext}
                onChange={setPwNext}
                autoComplete="new-password"
                hint={`Au moins ${PASSWORD_MIN} caractères.`}
              />
              <TextField
                id="pw-confirm"
                label="Confirmer le nouveau mot de passe"
                type={pwType}
                value={pwConfirm}
                onChange={setPwConfirm}
                autoComplete="new-password"
              />
              {pwAttempted && pwErr && (
                <p className="text-xs text-error-600">{pwErr}</p>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={submitPw} className={btnPrimary}>
                  Mettre à jour le mot de passe
                </button>
                <button type="button" onClick={closePw} className={btnGhost}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>

        <Divider />

        {/* Notifications --------------------------------------------- */}
        <div className="space-y-5 p-6">
          <h2 className="text-lg font-semibold text-base-content">Comment vous prévenir</h2>
          <p className="text-sm text-base-content/60">
            Choisissez par quels canaux recevoir les alertes importantes : nouveau rendez-vous,
            annulation, demande de l&apos;équipe, stock bas.
          </p>
          <div className="space-y-4">
            {(Object.keys(NOTIFY_CHANNEL_LABELS) as (keyof NotifyChannels)[]).map((ch) => (
              <SettingRow
                key={ch}
                title={NOTIFY_CHANNEL_LABELS[ch]}
                control={
                  <Toggle
                    checked={notify[ch]}
                    onChange={(v) => {
                      setNotify((n) => ({ ...n, [ch]: v }));
                      touch();
                    }}
                    aria-label={NOTIFY_CHANNEL_LABELS[ch]}
                  />
                }
              />
            ))}
          </div>
          {noChannel && (
            <p className="text-xs text-warning-600">
              Aucun canal actif : vous ne serez prévenue que par la cloche de notifications dans
              l&apos;outil.
            </p>
          )}
        </div>

        {/* Enregistrer ------------------------------------------------ */}
        <div className="flex items-center gap-3 border-t border-base-300 px-6 py-4">
          <button
            type="button"
            onClick={save}
            disabled={!dirty}
            className={btnPrimary}
          >
            Enregistrer
          </button>
          {attempted && invalid && (
            <span className="text-sm text-error-600">
              Corrigez les champs signalés avant d&apos;enregistrer.
            </span>
          )}
          {justSaved && !dirty && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-success-600">
              <CheckCircleIcon className="size-4" />
              Modifications enregistrées
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
