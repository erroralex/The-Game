const IMAGE_SRC = "assets/Gemini_Generated_Image_potvyfpotvyfpotv.png";

const image = new Image();
let imageLoaded = false;
image.onload = () => {
  imageLoaded = true;
};
image.src = IMAGE_SRC;

export function drawNarrator(ctx, width, height) {
  ctx.clearRect(0, 0, width, height);
  if (!imageLoaded) return;

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, 0, 0, width, height);
}
