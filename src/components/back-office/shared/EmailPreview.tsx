"use client";

import Image from "next/image";
import { defaultSiteLink } from "@/lib/mock/emails";
import { markdownToHtml } from "@/lib/markdown-lite";

// Aperçu d'un email tel que la cliente le reçoit : wordmark, objet, corps
// (Markdown léger), pied « site web ». Partagé par « Envoyer un message » et
// l'éditeur de modèles de Réglages › Emails.
//
// `variables` : valeurs à substituer aux `{{jetons}}` des modèles. Une valeur
// remplacée est surlignée pour montrer où la donnée de la cliente atterrira ;
// sans valeur, le jeton reste affiché en pastille.

const TOKEN = /\{\{([a-z_]+)\}\}/g;

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function fillHtml(html: string, variables?: Record<string, string>) {
  if (!variables) return html;
  return html.replace(TOKEN, (token, key: string) => {
    const value = variables[key];
    return value !== undefined
      ? `<span class="email-var">${escapeHtml(value)}</span>`
      : `<span class="email-token">${token}</span>`;
  });
}

function fillText(text: string, variables?: Record<string, string>) {
  if (!variables) return text;
  return text.replace(TOKEN, (token, key: string) => variables[key] ?? token);
}

export default function EmailPreview({
  subject,
  body,
  siteLink = defaultSiteLink,
  variables,
  lineBreaks = false,
}: {
  subject: string;
  body: string;
  siteLink?: string;
  variables?: Record<string, string>;
  /** Un retour à la ligne dans le texte = un retour à la ligne dans l'email. */
  lineBreaks?: boolean;
}) {
  return (
    <div className="rounded-box border border-base-300 bg-base-200 p-6">
      <div className="rounded-box bg-base-100 px-8 py-7 shadow-sm">
        <div className="flex justify-center">
          <Image src="/images/logo/beautyandco-wordmark.svg" alt="Beauty & Co" width={120} height={56} />
        </div>
        <p className="mt-5 text-center text-sm font-medium text-base-content/70">
          {subject.trim() ? fillText(subject, variables) : <span className="text-base-content/40">Objet du message</span>}
        </p>
        <div className="my-6 border-t border-brand-100" />
        {body.trim() ? (
          <div
            className="min-h-40 text-[15px] leading-relaxed text-base-content [&_.email-token]:rounded [&_.email-token]:bg-muted [&_.email-token]:px-1 [&_.email-token]:font-mono [&_.email-token]:text-[13px] [&_.email-token]:text-base-content/70 [&_.email-var]:rounded [&_.email-var]:bg-brand-100/70 [&_.email-var]:px-0.5 [&_a]:text-primary [&_a]:underline [&_h2]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_li]:mb-1 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: fillHtml(markdownToHtml(body, { lineBreaks }), variables) }}
          />
        ) : (
          <p className="min-h-40 text-[15px] text-base-content/40">Votre message apparaîtra ici…</p>
        )}
        <div className="my-6 border-t border-brand-100" />
        <p className="text-center text-sm text-base-content/60">
          Pour plus d&apos;informations, visitez notre{" "}
          <a href={siteLink} target="_blank" rel="noreferrer" className="text-primary underline">
            site web
          </a>
        </p>
      </div>
    </div>
  );
}
