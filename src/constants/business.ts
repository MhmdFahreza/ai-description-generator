export type Option = {
  value: string;
  label: string;
};

export const businessTypeOptions: Option[] = [
  { value: "fashion", label: "Fashion & Pakaian" },
  { value: "electronics", label: "Elektronik & Gadget" },
  { value: "food", label: "Makanan & Minuman" },
  { value: "beauty", label: "Kecantikan & Perawatan" },
  { value: "health", label: "Kesehatan" },
  { value: "home", label: "Rumah Tangga & Dekorasi" },
  { value: "automotive", label: "Otomotif" },
  { value: "hobby", label: "Hobi, Mainan & Koleksi" },
  { value: "services", label: "Jasa & Layanan" },
  { value: "other", label: "Lainnya" },
];

export const businessModelOptions: Option[] = [
  { value: "b2c", label: "B2C — Business to Consumer" },
  { value: "b2b", label: "B2B — Business to Business" },
  { value: "c2c", label: "C2C — Consumer to Consumer" },
  { value: "d2c", label: "D2C — Direct to Consumer" },
  { value: "b2b2c", label: "B2B2C — Business ke Business ke Consumer" },
];
