// Shrinks a phone photo in the browser before upload so it stays under ~2 MB and loads fast on the site.
export async function resizeImage(file: File, max = 1400): Promise<{ dataUrl: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale), height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
  let quality = 0.85, dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 1_900_000 && quality > 0.5) { quality -= 0.1; dataUrl = canvas.toDataURL('image/jpeg', quality); }
  return { dataUrl, width, height };
}
