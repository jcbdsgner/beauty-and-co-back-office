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
  missedCall,
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
  if (missedCall(conversation))
    return (
      <Badge size="sm" color="error">
        Appel manqué
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
    <div className="flex h-full w-[360px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-white">
      {/* En-tête : titre + recherche + filtre par canal */}
      <div className="border-b border-gray-100 px-4 pb-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChatIcon className="h-5 w-5 text-brand-500" />
            <h2 className="text-lg font-semibold text-gray-800">Messagerie</h2>
          </div>
          <button
            type="button"
            onClick={refresh}
            aria-label="Actualiser la liste"
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <RefreshGlyph className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
          </button>
        </div>

        {scopeLabel && (
          <p className="mt-0.5 text-theme-xs text-gray-400">{scopeLabel}</p>
        )}

        <div className="relative mt-3">
          <SearchGlyph className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Rechercher (nom ou téléphone)…"
            aria-label="Rechercher une conversation"
            className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-theme-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10"
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
          <p className="text-theme-sm font-medium text-gray-700">
            {hasConversations ? "Aucune conversation ne correspond" : "Aucune conversation"}
          </p>
          <p className="mt-1 text-theme-xs text-gray-400">
            {hasConversations
              ? "Modifiez le canal ou la recherche."
              : "Les appels et messages des clientes s'afficheront ici."}
          </p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
          {items.map((c) => {
            const active = c.id === selectedId;
            const unread = needsReply(c) || missedCall(c);
            const last = lastEvent(c);
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex w-full gap-3 px-4 py-3 text-left transition-colors ${
                    active ? "bg-brand-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-theme-sm font-semibold ${
                      c.name ? "bg-brand-50 text-brand-600" : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {initials(c.name)}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span
                        className={`truncate text-theme-sm ${
                          unread ? "font-semibold text-gray-900" : "font-medium text-gray-800"
                        }`}
                      >
                        {displayName(c)}
                      </span>
                      <span className="shrink-0 text-theme-xs text-gray-400">
                        {formatListStamp(last.at)}
                      </span>
                    </span>

                    <span className="mt-0.5 flex items-center gap-1.5">
                      <ChannelIcon
                        channel={lastChannelOf(c)}
                        className="h-3.5 w-3.5 shrink-0 text-gray-400"
                      />
                      <span
                        className={`truncate text-theme-xs ${
                          unread ? "text-gray-600" : "text-gray-500"
                        }`}
                      >
                        {previewText(c)}
                      </span>
                    </span>

                    {(failedOutbound(c) || missedCall(c) || needsReply(c)) && (
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
