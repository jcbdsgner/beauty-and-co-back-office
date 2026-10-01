"use client";

import { useEffect, useRef } from "react";
import { FileUser } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import {
  channelLabel,
  displayName,
  formatClock,
  groupEventsByDay,
  initials,
  messageStatusLabel,
  salonName,
  type Conversation,
  type MessageEvent,
  type WritableChannel,
} from "@/lib/mock/messagerie";
import MessageComposer from "./MessageComposer";
import { ChannelIcon, ImageGlyph } from "./glyphs";

function MessageBubble({ event }: { event: MessageEvent }) {
  const out = event.direction === "out";
  const failed = event.status === "failed";

  return (
    <div className={`my-1.5 flex ${out ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[76%]">
        <div
          className={`rounded-box px-4 py-2.5 text-sm ${
            out
              ? "rounded-br-sm bg-brand-500 text-white"
              : "rounded-bl-sm bg-white text-base-content"
          }`}
        >
          {event.attachment ? (
            <span className="flex items-center gap-2">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                  out ? "bg-white/20 text-white" : "bg-muted text-base-content/45"
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
          className={`mt-1 flex items-center gap-1 text-xs text-base-content/45 ${
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

export default function ConversationThread({
  conversation,
  onSend,
}: {
  conversation: Conversation;
  onSend: (text: string, channel: WritableChannel) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const groups = groupEventsByDay(conversation.events);

  // Toujours montrer le dernier message quand on ouvre / répond.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation.id, conversation.events.length]);

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col rounded-box border border-base-300 bg-white">
      {/* En-tête de la conversation */}
      <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
              conversation.name ? "bg-accent text-brand-600" : "bg-muted text-base-content/45"
            }`}
          >
            {initials(conversation.name)}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-base-content">
              {displayName(conversation)}
            </h2>
            <p className="truncate text-xs text-base-content/60">
              {conversation.phone} · {salonName(conversation.salon)}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {/* Fiche cliente : ouverte en panneau latéral (route interceptée). */}
          {conversation.clientId && (
            <Button
              href={`/clients/${conversation.clientId}`}
              variant="outline"
              size="sm"
              icon={<FileUser className="h-4 w-4" />}
              className="mr-2"
            >
              Voir la fiche
            </Button>
          )}
          {conversation.channels.map((ch) => (
            <span
              key={ch}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-base-content/60"
            >
              <ChannelIcon channel={ch} className="h-3 w-3" />
              {channelLabel[ch]}
            </span>
          ))}
        </div>
      </div>

      {/* Fil */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-base-200 px-6 py-4">
        {groups.map((group) => (
          <div key={group.key}>
            <div className="my-4 flex justify-center">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-base-content/60">
                {group.label}
              </span>
            </div>
            {group.events.map((event) => (
              <MessageBubble key={event.id} event={event} />
            ))}
          </div>
        ))}
      </div>

      {/* Réponse */}
      <MessageComposer conversation={conversation} onSend={onSend} />
    </div>
  );
}
