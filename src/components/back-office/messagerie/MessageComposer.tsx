"use client";

import { useMemo, useState } from "react";
import { PaperPlaneIcon } from "@/icons";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import {
  channelLabel,
  smsOutboundAvailable,
  writableChannels,
  type Conversation,
  type MessageEvent,
  type WritableChannel,
} from "@/lib/mock/messagerie";
import { WarningGlyph } from "./glyphs";

type Props = {
  conversation: Conversation;
  onSend: (text: string, channel: WritableChannel) => void;
};

// Canal de réponse par défaut : celui du dernier message entrant, sinon le
// premier canal écrit disponible. Si c'est le SMS et qu'il est coupé, on bascule
// sur WhatsApp quand la cliente en a un.
function preferredChannel(conversation: Conversation): WritableChannel {
  const writable = writableChannels(conversation);
  const lastInbound = [...conversation.events]
    .reverse()
    .find((e): e is MessageEvent => e.kind === "message" && e.direction === "in");
  const base =
    lastInbound && writable.includes(lastInbound.channel) ? lastInbound.channel : writable[0];
  if (base === "sms" && !smsOutboundAvailable && writable.includes("whatsapp")) return "whatsapp";
  return base;
}

export default function MessageComposer({ conversation, onSend }: Props) {
  const writable = useMemo(() => writableChannels(conversation), [conversation]);
  const [channel, setChannel] = useState<WritableChannel>(() => preferredChannel(conversation));
  const [text, setText] = useState("");

  // Canaux proposés dans la bascule : on masque le SMS quand il est coupé et
  // qu'une alternative existe. S'il ne reste que le SMS, on le garde visible
  // mais le champ est verrouillé et la panne expliquée.
  const offered =
    writable.filter((ch) => ch !== "sms" || smsOutboundAvailable).length > 0
      ? writable.filter((ch) => ch !== "sms" || smsOutboundAvailable)
      : writable;

  const blocked = channel === "sms" && !smsOutboundAvailable;
  const canSend = text.trim().length > 0 && !blocked;

  const submit = () => {
    if (!canSend) return;
    onSend(text.trim(), channel);
    setText("");
  };

  return (
    <div className="border-t border-base-300 px-6 py-4">
      {blocked && (
        <div className="mb-3 flex items-start gap-2 rounded-lg border border-warning-500 bg-warning-50 px-3 py-2 text-xs text-base-content/80">
          <WarningGlyph className="mt-0.5 h-4 w-4 shrink-0 text-warning-500" />
          <span>
            L&apos;envoi de SMS est momentanément indisponible (vérification opérateur en cours).
            {writable.includes("whatsapp")
              ? " Répondez par WhatsApp en attendant."
              : " Cette cliente n'a pas de WhatsApp connu — le service sera rétabli sous peu."}
          </span>
        </div>
      )}

      {offered.length > 1 && (
        <div className="mb-3">
          <SegmentedControl
            size="sm"
            options={offered.map((ch) => ({ value: ch, label: channelLabel[ch] }))}
            value={channel}
            onChange={setChannel}
            aria-label="Canal de réponse"
          />
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          disabled={blocked}
          placeholder={
            blocked
              ? "Réponse par SMS indisponible pour le moment"
              : `Répondre par ${channelLabel[channel]}…`
          }
          aria-label={`Répondre par ${channelLabel[channel]}`}
          className="max-h-40 min-h-[44px] flex-1 resize-none rounded-field border border-base-300 bg-white px-3 py-2.5 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca] disabled:cursor-not-allowed disabled:bg-base-200 disabled:text-base-content/45"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label="Envoyer le message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-brand-300"
        >
          <PaperPlaneIcon className="h-5 w-5" />
        </button>
      </div>

      <p className="mt-2 text-xs text-base-content/45">⌘ + Entrée pour envoyer</p>
    </div>
  );
}
