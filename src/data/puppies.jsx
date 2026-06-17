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
    name: "Litter Info",
    icon: null,
    folder: null,
    details: {
      breed: "Havapoo",
      mom: "Coco",
      dad: "Leo",
      birthDate: "2026-06-02",
      litterSize: 5,
      readyToAdoptDate: "2026-07-28", // ← controls "Available Soon" for all puppies
      vaccinations: "",
      dewormingDate: "",
      vetChecked: true,
      litterDescription: "A beautiful litter of Havapoo puppies, known for their playful personalities and gentle temperaments. They were raised in a loving home environment with children and other pets, making them well-socialized from birth.",
    },
  },
  {
    id: "Bella",
    name: "Bella",
    icon: "paw-pink",
    folder: "bella",
    details: {
      sex: "Female",
      color: "White with black spots",
      weightAsOf: { value: "19.8 oz", asOf: "2026-06-16" },
      specialMarkings: null,
      personality: "Sleepy Baby",
      available: true,
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
      weightAsOf: { value: "20.2 oz", asOf: "2026-06-16" },
      specialMarkings: null,
      personality: "Sleepy Baby",
      available: true,
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
      weightAsOf: { value: "17.5 oz", asOf: "2026-06-16" },
      specialMarkings: null,
      personality: "Sleepy Baby",
      available: true,
    },
  },
  {
    id: "Olive",
    name: "Olive",
    icon: "paw-pink",
    folder: "olive",
    details: {
      sex: "Female",
      color: "White with a black Eye",
      weightAsOf: { value: "19.6 oz", asOf: "2026-06-16" },
      specialMarkings: null,
      personality: "Sleepy Baby",
      available: true,
    },
  },
  {
    id: "Pepper",
    name: "Pepper",
    icon: "paw-blue",
    folder: "pepper",
    details: {
      sex: "Male",
      color: "White with brown spots",
      weightAsOf: { value: "20.9 oz", asOf: "2026-06-16" },
      specialMarkings: null,
      personality: "Sleepy Baby",
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
