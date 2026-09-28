"use client";

import { useState } from "react";
import { ChatIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import SegmentedControl from "@/components/ui/segmented/SegmentedControl";
import {
  channelFilters,
  displayName,
  failedOutbound,
  formatListStamp,
  initials,
  lastChannelOf,
  lastEvent,
  needsReply,
  previewText,
  type ChannelFilter,
  type Conversation,
} from "@/lib/mock/messagerie";
import { ChannelIcon, RefreshGlyph, SearchGlyph } from "./glyphs";

type Props = {
  items: Conversation[]; // déjà filtrées + triées (récent en tête)
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  query: string;
  onQuery: (value: string) => void;
  channel: ChannelFilter;
  onChannel: (value: ChannelFilter) => void;
  scopeLabel?: string; // nom du salon quand le filtre global cible un seul salon
  hasConversations: boolean; // au moins une conversation avant filtres canal / recherche
};

function StatusBadge({ conversation }: { conversation: Conversation }) {
  if (failedOutbound(conversation))
    return (
      <Badge size="sm" color="error">
        Échec d&apos;envoi
      </Badge>
    );
  if (needsReply(conversation))
    return (
      <Badge size="sm" color="warning">
        À répondre
      </Badge>
    );
  return null;
}

export default function ConversationList({
  items,
  selectedId,
  onSelect,
  query,
  onQuery,
  channel,
  onChannel,
  scopeLabel,
  hasConversations,
}: Props) {
  const [spinning, setSpinning] = useState(false);

  const refresh = () => {
    setSpinning(true);
    window.setTimeout(() => setSpinning(false), 600);
  };

  return (
    <div className="flex h-full w-[360px] shrink-0 flex-col rounded-box border border-base-300 bg-white">
      {/* En-tête : titre + recherche + filtre par canal */}
      <div className="border-b border-base-300 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChatIcon className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-base-content">Conversations</h2>
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Actualiser la liste"
            className="text-base-content/45 transition-colors hover:text-base-content/70"
          >
            <RefreshGlyph className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
          </button>
        </div>

        {scopeLabel && (
          <p className="mt-0.5 text-xs text-base-content/45">{scopeLabel}</p>
        )}

        <div className="relative mt-3">
          <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher (nom ou téléphone)…"
            aria-label="Rechercher une conversation"
            className="h-10 w-full rounded-field border border-base-300 bg-white pl-9 pr-3 text-sm text-base-content placeholder:text-base-content/40 focus:outline-2 focus:outline-offset-2 focus:outline-[#fdcfca]"
          />
        </div>

        <div className="mt-3 overflow-x-auto no-scrollbar">
          <SegmentedControl
            size="sm"
            options={channelFilters}
            value={channel}
            onChange={onChannel}
            aria-label="Filtrer par canal"
          />
        </div>
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <p className="text-sm font-medium text-base-content/80">
            {hasConversations ? "Aucune conversation ne correspond" : "Aucune conversation"}
          </p>
          <p className="mt-1 text-xs text-base-content/45">
            {hasConversations
              ? "Modifiez le canal ou la recherche."
              : "Les SMS et messages WhatsApp des clientes s'afficheront ici."}
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-base-300 overflow-y-auto">
          {items.map((c) => {
            const active = c.id === selectedId;
            const unread = needsReply(c);
            const last = lastEvent(c);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                    active ? "bg-accent/60" : "hover:bg-base-200"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                      c.name ? "bg-accent text-brand-600" : "bg-muted text-base-content/45"
                    }`}
                  >
                    {initials(c.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-sm ${
                          unread ? "font-semibold text-base-content" : "font-medium text-base-content"
                        }`}
                      >
                        {displayName(c)}
                      </span>
                      <span className="shrink-0 text-xs text-base-content/45">
                        {formatListStamp(last.at)}
                      </span>
                    </span>

                    <span className="mt-0.5 flex items-center gap-1.5">
                      <ChannelIcon
                        channel={lastChannelOf(c)}
                        className="h-3.5 w-3.5 shrink-0 text-base-content/45"
                      />
                      <span
                        className={`truncate text-xs ${
                          unread ? "text-base-content/70" : "text-base-content/60"
                        }`}
                      >
                        {previewText(c)}
                      </span>
                    </span>

                    {(failedOutbound(c) || needsReply(c)) && (
                      <span className="mt-1.5 flex">
                        <StatusBadge conversation={c} />
                      </span>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
