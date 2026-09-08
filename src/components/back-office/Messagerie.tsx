"use client";

import { useMemo, useState } from "react";
import { useLocation } from "@/context/LocationContext";
import { salonName } from "@/lib/mock/beautyandco";
import {
  conversations as baseConversations,
  lastEvent,
  type ChannelFilter,
  type Conversation,
  type ThreadEvent,
  type WritableChannel,
} from "@/lib/mock/messagerie";
import ConversationList from "./messagerie/ConversationList";
import ConversationThread from "./messagerie/ConversationThread";

const digits = (s: string) => s.replace(/\D/g, "");

export default function Messagerie() {
  const { scope } = useLocation();

  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(baseConversations[0]?.id);
  // Réponses envoyées pendant la session — aucune persistance, purement local.
  const [drafts, setDrafts] = useState<Record<string, ThreadEvent[]>>({});

  const withDrafts = useMemo<Conversation[]>(
    () =>
      baseConversations.map((c) =>
        drafts[c.id]?.length ? { ...c, events: [...c.events, ...drafts[c.id]] } : c,
      ),
    [drafts],
  );

  // Filtre salon global (comme le tableau de bord).
  const inScope = useMemo(
    () => withDrafts.filter((c) => scope === "all" || c.salon === scope),
    [withDrafts, scope],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const qDigits = digits(query);
    return inScope
      .filter((c) => channel === "all" || c.channels.includes(channel))
      .filter((c) => {
        if (!q) return true;
        const byName = c.name.toLowerCase().includes(q);
        const byPhone = qDigits.length > 0 && digits(c.phone).includes(qDigits);
        return byName || byPhone;
      })
      .sort((a, b) => lastEvent(b).at.localeCompare(lastEvent(a).at));
  }, [inScope, channel, query]);

  const selected =
    filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? undefined;

  const handleSend = (text: string, ch: WritableChannel) => {
    if (!selected) return;
    const event: ThreadEvent = {
      kind: "message",
      id: `draft-${selected.id}-${Date.now()}`,
      channel: ch,
      direction: "out",
      at: new Date().toISOString(),
      text,
      status: "sent",
    };
    setDrafts((prev) => ({
      ...prev,
      [selected.id]: [...(prev[selected.id] ?? []), event],
    }));
  };

  return (
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[540px] gap-6">
      <ConversationList
        items={filtered}
        selectedId={selected?.id}
        onSelect={setSelectedId}
        query={query}
        onQuery={setQuery}
        channel={channel}
        onChannel={setChannel}
        scopeLabel={scope === "all" ? undefined : salonName(scope)}
        hasConversations={inScope.length > 0}
      />

      {selected ? (
        <ConversationThread
          key={selected.id}
          conversation={selected}
          onSend={handleSend}
        />
      ) : (
        <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white text-center">
          <p className="text-theme-sm font-medium text-gray-700">
            Aucune conversation sélectionnée
          </p>
          <p className="mt-1 text-theme-xs text-gray-400">
            Choisissez une conversation dans la liste pour l&apos;afficher ici.
          </p>
        </div>
      )}
    </div>
  );
}
