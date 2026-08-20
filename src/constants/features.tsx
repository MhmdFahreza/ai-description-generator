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
  icon: JSX.Element;
};

export const features: Feature[] = [
  {
    title: "Kualitas Terbaik",
    desc: "Hasil tulisan AI yang natural dan relevan, bukan asal generate.",
    accent: AMBER,
    icon: <IconSparkle />,
  },
  {
    title: "Super Cepat",
    desc: "Cukup beberapa detik untuk dapat draft deskripsi yang siap pakai.",
    accent: CORAL,
    icon: <IconZap />,
  },
  {
    title: "Mudah Digunakan",
    desc: "Tinggal isi detail produk, klik generate, hasilnya langsung muncul.",
    accent: TEAL,
    icon: <IconClick />,
  },
  {
    title: "Bisa Dari Mana Saja",
    desc: "Berbasis browser, tidak perlu install apa pun di perangkatmu.",
    accent: VIOLET,
    icon: <IconGlobe />,
  },
  {
    title: "Privasi Terjaga",
    desc: "Data yang kamu masukkan tidak dibagikan atau disimpan sembarangan.",
    accent: AMBER,
    icon: <IconShield />,
  },
  {
    title: "7 Jenis Generator",
    desc: "Dari deskripsi produk sampai iklan, semua kebutuhan konten ada di sini.",
    accent: CORAL,
    icon: <IconGrid />,
  },
];