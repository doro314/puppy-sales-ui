// Dynamically import ALL images from ALL subfolders under /images
const imageModules = import.meta.glob("../images/**/*.{jpg,jpeg,png,gif,JPG,JPEG,PNG,GIF}", {
  eager: true,
});

// Convert the imported modules into a structured object:
// { puppies: [img1, img2], adults: [...], seniors: [...] }
export function getImagesByFolder() {
  const folders = {};

  for (const path in imageModules) {
    const module = imageModules[path];
    const src = module.default;

    // Extract folder name: "../images/puppies/dog1.jpg" → "puppies"
    const parts = path.split("/");
    const folder = parts[parts.length - 2];

    if (!folders[folder]) folders[folder] = [];
    folders[folder].push(src);
  }

  return folders;
}
