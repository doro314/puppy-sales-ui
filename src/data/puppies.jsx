// Query functions over litters.json — components import these, never the file itself.
// To add or change a litter or puppy, edit litters.json; VS Code lists every allowed
// value as you type, and the build stops with a plain explanation if something's off.

import data from "./litters.json";
import { getFolderPhotos, getPhoto } from "./imageLoader";
import { withCoverFirst } from "../utils";

const litters = data.litters;

// Newest first, as litters.json lists them: Home leads with the first.
export function getListedLitters() {
  return litters.filter((litter) => litter.listed);
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

export function getLineagePhoto(lineage) {
  return lineage.photo ? getPhoto("parents", lineage.photo) : null;
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
