"use client";

import { useState } from "react";
import { fieldClass } from "./ui";
import { SaveBar, SavedNote, SettingsGroup, SettingsRow } from "../kit";

// Réglages › Emails › lien du site. Le moment d'envoi de chaque email se règle
// désormais modèle par modèle (voir `SendSettings`, 2026-09-28) : les anciens
// délais « premier / second rappel / remerciement » sont devenus des modèles.

export default function SettingsCards({
  siteLink,
  onSaveSiteLink,
}: {
  siteLink: string;
  onSaveSiteLink: (v: string) => void;
}) {
  const [draft, setDraft] = useState(siteLink);
  const [justSaved, setJustSaved] = useState(false);
  const dirty = draft.trim() !== siteLink;
  const linkInvalid = draft.trim() !== "" && !/^https?:\/\/\S+\.\S+/.test(draft.trim());

  return (
    <div>
      <SettingsGroup title="Général">
        <SettingsRow
          label="Lien du site"
          htmlFor="site-link"
          help={
            linkInvalid ? (
              <span className="text-error-600">Adresse incomplète : elle doit commencer par https://</span>
            ) : (
              "Ouvert par le bouton « site web » au bas de chaque email."
            )
          }
          wide
        >
          <input
            id="site-link"
            type="text"
            inputMode="url"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setJustSaved(false);
            }}
            placeholder="https://…"
            aria-invalid={linkInvalid || undefined}
            className={`${fieldClass} ${linkInvalid ? "border-error-500" : ""}`}
          />
        </SettingsRow>
      </SettingsGroup>

      <SavedNote show={justSaved && !dirty} />
      <SaveBar
        dirty={dirty}
        blocked={linkInvalid ? "Corrigez le lien du site avant d'enregistrer." : null}
        onReset={() => setDraft(siteLink)}
        onSave={() => {
          onSaveSiteLink(draft.trim());
          setJustSaved(true);
        }}
      />
    </div>
  );
}
