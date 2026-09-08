"use client";

import { useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import {
  defaultAutomation,
  defaultSiteLink,
  defaultTemplates,
  type EmailAutomation,
  type EmailTemplate,
} from "@/lib/mock/emails";
import SettingsCards from "./emails/SettingsCards";
import TemplateList from "./emails/TemplateList";
import TemplateEditorPanel, { type EditorTarget } from "./emails/TemplateEditorPanel";

export default function EmailTemplates() {
  // Aucun backend : tout est édité en mémoire de session, comme Fidélité.
  const [siteLink, setSiteLink] = useState(defaultSiteLink);
  const [automation, setAutomation] = useState<EmailAutomation>(defaultAutomation);
  const [templates, setTemplates] = useState<EmailTemplate[]>(defaultTemplates);
  const [editing, setEditing] = useState<EditorTarget | null>(null);

  const saveTemplate = (tpl: EmailTemplate) => {
    setTemplates((prev) =>
      prev.some((t) => t.id === tpl.id)
        ? prev.map((t) => (t.id === tpl.id ? tpl : t))
        : [...prev, tpl],
    );
    setEditing(null);
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setEditing(null);
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Modèles d'email"
        description="Le texte des emails envoyés aux clientes et le réglage de leurs envois. Démo front-end : les modifications ne sont pas conservées."
      />

      <SettingsCards
        siteLink={siteLink}
        onSaveSiteLink={setSiteLink}
        automation={automation}
        onSaveAutomation={setAutomation}
      />

      <TemplateList
        templates={templates}
        onNew={() => setEditing({ mode: "new" })}
        onEdit={(template) => setEditing({ mode: "edit", template })}
      />

      {editing && (
        <TemplateEditorPanel
          target={editing}
          onClose={() => setEditing(null)}
          onSave={saveTemplate}
          onDelete={deleteTemplate}
        />
      )}
    </div>
  );
}
