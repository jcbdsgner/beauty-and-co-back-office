"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Mail, MessageCircle, MessageSquare, Send, Users } from "lucide-react";
import { useClientsData } from "@/context/ClientsContext";
import { groupThousands } from "@/lib/mock/beautyandco";
import { isValidEmail } from "@/lib/mock/compte";
import { markdownToPlain } from "@/lib/markdown-lite";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/atoms/button";
import { Switch } from "@/components/ui/atoms/switch";
import { TextInput } from "@/components/ui/atoms/text-input";
import { Textarea } from "@/components/ui/atoms/textarea";
import { ConfirmDialog } from "@/components/ui/molecules/confirm-dialog";
import { SegmentedToggle } from "@/components/ui/molecules/segmented-toggle";
import { Toast } from "@/components/ui/molecules/toast";
import PageHeader from "../PageHeader";
import EmailPreview from "../shared/EmailPreview";

// « Envoyer un message » — envoi ponctuel ou groupé, sur un ou plusieurs canaux
// (Email, SMS, WhatsApp), tout de suite ou programmé (2026-10-01). L'aperçu
// montre le rendu de chaque canal choisi. Démo front-end : rien ne part, les
// envois (et les programmations) restent dans l'historique de la session.

type Channel = "email" | "sms" | "whatsapp";

const CHANNELS: { id: Channel; label: string; icon: React.ReactNode }[] = [
  { id: "email", label: "Email", icon: <Mail className="size-[18px]" /> },
  { id: "sms", label: "SMS", icon: <MessageSquare className="size-[18px]" /> },
  { id: "whatsapp", label: "WhatsApp", icon: <MessageCircle className="size-[18px]" /> },
];

const SMS_LIMIT = 480;

type Sent = {
  id: string;
  at: string; // envoyé le, ou prévu le si `scheduled`
  scheduled: boolean;
  channels: Channel[];
  subject: string;
  audience: string;
};

type When = "now" | "later";

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Proposition par défaut d'une programmation : demain, 10:00.
function tomorrowAtTen() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: isoDay(d), time: "10:00" };
}

const longWhen = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });

const splitAddresses = (s: string) =>
  s
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter(Boolean);

const clock = (iso: string) =>
  new Date(iso).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default function EnvoyerMessage() {
  const params = useSearchParams();
  const { rows, getDetail } = useClientsData();
  const allClients = rows("all");

  // ?client=<id> — arrivée depuis l'e-mail d'une fiche cliente ou d'un rendez-vous.
  const [recipients, setRecipients] = useState(() => {
    const id = params.get("client");
    return (id && getDetail(id)?.row.email) || "";
  });
  const [channels, setChannels] = useState<Channel[]>(["email"]);
  const [broadcast, setBroadcast] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [history, setHistory] = useState<Sent[]>([]);
  const [when, setWhen] = useState<When>("now");
  const [schedule, setSchedule] = useState(tomorrowAtTen);
  const [previewOf, setPreviewOf] = useState<Channel>("email");
  const [cancelling, setCancelling] = useState<string | null>(null);
  // Heure lue une fois à l'ouverture (rendu pur) ; l'envoi la revérifie.
  const [openedAt] = useState(() => Date.now());
  const [notice, setNotice] = useState<string | null>(null);

  const has = (c: Channel) => channels.includes(c);
  const toggleChannel = (c: Channel) =>
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  // Destinataires saisis : adresses valides / invalides, et fiches reconnues
  // (pour SMS / WhatsApp, on retrouve le numéro de la cliente par son e-mail).
  const addresses = splitAddresses(recipients);
  const invalid = addresses.filter((a) => !isValidEmail(a));
  const known = allClients.filter((c) => addresses.some((a) => a.toLowerCase() === c.email.toLowerCase()));

  const reach = useMemo(() => {
    const pool = broadcast ? allClients : known;
    return {
      email: broadcast ? allClients.filter((c) => c.email).length : addresses.length - invalid.length,
      sms: pool.filter((c) => c.phone).length,
      whatsapp: pool.filter((c) => c.whatsapp || c.phone).length,
    };
  }, [broadcast, allClients, known, addresses.length, invalid.length]);

  const plain = markdownToPlain(body);
  const smsTooLong = has("sms") && plain.length > SMS_LIMIT;

  const errors = {
    channels: channels.length === 0 ? "Choisissez au moins un canal." : null,
    recipients: broadcast
      ? null
      : addresses.length === 0
        ? "Indiquez au moins une adresse."
        : invalid.length > 0
          ? `Adresse${invalid.length > 1 ? "s" : ""} non valide${invalid.length > 1 ? "s" : ""} : ${invalid.join(", ")}`
          : !has("email") && known.length === 0
            ? "Aucune de ces adresses ne correspond à une fiche cliente : pas de numéro pour le SMS ou WhatsApp."
            : null,
    subject: has("email") && !subject.trim() ? "Indiquez l'objet du message." : null,
    body: !body.trim() ? "Rédigez le message." : smsTooLong ? `Trop long pour un SMS (${plain.length} / ${SMS_LIMIT} caractères).` : null,
  };
  const scheduledAt = new Date(`${schedule.date}T${schedule.time}`);
  const scheduleError =
    when !== "later"
      ? null
      : !schedule.date || !schedule.time || Number.isNaN(scheduledAt.getTime())
        ? "Choisissez la date et l'heure d'envoi."
        : scheduledAt.getTime() <= openedAt
          ? "Cette date est déjà passée : choisissez un moment à venir."
          : null;
  const valid = !Object.values(errors).some(Boolean) && !scheduleError;

  // Canal montré dans l'aperçu : celui choisi s'il est encore coché, sinon le premier.
  const shown: Channel = channels.includes(previewOf) ? previewOf : channels[0] ?? "email";

  const total = Math.max(...channels.map((c) => reach[c]), 0);

  const submit = () => {
    setTried(true);
    if (!valid) return;
    if (when === "later" && scheduledAt.getTime() <= new Date().getTime()) {
      setNotice("Cette date est passée entre-temps : choisissez un moment à venir.");
      return;
    }
    if (broadcast) setConfirming(true);
    else send();
  };

  const send = () => {
    const audience = broadcast
      ? `Toutes les clientes (${groupThousands(total)})`
      : addresses.length === 1
        ? addresses[0]
        : `${addresses.length} destinataires`;
    const later = when === "later";
    setHistory((prev) => [
      {
        id: `env-${Date.now()}`,
        at: later ? scheduledAt.toISOString() : new Date().toISOString(),
        scheduled: later,
        channels,
        subject: subject.trim() || plain.slice(0, 60),
        audience,
      },
      ...prev,
    ]);
    const who = `${audience.charAt(0).toLowerCase()}${audience.slice(1)}`;
    setNotice(later ? `Envoi à ${who} programmé ${longWhen(scheduledAt.toISOString())}.` : `Message envoyé à ${who}.`);
    setWhen("now");
    setSchedule(tomorrowAtTen());
    setConfirming(false);
    setTried(false);
    setSubject("");
    setBody("");
    setRecipients("");
    setBroadcast(false);
  };

  const err = (k: keyof typeof errors) =>
    tried && errors[k] ? <p className="mt-1.5 text-sm font-medium text-error">{errors[k]}</p> : null;

  const scheduledList = history.filter((h) => h.scheduled).sort((a, b) => a.at.localeCompare(b.at));
  const sentList = history.filter((h) => !h.scheduled);
  const sendNow = (id: string) => {
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, scheduled: false, at: new Date().toISOString() } : h)));
    setNotice("Message envoyé.");
  };
  const cancelScheduled = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
    setCancelling(null);
    setNotice("Envoi programmé annulé.");
  };

  const channelSummary = channels
    .map((c) => `${CHANNELS.find((x) => x.id === c)!.label} : ${groupThousands(reach[c])}`)
    .join(" · ");

  return (
    <div className="max-w-[1320px]">
      <Button variant="outline" size="sm" href="/messagerie" icon={<ArrowLeft className="size-4" />} className="mb-4">
        Messagerie
      </Button>
      <PageHeader title="Envoyer un message" />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-8">
        {/* --- Formulaire --- */}
        <div className="flex flex-col gap-6">
          <section className="rounded-box border border-base-300 bg-base-100 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-base-content/70">
              <Send className="size-4" /> Canaux d&apos;envoi
            </p>
            <div className="grid grid-cols-3 gap-3" role="group" aria-label="Canaux d'envoi">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={has(c.id)}
                  onClick={() => toggleChannel(c.id)}
                  className={cn(
                    "flex h-12 items-center justify-center gap-2 rounded-field border text-[15px] font-medium transition",
                    has(c.id)
                      ? "border-primary bg-accent text-secondary"
                      : "border-base-300 bg-base-100 text-base-content/60 hover:border-base-content/30 hover:text-base-content",
                  )}
                >
                  {c.icon}
                  {c.label}
                </button>
              ))}
            </div>
            {err("channels")}
          </section>

          <section className="flex items-center justify-between gap-4 rounded-box border border-base-300 bg-base-100 py-1 pr-2 pl-5">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-base-content/60" />
              <div>
                <p className="text-[15px] font-medium text-base-content">Envoyer à toutes les clientes</p>
                <p className="text-sm text-base-content/60">
                  {groupThousands(allClients.length)} fiches dans le fichier
                </p>
              </div>
            </div>
            <Switch checked={broadcast} onChange={setBroadcast} label="Envoyer à toutes les clientes" />
          </section>

          <div>
            <label htmlFor="env-to" className="mb-1.5 block text-sm font-medium text-base-content/70">
              Destinataires
            </label>
            {broadcast ? (
              <p className="rounded-field border border-base-300 bg-base-200 px-4 py-3 text-[15px] text-base-content/70">
                Toutes les clientes joignables — {channelSummary || "choisissez un canal"}
              </p>
            ) : (
              <>
                <TextInput
                  id="env-to"
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                  placeholder="email1@exemple.com, email2@exemple.com"
                />
                <p className="mt-1.5 text-sm text-base-content/60">
                  Séparez les adresses par des virgules.
                  {(has("sms") || has("whatsapp")) &&
                    " Pour le SMS et WhatsApp, le message part au numéro des clientes reconnues par leur adresse."}
                  {addresses.length > 0 && invalid.length === 0 && ` Joignables — ${channelSummary}.`}
                </p>
              </>
            )}
            {err("recipients")}
          </div>

          {has("email") && (
            <div>
              <label htmlFor="env-subject" className="mb-1.5 block text-sm font-medium text-base-content/70">
                Objet
              </label>
              <TextInput
                id="env-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Objet de votre message"
              />
              {err("subject")}
            </div>
          )}

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor="env-body" className="text-sm font-medium text-base-content/70">
                Message
              </label>
              {has("sms") && (
                <span className={cn("text-xs tabular-nums", smsTooLong ? "font-medium text-error" : "text-base-content/50")}>
                  SMS : {plain.length} / {SMS_LIMIT}
                </span>
              )}
            </div>
            <Textarea
              id="env-body"
              rows={12}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Rédigez votre message ici…\n\nLe même texte part par Email, SMS (sans mise en forme) et WhatsApp."}
            />
            {err("body")}
            <details className="mt-2 text-sm text-base-content/60">
              <summary className="cursor-pointer font-medium text-base-content/70">Mise en forme</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li>
                  <code>**gras**</code> → <strong>gras</strong> · <code>*italique*</code> → <em>italique</em>
                </li>
                <li>
                  Lien : <code>[texte affiché](https://exemple.com)</code>
                </li>
                <li>
                  Liste à puces : commencez chaque ligne par <code>-</code>
                </li>
                <li>
                  Titre : <code># Titre</code> · sous-titre : <code>## Sous-titre</code>
                </li>
                <li>Nouveau paragraphe : laissez une ligne vide entre deux blocs.</li>
                <li>
                  Espace vertical : <code>&amp;nbsp;</code> seul sur sa ligne, entouré de lignes vides.
                </li>
              </ul>
              <p className="mt-1.5">Le SMS reçoit le texte sans mise en forme.</p>
            </details>
          </div>

          <section className="rounded-box border border-base-300 bg-base-100 p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-base-content/70">
              <CalendarClock className="size-4" /> Quand l&apos;envoyer ?
            </p>
            <SegmentedToggle
              aria-label="Moment de l'envoi"
              options={[
                { value: "now", label: "Maintenant" },
                { value: "later", label: "Programmer" },
              ]}
              value={when}
              onChange={(v) => setWhen(v as When)}
            />
            {when === "later" && (
              <div className="mt-4 grid grid-cols-[minmax(0,1fr)_160px] gap-3">
                <div>
                  <label htmlFor="env-date" className="mb-1.5 block text-sm font-medium text-base-content/70">
                    Date
                  </label>
                  <TextInput
                    id="env-date"
                    type="date"
                    min={isoDay(new Date(openedAt))}
                    value={schedule.date}
                    onChange={(e) => setSchedule((s) => ({ ...s, date: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="env-time" className="mb-1.5 block text-sm font-medium text-base-content/70">
                    Heure
                  </label>
                  <TextInput
                    id="env-time"
                    type="time"
                    step={300}
                    value={schedule.time}
                    onChange={(e) => setSchedule((s) => ({ ...s, time: e.target.value }))}
                  />
                </div>
                <p className="col-span-2 text-sm text-base-content/60">
                  {scheduleError ? (
                    <span className="font-medium text-error">{scheduleError}</span>
                  ) : (
                    <>Le message partira {longWhen(scheduledAt.toISOString())}. Vous pourrez l&apos;annuler d&apos;ici là.</>
                  )}
                </p>
              </div>
            )}
          </section>

          <Button
            variant="brand"
            icon={when === "later" ? <CalendarClock className="size-5" /> : <Send className="size-5" />}
            onClick={submit}
            className="w-full"
          >
            {when === "later"
              ? broadcast
                ? `Programmer l'envoi à ${groupThousands(total)} clientes`
                : "Programmer l'envoi"
              : broadcast
                ? `Envoyer à ${groupThousands(total)} clientes`
                : "Envoyer"}
          </Button>
        </div>

        {/* --- Aperçu --- */}
        <div className="sticky top-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-medium text-base-content/70">Aperçu</p>
            {channels.length > 1 && (
              <SegmentedToggle
                size="sm"
                aria-label="Canal de l'aperçu"
                options={channels.map((c) => ({ value: c, label: CHANNELS.find((x) => x.id === c)!.label }))}
                value={shown}
                onChange={(v) => setPreviewOf(v as Channel)}
              />
            )}
          </div>
          {shown === "email" ? (
            <EmailPreview subject={subject} body={body} />
          ) : (
            <PhonePreview channel={shown} text={plain} />
          )}
        </div>
      </div>

      {/* --- Historique de la session --- */}
      {scheduledList.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-semibold text-base-content">Envois programmés</h2>
          <ul className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
            {scheduledList.map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <span className="w-56 shrink-0 font-medium text-base-content first-letter:uppercase">{longWhen(h.at)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-base-content">{h.subject}</span>
                  <span className="block truncate text-base-content/60">
                    {h.audience} · {h.channels.map((c) => CHANNELS.find((x) => x.id === c)!.label).join(" · ")}
                  </span>
                </span>
                <span className="flex shrink-0 justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => sendNow(h.id)}>
                    Envoyer maintenant
                  </Button>
                  <Button variant="danger-outline" size="sm" onClick={() => setCancelling(h.id)}>
                    Annuler
                  </Button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-3 text-lg font-semibold text-base-content">Envois récents</h2>
        {sentList.length === 0 ? (
          <p className="rounded-box border border-dashed border-base-300 px-5 py-8 text-center text-sm text-base-content/60">
            Aucun message envoyé pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-base-300 rounded-box border border-base-300 bg-base-100">
            {sentList.map((h) => (
              <li key={h.id} className="flex items-center gap-4 px-5 py-3.5 text-sm">
                <span className="w-32 shrink-0 tabular-nums text-base-content/60">{clock(h.at)}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-base-content">{h.subject}</span>
                <span className="shrink-0 text-base-content/70">{h.audience}</span>
                <span className="w-44 shrink-0 text-right text-base-content/60">
                  {h.channels.map((c) => CHANNELS.find((x) => x.id === c)!.label).join(" · ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={cancelling !== null}
        title="Annuler cet envoi programmé ?"
        description="Le message ne partira pas. Son contenu n'est pas conservé."
        confirmLabel="Annuler l'envoi"
        cancelLabel="Garder"
        onConfirm={() => cancelling && cancelScheduled(cancelling)}
        onCancel={() => setCancelling(null)}
      />
      <ConfirmDialog
        open={confirming}
        tone="success"
        title={
          when === "later"
            ? `Programmer l'envoi à ${groupThousands(total)} clientes ?`
            : `Envoyer à ${groupThousands(total)} clientes ?`
        }
        description={
          when === "later"
            ? `${channelSummary}. Départ ${longWhen(scheduledAt.toISOString())} — annulable d'ici là.`
            : `${channelSummary}. Le message ne pourra pas être rappelé une fois parti.`
        }
        confirmLabel={when === "later" ? "Programmer" : "Envoyer"}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
      <Toast message={notice} onDismiss={() => setNotice(null)} />
    </div>
  );
}

// SMS et WhatsApp : le texte sans mise en forme, dans une bulle de conversation
// (gris pour le SMS, vert WhatsApp) — ce que la cliente lira sur son téléphone.
function PhonePreview({ channel, text }: { channel: "sms" | "whatsapp"; text: string }) {
  const wa = channel === "whatsapp";
  return (
    <div className="rounded-box border border-base-300 bg-base-200 p-6">
      <div className={cn("mx-auto max-w-sm overflow-hidden rounded-[28px] border border-base-300 shadow-sm", wa ? "bg-[#efeae2]" : "bg-base-100")}>
        <div className="flex items-center gap-3 border-b border-base-300 bg-base-100 px-5 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-secondary">B&amp;C</span>
          <div>
            <p className="text-sm font-semibold text-base-content">Beauty &amp; Co</p>
            <p className="text-xs text-base-content/55">{wa ? "WhatsApp" : "SMS"}</p>
          </div>
        </div>
        <div className="min-h-72 px-4 py-5">
          {text ? (
            <p
              className={cn(
                "max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-sm px-4 py-2.5 text-[15px] leading-relaxed text-base-content shadow-sm",
                wa ? "bg-base-100" : "bg-[#e9e9eb]",
              )}
            >
              {text}
            </p>
          ) : (
            <p className="pt-16 text-center text-sm text-base-content/40">Votre message apparaîtra ici…</p>
          )}
        </div>
      </div>
      {!wa && text && (
        <p className="mt-3 text-center text-xs text-base-content/55">
          {text.length} caractères · {Math.max(1, Math.ceil(text.length / 160))} SMS
        </p>
      )}
    </div>
  );
}
