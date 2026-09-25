export type Option = {
  value: string;
  label: string;
};

export const businessTypeOptions: Option[] = [
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "electronics", label: "Electronics & Gadgets" },
  { value: "food", label: "Food & Beverages" },
  { value: "beauty", label: "Beauty & Skincare" },
  { value: "health", label: "Health & Wellness" },
  { value: "home", label: "Home & Decor" },
  { value: "automotive", label: "Automotive" },
  { value: "hobby", label: "Hobbies, Toys & Collectibles" },
  { value: "services", label: "Services" },
  { value: "other", label: "Other" },
];

export const businessModelOptions: Option[] = [
  { value: "b2c", label: "B2C — Business to Consumer" },
  { value: "b2b", label: "B2B — Business to Business" },
  { value: "c2c", label: "C2C — Consumer to Consumer" },
  { value: "d2c", label: "D2C — Direct to Consumer" },
  { value: "b2b2c", label: "B2B2C — Business to Business to Consumer" },
];
