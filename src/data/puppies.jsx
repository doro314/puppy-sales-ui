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
//   available       — true | false | null (null hides the status badge)
//   litterDescription — shown as a paragraph below the stat grid, not as a stat row
//
// "Available Soon" state:
//   Driven by readyToAdoptDate on the "all" entry — if today is before that date,
//   all individual puppy CTAs show "Available Soon" regardless of their available flag.

const categories = [
  {
    id: "all",
    name: "Our Litter",
    icon: null,
    folder: null,
    details: {
      breed: "Havapoo",
      mom: "Coco",
      dad: "Leo",
      birthDate: "2026-01-15",
      litterSize: 3,
      readyToAdoptDate: "2026-03-12", // ← controls "Available Soon" for all puppies
      vaccinations: "DHPP (8 wk), DHPP (12 wk)",
      dewormingDate: "2026-02-12",
      vetChecked: true,
      litterDescription: "A beautiful litter of Havapoo puppies, known for their playful personalities and gentle temperaments. They were raised in a loving home environment with children and other pets, making them well-socialized from birth.",
    },
  },
  {
    id: "Honda",
    name: "Honda",
    icon: "paw-blue",
    folder: "honda",
    details: {
      sex: "Male",
      color: "Black and white",
      pattern: "Tuxedo",
      weightAsOf: { value: "4.2 lbs", asOf: "2026-04-20" },
      personality: "Adventurous and bold",
      available: true,
    },
  },
  {
    id: "Rosa",
    name: "Rosa",
    icon: "paw-pink",
    folder: "rosa",
    details: {
      sex: "Female",
      color: "Golden cream",
      pattern: "Solid",
      weightAsOf: { value: "3.8 lbs", asOf: "2026-04-20" },
      personality: "Sweet and cuddly",
      available: true,
    },
  },
  {
    id: "Cece",
    name: "Cece",
    icon: "paw-pink",
    folder: "cece",
    details: {
      sex: "Female",
      color: "Brown and tan",
      pattern: "Merle",
      weightAsOf: { value: "3.5 lbs", asOf: "2026-04-20" },
      personality: "Playful and energetic",
      available: false,
    },
  },
  {
    id: "Sparky",
    name: "Sparky",
    icon: "paw-blue",
    folder: "sparky",
    details: {
      sex: "Male",
      color: "Black and white",
      pattern: "Tuxedo",
      weightAsOf: { value: "4.2 lbs", asOf: "2026-04-20" },
      personality: "Adventurous and bold",
      available: true,
    },
  },
];

export function getCategories() {
  return categories;
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}
