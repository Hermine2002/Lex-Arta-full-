import parse, {
  attributesToProps,
  domToReact,
  Element,
  type DOMNode,
  type HTMLReactParserOptions,
} from "html-react-parser";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  Scale,
  ShieldCheck,
  Fingerprint,
  Globe2,
  Landmark,
  FileSearch,
  Users,
  Building2,
  Network,
  Briefcase,
  Gavel,
  ClipboardCheck,
} from "lucide-react";
import { resolveImageUrl } from "@/lib/assets";

const icons = [
  Scale,
  ShieldCheck,
  Fingerprint,
  Globe2,
  Landmark,
  FileSearch,
  Users,
  Building2,
  Network,
  Briefcase,
  Gavel,
  ClipboardCheck,
];

const isProblemCard = (node: unknown): boolean =>
  node instanceof Element &&
  node.name === "article" &&
  (node.attribs["class"] ?? "").split(/\s+/).includes("problem-card");

/** Card number: its own data-no, or its position among sibling problem cards. */
function problemCardNumber(node: Element): string {
  if (node.attribs["data-no"]) return node.attribs["data-no"];
  const siblings = (node.parent?.children ?? []).filter(isProblemCard);
  const index = siblings.indexOf(node);
  return String((index < 0 ? 0 : index) + 1).padStart(2, "0");
}

export function OriginalContent({
  html,
  socials,
}: {
  html: string;
  socials?: Record<string, string> | undefined;
}) {
  const options: HTMLReactParserOptions = {
    replace(node) {
      if (!(node instanceof Element)) return undefined;
      const children = () => domToReact(node.children as DOMNode[], options);
      if (
        node.name === "a" &&
        node.parent instanceof Element &&
        node.parent.attribs["class"]?.includes("lx-footer-social")
      ) {
        const label = (node.attribs["aria-label"] ?? "").toLowerCase();
        const props = attributesToProps(node.attribs);
        const url = socials?.[label];
        return (
          <a
            {...props}
            href={url || node.attribs["href"]}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children()}
          </a>
        );
      }
      if (
        node.name === "button" &&
        node.parent instanceof Element &&
        node.parent.attribs["class"]?.includes("lx-footer-social")
      ) {
        // A disabled placeholder is a dead link: show it only once the admin has set a real URL.
        const label = (node.attribs["aria-label"] ?? "")
          .split(":")[0]!
          .toLowerCase();
        const url = socials?.[label];
        if (!url) return <></>;
        return (
          <a
            aria-label={node.attribs["aria-label"]!.split(":")[0]}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children()}
          </a>
        );
      }
      if (node.name === "button") {
        const props = attributesToProps(node.attribs);
        return (
          <Button
            {...props}
            variant={
              node.attribs["class"]?.includes("secondary")
                ? "outline"
                : "default"
            }
          >
            {children()}
          </Button>
        );
      }
      if (
        node.name === "a" &&
        node.attribs["class"]?.split(" ").includes("btn")
      ) {
        const props = attributesToProps(node.attribs);
        return (
          <Button
            asChild
            variant={
              node.attribs["class"].includes("secondary")
                ? "outline"
                : "default"
            }
            size="lg"
          >
            <a {...props}>
              {children()}
              <ArrowUpRight size={16} />
            </a>
          </Button>
        );
      }
      if (isProblemCard(node)) {
        const no = problemCardNumber(node);
        const n = Math.max(1, Number(no) || 1);
        const Icon = icons[(n - 1) % icons.length] ?? Scale;
        return (
          <article {...attributesToProps(node.attribs)} data-no={no}>
            <div className="service-card-top">
              <Icon size={26} strokeWidth={1.3} />
              <span>{no}</span>
            </div>
            {children()}
          </article>
        );
      }
      if (
        node.name === "a" &&
        /^https?:\/\//i.test(node.attribs["href"] ?? "")
      ) {
        return (
          <a
            {...attributesToProps(node.attribs)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children()}
          </a>
        );
      }
      if (node.name === "img")
        return (
          <img
            {...attributesToProps(node.attribs)}
            src={
              node.attribs["src"]
                ? resolveImageUrl(node.attribs["src"])
                : undefined
            }
            loading={
              node.parent instanceof Element &&
              node.parent.attribs["class"]?.includes("hero-visual")
                ? "eager"
                : "lazy"
            }
          />
        );
      return undefined;
    },
  };
  return <>{parse(html, options)}</>;
}
