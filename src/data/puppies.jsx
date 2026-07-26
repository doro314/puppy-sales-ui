// Category definitions for the gallery
//
// To add a new puppy:
//   1. Create a folder under /src/images/<foldername>/ folders can be empty but must be created for the puppy to show up
//   2. Add an entry below with the matching folder name
//   3. Add photos to the folder — they are picked up automatically
//
// Special fields:
//   icon            — "paw-blue" (male) | "paw-pink" (female) | null (litter)
//   folder          — image subfolder name; null for the litter overview
//   available       — "available" | "reserved" | "adopted" | null (null hides the status badge)
//                     "reserved" overrides the global Available Soon state and shows its own badge/CTA
//   litterDescription — shown as a paragraph below the stat grid, not as a stat row
//
// "Available Soon" state:
//   Driven by readyToAdoptDate on the "all" entry — if today is before that date,
//   all individual puppy CTAs show "Available Soon" regardless of their available flag.
//   Exception: "reserved" always shows its own badge and CTA regardless of the date.

const categories = [
  {
    id: "home",
    name: "Home",
    icon: null,
    folder: null,
    details: {
      breed: "Havapoo",
      mom: "Coco / Havapoo",
      dad: "Leo / Havapoo",
      birthDate: "2026-06-02",
      litterSize: 5,
      readyToAdoptDate: "2026-07-28", // ← controls "Available Soon" for all puppies
      vaccinations: "",
      dewormingDate: "2026-06-29",
      vetChecked: true,
      litterDescription: "Raised in a loving home with children and other pets, making them well-socialized and ready to settle into family life from day one.",
      facts: [
        "Typically range from 7 to 20 lbs",
        "Hypoallergenic, making them a good match for those with mild pet allergies",
        "Highly trainable and eager to please",
      ],
    },
  },
  {
    id: "Bella",
    name: "Bella",
    icon: "paw-pink",
    folder: "bella",
    details: {
      sex: "Female",
      color: "White/Black",
      weightAsOf: { value: "27.8 oz", asOf: "2026-06-28" },
      markings: "Black face mask and side spot",
      personality: "Curiously energetic",
      available: "available",
    },
  },
  {
    id: "Brownie",
    name: "Brownie",
    icon: "paw-blue",
    folder: "brownie",
    details: {
      sex: "Male",
      color: "Brown",
      weightAsOf: { value: "29.6 oz", asOf: "2026-06-28" },
      markings: "White toes",
      personality: "Cautious Explorer",
      available: "sold",
    },
  },
  {
    id: "Jasper",
    name: "Jasper",
    icon: "paw-blue",
    folder: "jasper",
    details: {
      sex: "Male",
      color: "Brown",
      weightAsOf: { value: "26.5 oz", asOf: "2026-06-28" },
      markings: "White Back paws and tip of tail",
      personality: "Chill Explorer",
      available: "reserved",
    },
  },
  {
    id: "Olive",
    name: "Olive",
    icon: "paw-pink",
    folder: "olive",
    details: {
      sex: "Female",
      color: "White/Black",
      weightAsOf: { value: "28.5 oz", asOf: "2026-06-28" },
      markings: "Black spot on left eye",
      personality: "Chill cuddler",
      available: "available",
    },
  },
  {
    id: "Pepper",
    name: "Pepper",
    icon: "paw-blue",
    folder: "pepper",
    details: {
      sex: "Male",
      color: "White/Brown",
      weightAsOf: { value: "29.7 oz", asOf: "2026-06-28" },
      markings: "brown face mask and rear spot",
      personality: "Outgoingly brave",
      available: "available",
    },
  },
];

export function getCategories() {
  return categories;
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}
