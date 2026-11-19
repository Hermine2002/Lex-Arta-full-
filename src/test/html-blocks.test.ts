import { describe, expect, it } from "vitest";
import {
  listBlocks,
  listImages,
  listLinks,
  setBlock,
  setImage,
  setLink,
  linkStatus,
} from "@/lib/html-blocks";
import { pages } from "@/lib/site-content";

describe("html-blocks", () => {
  const html =
    '<section><h1>Title</h1><p>Hello <a href="/about/">about</a></p></section>';
  it("lists and edits texts and links", () => {
    expect(listBlocks(html).map((b) => b.tag)).toEqual(["h1", "p"]);
    expect(setBlock(html, 0, "New")).toContain("<h1>New</h1>");
    expect(listLinks(html)[0]!.href).toBe("/about/");
    expect(setLink(html, 0, { href: "/contact/", blank: true })).toContain(
      'href="/contact/"',
    );
  });
  it("lists text held in divs, spans, card titles and button links", () => {
    const card =
      '<section><div class="section-kicker">Kicker</div><h2>Head</h2>' +
      '<a class="related-card" href="/x/"><strong>Card title</strong><span>Card text</span></a>' +
      '<div class="journey-step"><b>01</b><span>Step</span></div>' +
      '<a class="btn" href="/y/">Book now</a><div class="price">€950</div>' +
      "<p>Para with <strong>bold</strong></p></section>";
    const blocks = listBlocks(card);
    expect(blocks.map((b) => b.html)).toEqual([
      "Kicker",
      "Head",
      "Card title",
      "Card text",
      "01",
      "Step",
      "Book now",
      "€950",
      "Para with <strong>bold</strong>",
    ]);
    expect(blocks[0]!.cls).toBe("section-kicker");
    const edited = setBlock(card, 7, "€1,000");
    expect(edited).toContain('<div class="price">€1,000</div>');
    expect(listBlocks(edited)).toHaveLength(blocks.length);
  });
  it("lists and edits images", () => {
    const html =
      '<div><img src="/images/a.webp" alt="A"><p>x</p><img src="/b.png" alt=""></div>';
    expect(listImages(html).map((i) => i.src)).toEqual([
      "/images/a.webp",
      "/b.png",
    ]);
    const out = setImage(html, 1, { src: "/uploads/c.png", alt: "C" });
    expect(listImages(out)[1]).toEqual({
      index: 1,
      src: "/uploads/c.png",
      alt: "C",
    });
  });
  it("reaches nearly all visible text on every bundled page", () => {
    for (const [p, page] of Object.entries(pages)) {
      const doc = new DOMParser().parseFromString(
        `<body>${page.html}</body>`,
        "text/html",
      );
      const covered = listBlocks(page.html).map((b) => b.html);
      const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const missing: string[] = [];
      while (walker.nextNode()) {
        const t = walker.currentNode.textContent?.trim();
        if (!t || walker.currentNode.parentElement?.closest("script,style,svg"))
          continue;
        if (
          !covered.some((h) =>
            h.includes(t.replace(/&/g, "&amp;").slice(0, 20)),
          )
        )
          missing.push(t);
      }
      expect({ page: p, missing }).toEqual({ page: p, missing: [] });
    }
  });
  it("every internal link in every page resolves to a real page", () => {
    const known = new Set(Object.keys(pages));
    const bad: string[] = [];
    for (const [p, page] of Object.entries(pages))
      for (const l of listLinks(page.html)) {
        const s = linkStatus(l.href, known);
        if (s === "broken" || s === "empty") bad.push(`${p} -> ${l.href}`);
      }
    expect(bad).toEqual([]);
  });
});
