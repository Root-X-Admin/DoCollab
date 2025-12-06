import api from "./api";

/**
 * Upload a single file to /api/upload/media
 * Returns: { url, kind, mimeType, fileName, fileSize }
 */
export async function uploadMedia(file) {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post("/upload/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return {
    url: res.data.url,
    kind: res.data.kind, // "image" | "video" (from backend) or maybe something else
    mimeType: file.type,
    fileName: file.name,
    fileSize: file.size,
    cloudinaryId: res.data.publicId || null,
  };
}
