// Every photo under src/images, imported at build time. Vite hands the paths over
// sorted by name, so each folder's photos come in file-name order.
const imageModules = import.meta.glob("../images/**/*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}", {
  eager: true,
});

// { "2026-06-coco-leo": [...], bella: [...], parents: [...] } — keyed by the folder each photo sits in
export function getImagesByFolder() {
  const folders = {};

  for (const path in imageModules) {
    const src = imageModules[path].default;
    const parts = path.split("/");
    const folder = parts[parts.length - 2];

    if (!folders[folder]) folders[folder] = [];
    if (!folders[folder].includes(src)) folders[folder].push(src);
  }

  return folders;
}

// getPhotoSrc("parents", "coco.jpg") → the built URL, or null if there's no such file
export function getPhotoSrc(folder, fileName) {
  return imageModules[`../images/${folder}/${fileName}`]?.default ?? null;
}
