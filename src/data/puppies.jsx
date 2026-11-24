// Query functions over litters.json — components import these, never the file itself.
// To add or change a litter or puppy, edit litters.json; VS Code lists every allowed
// value as you type, and the build stops with a plain explanation if something's off.

import data from "./litters.json";
import { getPhotoSrc } from "./imageLoader";

const PAW_ICONS = { female: "paw-pink", male: "paw-blue" };

const litters = data.litters;

export function getListedLitters() {
  return litters.filter((litter) => litter.listed);
}

// Newest first: the first listed litter is the one Home leads with.
export function getLeadLitter() {
  return getListedLitters()[0];
}

// ── Transitional: today's pages read one "home" record plus one per puppy ──

const capitalize = (word) => word.charAt(0).toUpperCase() + word.slice(1);

function latestCare(litter, type) {
  return (litter.care ?? []).filter((step) => step.type === type).at(-1);
}

function homeRecord(litter) {
  const vaccinations = (litter.care ?? [])
    .filter((step) => step.type === "vaccinated")
    .map((step) => step.note ?? step.date)
    .join(", ");

  return {
    id: "home",
    name: "Home",
    icon: null,
    folder: null,
    photoFolder: litter.id,
    parentPhotos: {
      mom: litter.mom.photo ? getPhotoSrc("parents", litter.mom.photo) : null,
      dad: litter.dad.photo ? getPhotoSrc("parents", litter.dad.photo) : null,
    },
    details: {
      breed: litter.breed,
      mom: `${litter.mom.name} / ${litter.mom.breed}`,
      dad: `${litter.dad.name} / ${litter.dad.breed}`,
      birthDate: litter.born,
      litterSize: litter.litterSize ?? litter.puppies.length,
      readyToAdoptDate: litter.readyDate,
      vaccinations,
      dewormingDate: latestCare(litter, "dewormed")?.date,
      vetChecked: Boolean(latestCare(litter, "vet-check")),
      litterDescription: litter.description,
      facts: litter.facts,
    },
  };
}

function puppyRecord(puppy) {
  const latestWeight = puppy.weights?.at(-1);
  return {
    id: puppy.slug,
    name: puppy.name,
    icon: PAW_ICONS[puppy.sex],
    folder: puppy.slug,
    details: {
      sex: capitalize(puppy.sex),
      color: (puppy.color ?? []).map(capitalize).join("/"),
      weightAsOf: { value: latestWeight ? `${latestWeight.oz} oz` : null, asOf: latestWeight?.date ?? null },
      markings: puppy.markings,
      personality: puppy.personality,
      available: puppy.status,
    },
  };
}

const categories = [
  homeRecord(getLeadLitter()),
  ...getListedLitters().flatMap((litter) => litter.puppies.map(puppyRecord)),
];

export function getCategories() {
  return categories;
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}
