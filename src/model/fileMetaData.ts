// FileMetadata.js
import mongoose from "mongoose";

const fileMetadataSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileExtension: { type: String, required: true },
  fileSize: { type: Number, required: true },
});

const FileMetadata = mongoose.model("FileMetadata", fileMetadataSchema);

export default FileMetadata;
