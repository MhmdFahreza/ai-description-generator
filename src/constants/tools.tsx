import {
  IconBox,
  IconChat,
  IconHeading,
  IconHook,
  IconMegaphone,
  IconSearch,
  IconStore,
} from "@/componenets/icons";
import { AMBER, CORAL, TEAL, VIOLET } from "@/constants/colors";

export type AccentKey = "amber" | "coral" | "teal" | "violet";

export type ToolCategory = {
  code: string;
  title: string;
  desc: string;
  href: string;
  accentKey: AccentKey;
  accent: string;
  featured?: boolean;
  icon: JSX.Element;
};

// Static, literal class names so Tailwind's scanner can find and generate
// them at build time (dynamically-built arbitrary-value strings won't work).
export const ACCENT_HOVER_BORDER: Record<AccentKey, string> = {
  amber: "hover:border-[#F2B441]",
  coral: "hover:border-[#E8623D]",
  teal: "hover:border-[#4FB6A8]",
  violet: "hover:border-[#A78BFA]",
};

export const categories: ToolCategory[] = [
  {
    code: "01",
    title: "Product Description",
    desc: "Highlight features & benefits in a listing-ready product description.",
    href: "/generate/product-description",
    accentKey: "amber",
    accent: AMBER,
    featured: true,
    icon: <IconBox />,
  },
  {
    code: "02",
    title: "Social Media Caption",
    desc: "Scroll-stopping captions for Instagram, TikTok, and Facebook.",
    href: "/generate/social-media-caption",
    accentKey: "coral",
    accent: CORAL,
    icon: <IconChat />,
  },
  {
    code: "03",
    title: "Title Generator",
    desc: "Catchy, memorable titles for your products or content.",
    href: "/generate/title-generator",
    accentKey: "teal",
    accent: TEAL,
    icon: <IconHeading />,
  },
  {
    code: "04",
    title: "Hook Generator",
    desc: "Opening lines that make people stop scrolling.",
    href: "/generate/hook-generator",
    accentKey: "violet",
    accent: VIOLET,
    icon: <IconHook />,
  },
  {
    code: "05",
    title: "Advertisement Generator",
    desc: "Persuasive ad copy ready for your next campaign.",
    href: "/generate/advertisement-generator",
    accentKey: "amber",
    accent: AMBER,
    icon: <IconMegaphone />,
  },
  {
    code: "06",
    title: "SEO Description",
    desc: "Search-engine-friendly meta descriptions — concise and relevant.",
    href: "/generate/seo-description",
    accentKey: "coral",
    accent: CORAL,
    icon: <IconSearch />,
  },
  {
    code: "07",
    title: "Marketplace Description",
    desc: "Full store/product descriptions ready for Shopee, Tokopedia & more.",
    href: "/generate/marketplace-description",
    accentKey: "teal",
    accent: TEAL,
    icon: <IconStore />,
  },
];