/** Turns page HTML into a flat list of editable text blocks and links, and applies edits back. Browser-only (DOMParser). */

const TEXT_SEL =
  "h1,h2,h3,h4,h5,h6,p,li,summary,blockquote,td,th,figcaption,dt,dd,legend,button,label";
const CONTAINER_SEL =
  "h1,h2,h3,h4,h5,h6,p,li,ul,ol,table,blockquote,div,section,article,details,form,fieldset";

export type TextBlock = {
  index: number;
  tag: string;
  /** First CSS class of the element, to help recognise it (e.g. "section-kicker"). */
  cls: string;
  html: string;
  hasMarkup: boolean;
};
export type LinkItem = {
  index: number;
  text: string;
  href: string;
  blank: boolean;
};
export type ImageItem = { index: number; src: string; alt: string };

function parse(html: string): Document {
  return new DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
}

const hasOwnText = (el: Element) =>
  Array.from(el.childNodes).some(
    (n) => n.nodeType === 3 && (n.textContent ?? "").trim() !== "",
  );

/**
 * Every piece of visible text on the page, as the smallest element that holds it:
 * headings, paragraphs and list items, plus any other element (a kicker <div>,
 * a chip <span>, a button-style <a>, a card title <strong>, a price…) that has text
 * of its own. Nested matches are skipped so each text is listed exactly once.
 */
function textElements(doc: Document): HTMLElement[] {
  const out: HTMLElement[] = [];
  for (const el of Array.from(doc.body.querySelectorAll<HTMLElement>("*"))) {
    if (el.closest("script,style,svg,noscript,template")) continue;
    if (out.some((b) => b.contains(el))) continue;
    if (el.querySelector(CONTAINER_SEL)) continue;
    if ((el.textContent ?? "").trim() === "") continue;
    if (el.matches(TEXT_SEL) || hasOwnText(el)) out.push(el);
  }
  return out;
}

export function listBlocks(html: string): TextBlock[] {
  return textElements(parse(html)).map((el, index) => ({
    index,
    tag: el.tagName.toLowerCase(),
    cls: (el.getAttribute("class") ?? "").trim().split(/\s+/)[0] ?? "",
    html: el.innerHTML.trim(),
    hasMarkup: el.children.length > 0,
  }));
}

export function listImages(html: string): ImageItem[] {
  return Array.from(parse(html).body.querySelectorAll("img")).map(
    (img, index) => ({
      index,
      src: img.getAttribute("src") ?? "",
      alt: img.getAttribute("alt") ?? "",
    }),
  );
}

export function setImage(
  html: string,
  index: number,
  patch: Partial<Pick<ImageItem, "src" | "alt">>,
): string {
  const doc = parse(html);
  const img = doc.body.querySelectorAll("img")[index];
  if (!img) return html;
  if (patch.src !== undefined) img.setAttribute("src", patch.src.trim());
  if (patch.alt !== undefined) img.setAttribute("alt", patch.alt);
  return doc.body.innerHTML;
}

export function listLinks(html: string): LinkItem[] {
  return Array.from(parse(html).body.querySelectorAll("a")).map((a, index) => ({
    index,
    text: (a.textContent ?? "").trim().replace(/\s+/g, " "),
    href: a.getAttribute("href") ?? "",
    blank: a.getAttribute("target") === "_blank",
  }));
}

export function setBlock(html: string, index: number, value: string): string {
  const doc = parse(html);
  const el = textElements(doc)[index];
  if (!el) return html;
  el.innerHTML = value;
  return doc.body.innerHTML;
}

export function setLink(
  html: string,
  index: number,
  patch: Partial<Pick<LinkItem, "href" | "blank">>,
): string {
  const doc = parse(html);
  const a = doc.body.querySelectorAll("a")[index];
  if (!a) return html;
  if (patch.href !== undefined) a.setAttribute("href", patch.href.trim());
  if (patch.blank !== undefined) {
    if (patch.blank) {
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    } else {
      a.removeAttribute("target");
      a.removeAttribute("rel");
    }
  }
  return doc.body.innerHTML;
}

export type LinkStatus = "ok" | "external" | "mail" | "broken" | "empty";

/** Classifies an href against the set of known internal page paths. */
export function linkStatus(href: string, known: Set<string>): LinkStatus {
  const h = href.trim();
  if (!h || h === "#" || h.toLowerCase().startsWith("javascript:"))
    return "empty";
  if (/^(mailto:|tel:)/i.test(h)) return "mail";
  if (/^https?:\/\//i.test(h)) return "external";
  if (h.startsWith("#")) return "ok";
  if (h.startsWith("/")) {
    if (h.startsWith("/__l5e")) return "ok";
    let p = h.split("#")[0]!.split("?")[0]!;
    if (!p.endsWith("/")) p += "/";
    return known.has(p) ? "ok" : "broken";
  }
  return "broken";
}
