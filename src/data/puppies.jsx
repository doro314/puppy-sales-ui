// Query functions over litters.json — components import these, never the file itself.
// To add or change a litter or puppy, edit litters.json; VS Code lists every allowed
// value as you type, and the build stops with a plain explanation if something's off.

import data from "./litters.json";
import { getFolderPhotos, getPhoto, getPhotoSrc } from "./imageLoader";
import { capitalize, formatCoat, formatWeight, withCoverFirst } from "../utils";

const PAW_ICONS = { female: "paw-pink", male: "paw-blue" };

const litters = data.litters;

export function getListedLitters() {
  return litters.filter((litter) => litter.listed);
}

// Newest first: the first listed litter is the one Home leads with.
export function getLeadLitter() {
  return getListedLitters()[0];
}

// Any litter, listed or not, so an old link to a puppy can still say where she went.
export function findPuppy(slug) {
  for (const litter of litters) {
    const puppy = litter.puppies.find((p) => p.slug === slug);
    if (puppy) return { puppy, litter };
  }
  return null;
}

export function getLitterPhotos(litter) {
  return withCoverFirst(getFolderPhotos(litter.id), litter.cover);
}

export function getPuppyPhotos(litter, puppy) {
  return withCoverFirst(getFolderPhotos(`${litter.id}/${puppy.slug}`), puppy.cover);
}

export function getParentPhoto(parent) {
  return parent.photo ? getPhoto("parents", parent.photo) : null;
}

// What a visitor can do: "soon" is an available puppy before her litter's ready date.
export function getPuppyStatus(puppy, litter, today) {
  if (puppy.status === "available" && litter.readyDate && today < litter.readyDate) return "soon";
  return puppy.status;
}

export function countAvailable(litter) {
  return litter.puppies.filter((p) => p.status === "available").length;
}

// Every puppy reserved or adopted — the litter has nothing left to offer.
export function isSpokenFor(litter) {
  return litter.puppies.length > 0 && countAvailable(litter) === 0;
}

const CARE_ORDER = ["vet-check", "dewormed", "vaccinated", "microchipped"];

// The latest step of each kind that's been done, in a fixed order: one tile each.
export function getCareDone(litter) {
  return CARE_ORDER.flatMap((type) => {
    const steps = (litter.care ?? []).filter((step) => step.type === type);
    if (steps.length === 0) return [];
    return [steps.reduce((a, b) => ((b.date ?? "") >= (a.date ?? "") ? b : a))];
  });
}

// Every care step, newest first; steps without a date go last.
export function getCareLog(litter) {
  return [...(litter.care ?? [])].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

// ── Transitional: today's pages read one "home" record plus one per puppy ──

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

function puppyRecord(puppy, litter) {
  return {
    id: puppy.slug,
    name: puppy.name,
    icon: PAW_ICONS[puppy.sex],
    folder: puppy.slug,
    details: {
      sex: capitalize(puppy.sex),
      color: formatCoat(puppy.color, puppy.pattern),
      weight: formatWeight(puppy.weights, litter.born),
      markings: puppy.markings,
      personality: puppy.personality,
      available: puppy.status,
    },
  };
}

const categories = [
  homeRecord(getLeadLitter()),
  ...getListedLitters().flatMap((litter) => litter.puppies.map((puppy) => puppyRecord(puppy, litter))),
];

export function getCategories() {
  return categories;
}

export function getCategoryById(id) {
  return categories.find((c) => c.id === id);
}
