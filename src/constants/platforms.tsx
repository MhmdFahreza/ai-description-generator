import {
  IconCamera,
  IconMusicNote,
  IconThumbsUp,
  IconChat,
  IconPlayCircle,
  IconBriefcase,
} from "@/componenets/icons";
import { AMBER, CORAL, TEAL, VIOLET } from "@/constants/colors";

export type Platform =
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter"
  | "youtube"
  | "linkedin";

export type PlatformOption = {
  value: Platform;
  label: string;
  accent: string;
  icon: JSX.Element;
};

export const platformOptions: PlatformOption[] = [
  { value: "instagram", label: "Instagram", accent: AMBER, icon: <IconCamera /> },
  { value: "tiktok", label: "TikTok", accent: CORAL, icon: <IconMusicNote /> },
  { value: "facebook", label: "Facebook", accent: TEAL, icon: <IconThumbsUp /> },
  { value: "twitter", label: "Twitter / X", accent: VIOLET, icon: <IconChat /> },
  { value: "youtube", label: "YouTube", accent: AMBER, icon: <IconPlayCircle /> },
  { value: "linkedin", label: "LinkedIn", accent: CORAL, icon: <IconBriefcase /> },
];
