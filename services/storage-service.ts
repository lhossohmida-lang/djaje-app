const MAX_DIMENSION = 900;
const JPEG_QUALITY = 0.78;
const MAX_DATA_URL_BYTES = 900 * 1024;

export async function uploadDishImage(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("الملف ليس صورة صالحة.");
  }
  return compressImageToDataUrl(file);
}

async function compressImageToDataUrl(file: File): Promise<string> {
  const bitmap = await loadImage(file);
  const { width, height } = scaleToFit(bitmap.width, bitmap.height, MAX_DIMENSION);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("تعذر إنشاء سياق الرسم.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);

  let quality = JPEG_QUALITY;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_DATA_URL_BYTES && quality > 0.4) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  return dataUrl;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("تعذر قراءة الملف."));
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("تعذر تحميل الصورة."));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function scaleToFit(width: number, height: number, max: number) {
  if (width <= max && height <= max) {
    return { width, height };
  }
  const ratio = Math.min(max / width, max / height);
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio),
  };
}
