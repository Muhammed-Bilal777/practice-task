import { buildSearchCriteria } from "./seachCreteria";

describe("buildSearchCriteria", () => {
  it("should build search criteria with all parameters", () => {
    const query = {
      fileName: "file1",
      fileExtension: "txt",
      fileSize: "100",
      minSize: "50",
      maxSize: "200",
    };

    const expected = {
      $and: [
        { fileName: { $regex: new RegExp("file1", "i") } },
        { fileExtension: "txt" },
        { fileSize: 100 },
        { fileSize: { $gte: 50 } },
        { fileSize: { $lte: 200 } },
      ],
    };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should return empty $and array when no parameters are provided", () => {
    const query = {};

    const expected = { $and: [] };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should build search criteria with only fileName", () => {
    const query = { fileName: "file1" };

    const expected = {
      $and: [{ fileName: { $regex: new RegExp("file1", "i") } }],
    };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should build search criteria with fileExtension and fileSize", () => {
    const query = { fileExtension: "txt", fileSize: "150" };

    const expected = {
      $and: [{ fileExtension: "txt" }, { fileSize: 150 }],
    };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should handle minSize and maxSize as expected", () => {
    const query = { minSize: "100", maxSize: "500" };

    const expected = {
      $and: [{ fileSize: { $gte: 100 } }, { fileSize: { $lte: 500 } }],
    };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should return search criteria with empty or invalid fileName", () => {
    const query = { fileName: "" };

    const expected = { $and: [] };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });

  it("should ignore empty or undefined parameters", () => {
    const query = {
      fileName: undefined,
      fileExtension: "",
      fileSize: "0",
      minSize: undefined,
      maxSize: undefined,
    };

    const expected = {
      $and: [{ fileSize: 0 }],
    };

    const result = buildSearchCriteria(query);

    expect(result).toEqual(expected);
  });
});
