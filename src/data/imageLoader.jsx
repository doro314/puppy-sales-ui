// Every photo under src/images, in the sizes the pages need, made at build time by
// vite-imagetools: a 320 px thumbnail, 640 px for puppy cards, 1280 / 1920 px for the
// main photo and fullscreen. Vite hands the paths over sorted by name, so each folder's
// photos come in file-name order. import.meta.glob needs literal arguments, which is
// why the pattern repeats.
const thumbs = import.meta.glob("../images/**/*.{jpg,jpeg,png,gif,webp,avif,JPG,JPEG,PNG,GIF,WEBP,AVIF}", {
  eager: true,
  import: "default",
  query: "?w=320&format=webp",
});
const mains = import.meta.glob("../images/**/*.{jpg,jpeg,png,gif,webp,avif,JPG,JPEG,PNG,GIF,WEBP,AVIF}", {
  eager: true,
  import: "default",
  query: "?w=1280&format=webp",
});
const srcSets = import.meta.glob("../images/**/*.{jpg,jpeg,png,gif,webp,avif,JPG,JPEG,PNG,GIF,WEBP,AVIF}", {
  eager: true,
  import: "default",
  query: "?w=320;640;1280;1920&format=webp&as=srcset",
});

// { "2026-06-coco-leo": [photo, …], "2026-06-coco-leo/bella": [photo, …], parents: [photo, …] }
const photosByFolder = {};
for (const path in mains) {
  const relative = path.slice("../images/".length);
  const folder = relative.slice(0, relative.lastIndexOf("/"));
  const photo = { name: relative.slice(folder.length + 1), src: mains[path], srcSet: srcSets[path], thumb: thumbs[path] };
  if (!photosByFolder[folder]) photosByFolder[folder] = [];
  // Identical files share one built URL; show them once.
  if (!photosByFolder[folder].some((p) => p.src === photo.src)) photosByFolder[folder].push(photo);
}

export function getFolderPhotos(folder) {
  return photosByFolder[folder] ?? [];
}

export function getPhoto(folder, fileName) {
  return getFolderPhotos(folder).find((photo) => photo.name === fileName) ?? null;
}
