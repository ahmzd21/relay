import { v2 as cloudinary } from 'cloudinary';

cloudinary.config();

export default cloudinary;

export function extractPublicId(url: string): string | null {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.findIndex((p) => p === 'upload');
  if (uploadIndex === -1) return null;
  const filePart = parts[parts.length - 1];
  const folderPart = parts.slice(uploadIndex + 1, -1).join('/');
  const publicId = filePart ? filePart.replace(/\.[^.]+$/, '') : null;
  if (!publicId) return null;
  return folderPart ? `${folderPart}/${publicId}` : publicId;
}
