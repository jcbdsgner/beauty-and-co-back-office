"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocation } from "@/context/LocationContext";
import { salonName } from "@/lib/mock/beautyandco";
import {
  conversationByClientId,
  conversations as baseConversations,
  lastEvent,
  type ChannelFilter,
  type Conversation,
  type ThreadEvent,
  type WritableChannel,
} from "@/lib/mock/messagerie";
import ConversationList from "./messagerie/ConversationList";
import ConversationThread from "./messagerie/ConversationThread";
import PageHeader from "./PageHeader";

const digits = (s: string) => s.replace(/\D/g, "");

export default function Messagerie() {
  const { scope, setScope } = useLocation();
  const searchParams = useSearchParams();

  // ?client=<id> — arrivée depuis « Voir les échanges » sur une fiche cliente
  // (ClientDetailModal). Sélectionne son fil et bascule sur « Tous les salons »
  // si besoin pour qu'il reste visible, quel que soit le filtre en cours.
  const clientParam = searchParams.get("client");
  const [consumedClientParam, setConsumedClientParam] = useState<string | null>(null);
  if (clientParam && clientParam !== consumedClientParam) {
    setConsumedClientParam(clientParam);
    const target = conversationByClientId(clientParam);
    if (target) {
      if (scope !== "all" && target.salon !== scope) setScope("all");
    }
  }

  const [channel, setChannel] = useState<ChannelFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | undefined>(
    (clientParam && conversationByClientId(clientParam)?.id) || baseConversations[0]?.id,
  );
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
    <div className="flex h-[calc(100vh-7.5rem)] min-h-[540px] flex-col">
      <PageHeader title="Messagerie" />
      <div className="flex min-h-0 flex-1 gap-6">
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
          <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-center rounded-box border border-base-300 bg-white text-center">
            <p className="text-sm font-medium text-base-content/80">
              Aucune conversation sélectionnée
            </p>
            <p className="mt-1 text-xs text-base-content/45">
              Choisissez une conversation dans la liste pour l&apos;afficher ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
