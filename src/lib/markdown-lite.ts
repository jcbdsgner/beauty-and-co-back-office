// Mini-rendu Markdown pour l'envoi groupé (`EnvoyerMessage`) : gras, italique,
// liens, listes à puces, titres, paragraphes, `&nbsp;` seul = espace vertical.
// Le texte est échappé AVANT toute transformation — aucun HTML saisi ne passe.

const escapeHtml = (s: string) =>
  s.replace(/&(?!nbsp;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const inline = (s: string) =>
  escapeHtml(s)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>");

export function markdownToHtml(md: string): string {
  const blocks = md.replace(/\r\n/g, "\n").split(/\n\s*\n/);
  return blocks
    .map((block) => {
      const b = block.trim();
      if (!b) return "";
      if (b === "&nbsp;") return '<p class="md-spacer">&nbsp;</p>';
      const lines = b.split("\n");
      if (lines.every((l) => /^\s*[-–]\s+/.test(l))) {
        return `<ul>${lines.map((l) => `<li>${inline(l.replace(/^\s*[-–]\s+/, ""))}</li>`).join("")}</ul>`;
      }
      if (lines.length === 1 && b.startsWith("## ")) return `<h3>${inline(b.slice(3))}</h3>`;
      if (lines.length === 1 && b.startsWith("# ")) return `<h2>${inline(b.slice(2))}</h2>`;
      return `<p>${lines.map(inline).join(" ")}</p>`;
    })
    .join("");
}

/** Version texte brut (SMS / WhatsApp sans mise en forme). */
export function markdownToPlain(md: string): string {
  return md
    .replace(/\r\n/g, "\n")
    .replace(/^\s*&nbsp;\s*$/gm, "")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,2}\s+/gm, "")
    .replace(/^\s*[-–]\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
