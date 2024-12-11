import FileMetadata from "../../model/fileMetaData";
import mongoose from "mongoose";

jest.mock("mongoose", () => ({
  Schema: jest.fn(),
  model: jest.fn(),
}));

describe("FileMetadata Model", () => {
  it("should create a model with the correct schema", () => {
     const mockSchema = {
      fileName: { type: String, required: true },
      fileExtension: { type: String, required: true },
      fileSize: { type: Number, required: true },
    };

    const mockSchemaInstance = { ...mockSchema };
    (mongoose.Schema as unknown as jest.Mock).mockReturnValue(
      mockSchemaInstance
    );

    const mockModel = jest.fn();
    (mongoose.model as jest.Mock).mockReturnValue(mockModel);

    const fileMetadataModel = require("../../model/fileMetaData").default;

    expect(mongoose.Schema).toHaveBeenCalledWith({
      fileName: { type: String, required: true },
      fileExtension: { type: String, required: true },
      fileSize: { type: Number, required: true },
    });

    expect(mongoose.model).toHaveBeenCalledWith(
      "FileMetadata",
      mockSchemaInstance
    );

    expect(fileMetadataModel).toBe(mockModel);
  });
});
