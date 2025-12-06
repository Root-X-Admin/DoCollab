// server/src/controllers/uploadController.js
import cloudinary from "../config/cloudinary.js";

export const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Extra safety: 100MB limit
    const maxSize = 100 * 1024 * 1024;
    if (size > maxSize) {
      return res
        .status(400)
        .json({ message: "File upto 100MB are allowed." });
    }

    const folder = "docollab_media";

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto", // image, video, raw (xlsx, zip, pdf, etc.)
      },
      (err, result) => {
        if (err || !result) {
          console.error("Cloudinary upload error:", err || "No result");
          return res.status(500).json({
            message: "Upload failed",
            error: err?.message || "Cloudinary error",
          });
        }

        // Decide kind for the frontend
        let kind = "file";
        if (result.resource_type === "image") kind = "image";
        else if (result.resource_type === "video") kind = "video";

        // Default URL
        let url = result.secure_url;

        // For generic files (xlsx, pdf, zip, etc.), build an attachment URL
        // so the browser downloads it with the RIGHT name + extension.
        if (kind === "file") {
          url = cloudinary.url(result.public_id, {
            resource_type: result.resource_type, // usually "raw" here
            secure: true,
            flags: "attachment",          // fl_attachment
            filename: originalname,       // fl_attachment:<filename>
          });
        }

        return res.status(200).json({
          message: "Uploaded successfully",
          url,
          kind,
          mimeType: mimetype,
          fileName: originalname,
          fileSize: size,
          publicId: result.public_id,
        });
      }
    );

    // Pipe buffer into Cloudinary
    uploadStream.end(buffer);
  } catch (err) {
    console.error("Upload controller error:", err);
    return res.status(500).json({
      message: "Upload failed",
      error: err.message,
    });
  }
};
