// Every photo under src/images, in three sizes made at build time (vite-imagetools):
// a 320 px thumbnail, and 1280 / 1920 px for the main photo and fullscreen.
// Vite hands the paths over sorted by name, so each folder's photos come in file-name order.
// import.meta.glob needs literal arguments, which is why the pattern repeats.
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
  query: "?w=1280;1920&format=webp&as=srcset",
});

function photoAt(path) {
  return { name: path.split("/").pop(), src: mains[path], srcSet: srcSets[path], thumb: thumbs[path] };
}

// { "2026-06-coco-leo": [photo, …], bella: [photo, …], parents: [photo, …] } — keyed by the folder each photo sits in
export function getImagesByFolder() {
  const folders = {};

  for (const path in mains) {
    const parts = path.split("/");
    const folder = parts[parts.length - 2];
    if (!folders[folder]) folders[folder] = [];
    const photo = photoAt(path);
    // Identical files share one built URL; show them once.
    if (!folders[folder].some((p) => p.src === photo.src)) folders[folder].push(photo);
  }

  return folders;
}

// getPhotoSrc("parents", "coco.jpg") → the 1280 px URL, or null if there's no such file
export function getPhotoSrc(folder, fileName) {
  return mains[`../images/${folder}/${fileName}`] ?? null;
}
