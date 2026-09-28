"use client";

import { useState } from "react";
import { PhoneInput } from "@/components/prise-rdv/phone-input";
import { StepFooter } from "@/components/prise-rdv/steps/step-footer";
import { findCountry } from "@/lib/prise-rdv/data/countries";
import type { PersonTab } from "@/lib/prise-rdv/types";
import {
  ETHNICITY_OPTIONS,
  MONTH_NAMES,
  clientFullName,
  toBirthday,
  type Cliente,
  type Ethnicity,
} from "@/lib/prise-rdv/clientes";
import { cn } from "@/lib/prise-rdv/utils";

/**
 * La seule étape du parcours qui n'existe pas sur le site b&co (ADR 0032) : au lieu de se
 * connecter, la réceptionniste retrouve la payeuse parmi les clientes — puis, si elle le souhaite,
 * les autres personnes de la réservation (une fiche, ou un simple prénom). Mêmes blocs, mêmes
 * champs que l'étape « Informations » du site qu'elle remplace.
 */

/** Qui occupe une place de la réservation : une fiche connue, ou juste un prénom. */
export type PersonAssignment = { clientId?: string; name?: string };

type ClientesStepProps = {
  /** Les places à renseigner, la payeuse en premier. */
  slots: PersonTab[];
  payerSlotId: string;
  assignments: Record<string, PersonAssignment>;
  clients: Cliente[];
  onAssign: (slotId: string, assignment: PersonAssignment) => void;
  onCreateClient: (data: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    birthday: string;
    ethnicity: Ethnicity;
  }) => Cliente;
  canContinue: boolean;
  onContinue: () => void;
  onBack: () => void;
};

const inputClassName =
  "h-12 w-full rounded-full border border-[var(--color-border-light)] bg-white px-4 text-[17px] text-[var(--color-ink)] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] outline-none focus:border-[var(--brand-taupe-muted)]";
const labelClassName = "text-[17px] font-bold text-[var(--color-text-tertiary)]";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** N° client (code fidélité), nom, email ou téléphone — les quatre entrées demandées. */
function searchClients(clients: Cliente[], query: string): Cliente[] {
  const q = normalize(query);
  if (q.length < 2) return [];
  const digits = query.replace(/\D/g, "");
  return clients
    .filter((c) => {
      if (normalize(`${c.firstName} ${c.lastName}`).includes(q) || normalize(`${c.lastName} ${c.firstName}`).includes(q)) return true;
      if (normalize(c.loyaltyCode).includes(q)) return true;
      if (c.email && normalize(c.email).includes(q)) return true;
      return digits.length >= 3 && c.phone.replace(/\D/g, "").includes(digits);
    })
    .slice(0, 6);
}

function Initials({ client }: { client: Cliente }) {
  return (
    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[rgba(237,220,218,0.6)] text-[17px] font-bold text-[var(--brand-taupe-muted)]">
      {client.firstName.charAt(0)}
      {client.lastName.charAt(0)}
    </span>
  );
}

function ClientMeta({ client }: { client: Cliente }) {
  return (
    <p className="truncate text-[15px] text-[var(--color-gray-500)]">
      N° {client.loyaltyCode} · {client.phone}
      {client.email ? ` · ${client.email}` : ""}
    </p>
  );
}

function CreateClientForm({
  slotId,
  initialQuery,
  onCreate,
  onCancel,
}: {
  slotId: string;
  initialQuery: string;
  onCreate: (data: Parameters<ClientesStepProps["onCreateClient"]>[0]) => void;
  onCancel: () => void;
}) {
  const looksLikePhone = /\d{3,}/.test(initialQuery);
  const [firstName, setFirstName] = useState(looksLikePhone || initialQuery.includes("@") ? "" : initialQuery.split(" ")[0] ?? "");
  const [lastName, setLastName] = useState(looksLikePhone || initialQuery.includes("@") ? "" : initialQuery.split(" ").slice(1).join(" "));
  const [phoneCountry, setPhoneCountry] = useState("SN");
  const [phone, setPhone] = useState(looksLikePhone ? initialQuery.replace(/\D/g, "") : "");
  const [email, setEmail] = useState(initialQuery.includes("@") ? initialQuery.trim() : "");
  const [birthDay, setBirthDay] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [ethnicity, setEthnicity] = useState("");
  const valid =
    firstName.trim() &&
    lastName.trim() &&
    phone.replace(/\D/g, "").length >= 6 &&
    email.trim() &&
    birthDay &&
    birthMonth &&
    ethnicity;
  const id = (name: string) => `${name}-${slotId}`;

  return (
    <div className="mt-4 rounded-2xl bg-[rgba(253,207,202,0.15)] p-5">
      <p className="text-[19px] font-bold text-[var(--color-gray-900)]">Nouvelle fiche cliente</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={id("new-first")} className={labelClassName}>
            Prénom *
          </label>
          <input id={id("new-first")} value={firstName} onChange={(e) => setFirstName(e.target.value)} className={cn("mt-2", inputClassName)} />
        </div>
        <div>
          <label htmlFor={id("new-last")} className={labelClassName}>
            Nom *
          </label>
          <input id={id("new-last")} value={lastName} onChange={(e) => setLastName(e.target.value)} className={cn("mt-2", inputClassName)} />
        </div>
        <div>
          <label htmlFor={id("new-phone")} className={labelClassName}>
            Téléphone *
          </label>
          <PhoneInput id={id("new-phone")} countryCode={phoneCountry} onCountryChange={setPhoneCountry} value={phone} onChange={setPhone} />
        </div>
        <div>
          <label htmlFor={id("new-email")} className={labelClassName}>
            Adresse email *
          </label>
          <input id={id("new-email")} type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={cn("mt-2", inputClassName)} />
        </div>
        <div>
          <label htmlFor={id("new-birth-day")} className={labelClassName}>
            Anniversaire *
          </label>
          <div className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3">
            <select
              id={id("new-birth-day")}
              aria-label="Jour"
              value={birthDay}
              onChange={(e) => setBirthDay(e.target.value)}
              className={inputClassName}
            >
              <option value="">Jour</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {i + 1}
                </option>
              ))}
            </select>
            <select aria-label="Mois" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={inputClassName}>
              <option value="">Mois</option>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name[0].toUpperCase() + name.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor={id("new-ethnicity")} className={labelClassName}>
            Ethnicité *
          </label>
          <select
            id={id("new-ethnicity")}
            value={ethnicity}
            onChange={(e) => setEthnicity(e.target.value)}
            className={cn("mt-2", inputClassName)}
          >
            <option value="">Choisir…</option>
            {ETHNICITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-3 text-[17px] font-bold text-[var(--brand-taupe-muted)] hover:bg-black/[.03]">
          Annuler
        </button>
        <button
          type="button"
          disabled={!valid}
          onClick={() =>
            onCreate({
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              phone: `+${findCountry(phoneCountry)?.dialCode ?? "221"}${phone.replace(/\D/g, "")}`,
              email: email.trim(),
              birthday: toBirthday(Number(birthDay), Number(birthMonth)),
              ethnicity: ethnicity as Ethnicity,
            })
          }
          className="shrink-0 rounded-full bg-[var(--core-brand-color)] px-5 py-3 text-[17px] font-[450] text-black shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] transition hover:opacity-90 disabled:opacity-50"
        >
          Créer et sélectionner
        </button>
      </div>
    </div>
  );
}

function PersonBlock({
  slot,
  isPayer,
  assignment,
  clients,
  takenClientIds,
  onAssign,
  onCreateClient,
}: {
  slot: PersonTab;
  isPayer: boolean;
  assignment: PersonAssignment | undefined;
  clients: Cliente[];
  takenClientIds: Set<string>;
  onAssign: (assignment: PersonAssignment) => void;
  onCreateClient: ClientesStepProps["onCreateClient"];
}) {
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const selected = assignment?.clientId ? clients.find((c) => c.id === assignment.clientId) : undefined;
  const results = searchClients(clients, query).filter((c) => !takenClientIds.has(c.id));

  return (
    <div className="rounded-2xl border border-[var(--color-gray-200)] bg-white p-[25px]">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <h3 className="text-[21px] font-bold text-[var(--color-gray-800)]">{slot.label}</h3>
        {isPayer ? (
          <span className="rounded-full bg-[rgba(237,220,218,0.5)] px-3 py-1 text-[13px] font-[450] text-[var(--brand-taupe-muted)]">
            Payeuse
          </span>
        ) : (
          <span className="text-[15px] text-[var(--color-gray-500)]">(optionnel)</span>
        )}
      </div>

      {selected ? (
        <div className="flex items-center gap-4 rounded-2xl border-[1.5px] border-[var(--core-brand-color)] bg-[rgba(253,207,202,0.12)] p-4">
          <Initials client={selected} />
          <div className="min-w-0 flex-1">
            <p className="text-[19px] font-bold text-[var(--color-gray-900)]">{clientFullName(selected)}</p>
            <ClientMeta client={selected} />
          </div>
          <button
            type="button"
            onClick={() => onAssign({})}
            className="shrink-0 rounded-full border border-[rgba(136,102,102,0.3)] px-4 py-2 text-[17px] font-bold text-[var(--brand-taupe-muted)] hover:bg-black/[.02]"
          >
            Changer
          </button>
        </div>
      ) : (
        <>
          <label htmlFor={`search-${slot.id}`} className={labelClassName}>
            {isPayer ? "Rechercher la cliente *" : "Rechercher une cliente"}
          </label>
          <input
            id={`search-${slot.id}`}
            type="text"
            autoComplete="off"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setCreating(false);
            }}
            placeholder="N° client, nom, email ou téléphone"
            className={cn("mt-2", inputClassName)}
          />

          {results.length > 0 && (
            <ul className="mt-3 flex flex-col gap-2">
              {results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    onClick={() => onAssign({ clientId: client.id })}
                    className="flex w-full items-center gap-4 rounded-2xl border-[1.5px] border-[var(--color-gray-100)] p-3 text-left transition hover:border-[var(--core-brand-color)] hover:bg-[rgba(253,207,202,0.08)]"
                  >
                    <Initials client={client} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[17px] font-bold text-[var(--color-gray-900)]">{clientFullName(client)}</span>
                      <ClientMeta client={client} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {query.trim().length >= 2 && results.length === 0 && !creating && (
            <p className="mt-3 text-[17px] text-[var(--color-gray-500)]">Aucune cliente ne correspond.</p>
          )}

          {creating ? (
            <CreateClientForm
              slotId={slot.id}
              initialQuery={query}
              onCancel={() => setCreating(false)}
              onCreate={(data) => {
                const client = onCreateClient(data);
                setCreating(false);
                setQuery("");
                onAssign({ clientId: client.id });
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="mt-4 text-[17px] font-bold text-[var(--button-2-color)] underline underline-offset-4"
            >
              + Créer une fiche cliente
            </button>
          )}

          {!isPayer && !creating && (
            <div className="mt-6">
              <label htmlFor={`name-${slot.id}`} className={labelClassName}>
                … ou simplement un prénom
              </label>
              <input
                id={`name-${slot.id}`}
                value={assignment?.name ?? ""}
                onChange={(event) => onAssign(event.target.value ? { name: event.target.value } : {})}
                placeholder={slot.type === "child" ? "Ex. Salématou (7 ans)" : "Ex. Awa (amie)"}
                className={cn("mt-2 sm:max-w-[420px]", inputClassName)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ClientesStep({
  slots,
  payerSlotId,
  assignments,
  clients,
  onAssign,
  onCreateClient,
  canContinue,
  onContinue,
  onBack,
}: ClientesStepProps) {
  return (
    <div>
      <h2 className="text-[21px] font-bold text-[var(--color-gray-800)]">Pour qui est ce rendez-vous ?</h2>
      <p className="mt-1 text-[19px] text-[var(--color-gray-500)]">
        Retrouvez la cliente qui règle, puis, si vous le souhaitez, les autres personnes.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {slots.map((slot) => {
          const takenClientIds = new Set(
            Object.entries(assignments)
              .filter(([id, a]) => id !== slot.id && a.clientId)
              .map(([, a]) => a.clientId as string),
          );
          return (
            <PersonBlock
              key={slot.id}
              slot={slot}
              isPayer={slot.id === payerSlotId}
              assignment={assignments[slot.id]}
              clients={clients}
              takenClientIds={takenClientIds}
              onAssign={(assignment) => onAssign(slot.id, assignment)}
              onCreateClient={onCreateClient}
            />
          );
        })}
      </div>

      <div className="mt-8">
        <StepFooter onBack={onBack} onContinue={onContinue} continueDisabled={!canContinue} />
      </div>
    </div>
  );
}
