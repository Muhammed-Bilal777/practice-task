export const buildSearchCriteria = (query: any) => {
  const { fileName, fileExtension, fileSize, minSize, maxSize } = query;

  const searchCriteria: { $and: Array<{ [key: string]: any }> } = { $and: [] };

  if (fileName) {
    searchCriteria.$and.push({
      fileName: { $regex: new RegExp(fileName, "i") },
    });
  }

  if (fileExtension) {
    searchCriteria.$and.push({ fileExtension });
  }

  if (fileSize) {
    searchCriteria.$and.push({ fileSize: Number(fileSize) });
  }

  if (minSize) {
    searchCriteria.$and.push({ fileSize: { $gte: Number(minSize) } });
  }

  if (maxSize) {
    searchCriteria.$and.push({ fileSize: { $lte: Number(maxSize) } });
  }

  return searchCriteria;
};
