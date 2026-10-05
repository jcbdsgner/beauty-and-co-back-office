"use client";

import { useState } from "react";
import { defaultSiteLink, defaultTemplates, type EmailTemplate } from "@/lib/mock/emails";
import SettingsCards from "./emails/SettingsCards";
import TemplateList from "./emails/TemplateList";
import TemplateEditorPanel, { type EditorTarget } from "./emails/TemplateEditorPanel";

export default function EmailsPanel() {
  // Aucun backend : tout est édité en mémoire de session, comme Fidélité.
  const [siteLink, setSiteLink] = useState(defaultSiteLink);
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
    <div className="space-y-6">
      <SettingsCards
        siteLink={siteLink}
        onSaveSiteLink={setSiteLink}
      />

      <TemplateList
        templates={templates}
        onNew={() => setEditing({ mode: "new" })}
        onEdit={(template) => setEditing({ mode: "edit", template })}
      />

      {editing && (
        <TemplateEditorPanel
          target={editing}
          siteLink={siteLink}
          onClose={() => setEditing(null)}
          onSave={saveTemplate}
          onDelete={deleteTemplate}
        />
      )}
    </div>
  );
}
