import type { ReactNode } from "react";
import {
  IconSparkle,
  IconZap,
  IconClick,
  IconGlobe,
  IconShield,
  IconGrid,
} from "@/componenets/icons";
import { AMBER, CORAL, TEAL, VIOLET } from "@/constants/colors";

export type Feature = {
  title: string;
  desc: string;
  accent: string;
  icon: ReactNode;
};

export const features: Feature[] = [
  {
    title: "Top Quality Output",
    desc: "Natural, relevant AI writing — not generic filler text.",
    accent: AMBER,
    icon: <IconSparkle />,
  },
  {
    title: "Lightning Fast",
    desc: "Get a ready-to-use draft description in just a few seconds.",
    accent: CORAL,
    icon: <IconZap />,
  },
  {
    title: "Easy to Use",
    desc: "Fill in your details, hit generate, and your copy is ready.",
    accent: TEAL,
    icon: <IconClick />,
  },
  {
    title: "Works Anywhere",
    desc: "Fully browser-based — no install, no setup required.",
    accent: VIOLET,
    icon: <IconGlobe />,
  },
  {
    title: "Privacy First",
    desc: "Your input is never stored or shared without your consent.",
    accent: AMBER,
    icon: <IconShield />,
  },
  {
    title: "7 Generator Types",
    desc: "From product descriptions to ads — all your content needs in one place.",
    accent: CORAL,
    icon: <IconGrid />,
  },
];