"use client";

import { useEffect, useRef } from "react";
import {
  channelLabel,
  displayName,
  formatClock,
  formatDuration,
  groupEventsByDay,
  initials,
  messageStatusLabel,
  salonName,
  writableChannels,
  type CallEvent,
  type Conversation,
  type MessageEvent,
  type ThreadEvent,
  type WritableChannel,
} from "@/lib/mock/messagerie";
import MessageComposer from "./MessageComposer";
import { ChannelIcon, ImageGlyph, PhoneGlyph } from "./glyphs";

const CALL_TITLE: Record<string, string> = {
  "in-answered": "Appel reçu",
  "in-missed": "Appel manqué",
  "out-answered": "Appel passé",
  "out-missed": "Appel non abouti",
};

function CallRow({ event }: { event: CallEvent }) {
  const missed = event.outcome === "missed";
  const title = CALL_TITLE[`${event.direction}-${event.outcome}`];
  const duration = formatDuration(event.durationSec);

  return (
    <div className="my-2 flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          missed ? "bg-error-50 text-error-500" : "bg-brand-50 text-brand-700"
        }`}
      >
        <PhoneGlyph className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-theme-sm font-medium text-gray-800">{title}</p>
        <p className="text-theme-xs text-gray-400">
          {formatClock(event.at)}
          {duration ? ` · ${duration}` : ""}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({ event }: { event: MessageEvent }) {
  const out = event.direction === "out";
  const failed = event.status === "failed";

  return (
    <div className={`my-1.5 flex ${out ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[76%]">
        <div
          className={`rounded-2xl px-4 py-2.5 text-theme-sm ${
            out
              ? "rounded-br-sm bg-brand-500 text-white"
              : "rounded-bl-sm bg-white text-gray-800 shadow-theme-xs"
          }`}
        >
          {event.attachment ? (
            <span className="flex items-center gap-2">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  out ? "bg-white/20 text-white" : "bg-gray-100 text-gray-400"
                }`}
              >
                <ImageGlyph className="h-4 w-4" />
              </span>
              <span className="truncate">{event.attachment.name}</span>
            </span>
          ) : (
            <p className="whitespace-pre-wrap">{event.text}</p>
          )}
        </div>

        <div
          className={`mt-1 flex items-center gap-1 text-theme-xs text-gray-400 ${
            out ? "justify-end" : "justify-start"
          }`}
        >
          {!out && <ChannelIcon channel={event.channel} className="h-3 w-3" />}
          <span>{formatClock(event.at)}</span>
          {out && event.status && (
            <span className={failed ? "text-error-500" : undefined}>
              · {messageStatusLabel[event.status]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ThreadEventRow({ event }: { event: ThreadEvent }) {
  return event.kind === "call" ? (
    <CallRow event={event} />
  ) : (
    <MessageBubble event={event} />
  );
}

export default function ConversationThread({
  conversation,
  onSend,
}: {
  conversation: Conversation;
  onSend: (text: string, channel: WritableChannel) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const writable = writableChannels(conversation);
  const groups = groupEventsByDay(conversation.events);

  // Toujours montrer le dernier message quand on ouvre / répond.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, conversation.events.length]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col rounded-2xl border border-gray-200 bg-white">
      {/* En-tête de la conversation */}
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-theme-sm font-semibold ${
              conversation.name ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400"
            }`}
          >
            {initials(conversation.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-gray-800">
              {displayName(conversation)}
            </h2>
            <p className="truncate text-theme-xs text-gray-500">
              {conversation.phone} · {salonName(conversation.salon)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {conversation.channels.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-theme-xs text-gray-500"
            >
              <ChannelIcon channel={ch} className="h-3 w-3" />
              {channelLabel[ch]}
            </span>
          ))}
        </div>
      </div>

      {/* Fil */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-gray-50 px-6 py-4">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="my-4 flex justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-theme-xs font-medium text-gray-500 shadow-theme-xs">
                {group.label}
              </span>
            </div>
            {group.events.map((event) => (
              <ThreadEventRow key={event.id} event={event} />
            ))}
          </div>
        ))}
      </div>

      {/* Réponse */}
      {writable.length === 0 ? (
        <div className="border-t border-gray-100 px-6 py-4">
          <p className="text-theme-sm text-gray-500">
            Aucune conversation écrite avec ce numéro.
          </p>
          <span className="mt-2 inline-flex cursor-default items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-sm font-medium text-gray-700">
            <PhoneGlyph className="h-4 w-4" />
            Rappeler le {conversation.phone}
          </span>
        </div>
      ) : (
        <MessageComposer conversation={conversation} onSend={onSend} />
      )}
    </div>
  );
}
