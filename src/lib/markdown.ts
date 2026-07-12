/**
 * Tiny, dependency-free Markdown → HTML renderer for queue article bodies.
 *
 * WHY NOT A LIBRARY: the article bodies rendered at /articles/[slug] are
 * authored in-house through the content pipeline (brief → draft → ingest), so
 * we control the exact Markdown subset used. A small server-side converter
 * keeps the build free of extra dependencies and avoids client-side JS, while
 * still covering everything our drafts use:
 *
 *   - `##` / `###` headings
 *   - unordered (`-` / `*`) and ordered (`1.`) lists
 *   - `>` blockquotes
 *   - paragraphs
 *   - inline: **bold**, *italic*, `code`, and [links](https://…)
 *
 * All text is HTML-escaped BEFORE inline formatting is applied, so author copy
 * can never inject markup. The output is a trusted string of our own making,
 * rendered via dangerouslySetInnerHTML by the article page.
 */

/** Escape the five HTML-significant characters. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Apply inline formatting to already-escaped text. */
function inline(escaped: string): string {
  let out = escaped;
  // Links: [text](http(s)://url) — url already escaped; only allow http(s).
  out = out.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
    (_m, text: string, href: string) =>
      `<a href="${href}" target="_blank" rel="noopener nofollow" class="font-semibold text-brand-blue hover:underline">${text}</a>`,
  );
  // Bold **text**
  out = out.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold text-brand-navy">$1</strong>',
  );
  // Italic *text* (avoid matching bold leftovers)
  out = out.replace(/(^|[^*])\*([^*]+)\*($|[^*])/g, "$1<em>$2</em>$3");
  // Inline code `code`
  out = out.replace(
    /`([^`]+)`/g,
    '<code class="rounded bg-brand-mist px-1 py-0.5 text-[0.85em] text-brand-navy">$1</code>',
  );
  return out;
}

type Block =
  | { kind: "h2" | "h3"; text: string }
  | { kind: "ul" | "ol"; items: string[] }
  | { kind: "blockquote"; text: string }
  | { kind: "p"; text: string };

/** Split raw markdown into a flat list of block descriptors. */
function parseBlocks(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Blank line — skip.
    if (line.trim() === "") {
      i += 1;
      continue;
    }

    // Headings
    const h3 = line.match(/^###\s+(.*)$/);
    if (h3) {
      blocks.push({ kind: "h3", text: h3[1].trim() });
      i += 1;
      continue;
    }
    const h2 = line.match(/^##\s+(.*)$/);
    if (h2) {
      blocks.push({ kind: "h2", text: h2[1].trim() });
      i += 1;
      continue;
    }
    // Demote a lone H1 to H2 (page already renders the real <h1>).
    const h1 = line.match(/^#\s+(.*)$/);
    if (h1) {
      blocks.push({ kind: "h2", text: h1[1].trim() });
      i += 1;
      continue;
    }

    // Unordered list
    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "ol", items });
      continue;
    }

    // Blockquote
    if (/^\s*>\s?/.test(line)) {
      const parts: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        parts.push(lines[i].replace(/^\s*>\s?/, "").trim());
        i += 1;
      }
      blocks.push({ kind: "blockquote", text: parts.join(" ") });
      continue;
    }

    // Paragraph — gather consecutive non-blank, non-structural lines.
    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,3}\s+/.test(lines[i]) &&
      !/^\s*[-*]\s+/.test(lines[i]) &&
      !/^\s*\d+\.\s+/.test(lines[i]) &&
      !/^\s*>\s?/.test(lines[i])
    ) {
      para.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ kind: "p", text: para.join(" ") });
  }

  return blocks;
}

/** Render trusted in-house Markdown to an HTML string. */
export function renderMarkdown(md: string): string {
  const blocks = parseBlocks(md ?? "");
  return blocks
    .map((b) => {
      switch (b.kind) {
        case "h2":
          return `<h2 class="mt-10 font-serif text-2xl font-bold text-brand-navy">${inline(
            escapeHtml(b.text),
          )}</h2>`;
        case "h3":
          return `<h3 class="mt-8 font-serif text-xl font-bold text-brand-navy">${inline(
            escapeHtml(b.text),
          )}</h3>`;
        case "ul":
          return `<ul class="mt-4 list-disc space-y-2 pl-6 text-base leading-relaxed text-brand-ink/90">${b.items
            .map((it) => `<li>${inline(escapeHtml(it))}</li>`)
            .join("")}</ul>`;
        case "ol":
          return `<ol class="mt-4 list-decimal space-y-2 pl-6 text-base leading-relaxed text-brand-ink/90">${b.items
            .map((it) => `<li>${inline(escapeHtml(it))}</li>`)
            .join("")}</ol>`;
        case "blockquote":
          return `<blockquote class="mt-6 border-l-4 border-brand-blue bg-brand-mist/50 px-4 py-3 text-base italic leading-relaxed text-brand-ink/85">${inline(
            escapeHtml(b.text),
          )}</blockquote>`;
        case "p":
        default:
          return `<p class="mt-4 text-base leading-relaxed text-brand-ink/90">${inline(
            escapeHtml(b.text),
          )}</p>`;
      }
    })
    .join("\n");
}
