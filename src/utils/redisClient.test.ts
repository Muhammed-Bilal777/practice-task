// import Redis from "ioredis";
// import { redisClientInstance } from "../../utils/redisClient";

// jest.mock("ioredis", () => {
//   const mockSet = jest.fn();
//   const mockGet = jest.fn();
//   const mockDel = jest.fn();

//   return jest.fn().mockImplementation(() => ({
//     set: mockSet,
//     get: mockGet,
//     del: mockDel,
//   }));
// });
//  const redisMock = (redisClientInstance as any).redis;
// describe("RedisClient", () => {

//   beforeAll(() => {

//       let mockSet: jest.Mock;
//       let mockGet: jest.Mock;
//       let mockDel: jest.Mock;

//     mockSet = redisMock.set;
//     mockGet = redisMock.get;
//     mockDel = redisMock.del;
//   });

//   describe("generateUniqueCacheKey", () => {
//     it("should generate a unique cache key based on fileName, fileSize, and extension", () => {
//       const queryParams = {
//         fileName: "document.txt",
//         fileSize: "1024",
//         extension: "txt",
//       };

//       const result = redisClientInstance.generateUniqueCacheKey(queryParams);

//       expect(result).toBe(
//         "files:cache:extension:txt|fileName:document.txt|fileSize:1024"
//       );
//     });

//     it("should handle all the query parameters (size, gte, lte) correctly", () => {
//       const queryParams = {
//         fileName: "image.jpg",
//         fileSize: "2048",
//         extension: "jpg",

//         gte: "100",
//         lte: "5000",
//       };

//       const result = redisClientInstance.generateUniqueCacheKey(queryParams);

//       expect(result).toBe(
//         "files:cache:extension:jpg|fileName:image.jpg|fileSize:2048|gte:100|lte:5000|size:large"
//       );
//     });

//     it("should ignore undefined query parameters and generate a key with the remaining parameters", () => {
//       const queryParams = {
//         fileName: "video.mp4",
//         fileSize: undefined,
//         extension: "mp4",

//         gte: "500",
//         lte: "10000",
//       };

//       const result = redisClientInstance.generateUniqueCacheKey(queryParams);

//       expect(result).toBe(
//         "files:cache:extension:mp4|fileName:video.mp4|gte:500|lte:10000|size:medium"
//       );
//     });

//     it("should return an empty key if no valid query parameters are provided", () => {
//       const queryParams = {};

//       const result = redisClientInstance.generateUniqueCacheKey(queryParams);

//       expect(result).toBe("files:cache:");
//     });
//   });

//   describe("cacheData", () => {
//     it("should cache data with the correct key and expiration for fileName, fileSize, and extension", async () => {
//       const key =
//         "files:cache:extension:txt|fileName:document.txt|fileSize:1024";
//       const data = {
//         fileName: "document.txt",
//         fileSize: 1024,
//         extension: "txt",
//       };

//       await redisClientInstance.cacheData(key, data);

//       expect(mockSet).toHaveBeenCalledWith(
//         key,
//         JSON.stringify(data),
//         "EX",
//         3600
//       );
//     });

//     it("should cache data with the correct key and expiration for all query parameters (size, gte, lte)", async () => {
//       const key =
//         "files:cache:extension:jpg|fileName:image.jpg|fileSize:2048|gte:100|lte:5000|size:large";
//       const data = {
//         fileName: "image.jpg",
//         fileSize: 2048,
//         extension: "jpg",

//         gte: 100,
//         lte: 5000,
//       };

//       await redisClient.cacheData(key, data);

//       expect(mockSet).toHaveBeenCalledWith(
//         key,
//         JSON.stringify(data),
//         "EX",
//         3600
//       );
//     });

//     it("should log an error if setting cache fails", async () => {
//       const key =
//         "files:cache:extension:mp4|fileName:video.mp4|gte:500|lte:10000|size:medium";
//       const data = {
//         fileName: "video.mp4",

//         gte: 500,
//         lte: 10000,
//       };
//       mockSet.mockRejectedValueOnce(new Error("Redis error"));

//       const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

//       await redisClientInstance.cacheData(key, data);

//       expect(consoleErrorSpy).toHaveBeenCalledWith(
//         `Error setting cache for key: ${key}`,
//         expect.any(Error)
//       );

//       consoleErrorSpy.mockRestore();
//     });
//   });

//   describe("getCachedData", () => {
//     it("should return cached data if it exists", async () => {
//       const key =
//         "files:cache:extension:jpg|fileName:image.jpg|fileSize:2048|gte:100|lte:5000|size:large";
//       const data = {
//         fileName: "image.jpg",
//         fileSize: 2048,
//         extension: "jpg",

//         gte: 100,
//         lte: 5000,
//       };
//       mockGet.mockResolvedValueOnce(JSON.stringify(data));

//       const result = await redisClientInstance.getCachedData(key);

//       expect(result).toEqual(data);
//     });

//     it("should return null if no cached data exists", async () => {
//       const key =
//         "files:cache:extension:mp4|fileName:video.mp4|gte:500|lte:10000|size:medium";
//       mockGet.mockResolvedValueOnce(null);

//       const result = await redisClientInstance.getCachedData(key);

//       expect(result).toBeNull();
//     });

//     it("should log an error if fetching cache fails", async () => {
//       const key =
//         "files:cache:extension:jpg|fileName:image.jpg|fileSize:2048|gte:100|lte:5000|size:large";
//       mockGet.mockRejectedValueOnce(new Error("Redis error"));

//       const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

//       const result = await redisClientInstance.getCachedData(key);

//       expect(consoleErrorSpy).toHaveBeenCalledWith(
//         `Error fetching cache for key: ${key}`,
//         expect.any(Error)
//       );

//       consoleErrorSpy.mockRestore();
//     });
//   });
// });

import { RedisClient, redisClientInstance } from "./redisClient";

import Redis from "ioredis";

jest.mock("ioredis"); // Mock the Redis module

describe.only("RedisClient", () => {
  let redisMock: jest.Mocked<Redis>;

  beforeEach(() => {
    // Reset the mock before each test
    redisMock = new Redis() as jest.Mocked<Redis>;

  });

  it("it should generate the key for caching", async () => {
    const query = {
      fileName: "node",
    };
    const uniqueKey = redisClientInstance.generateUniqueCacheKey(query);
    expect(uniqueKey).toBe("files:cache:fileName:node");
  });

  it("should cache the data based on query params", async () => {
    const query = {
      fileName: "node",
    };
    const data = {
      fileName: "node",
      fileExtension: "png",
      fileSize: 1024,
    };
    const uniqueKey = redisClientInstance.generateUniqueCacheKey(query);
    const cachedData = await redisClientInstance.cacheData(uniqueKey, data);
    expect(cachedData).toBe(true);
  });

  it("should fail the cache if the data is not found", async () => {
    const query = {
      fileName: "node",
    };
    const data = {
      fileName: "node",
      fileExtension: "png",
      fileSize: 1024,
    };
    redisMock.set.mockRejectedValueOnce(new Error("failed to cache data"));
    const uniqueKey = redisClientInstance.generateUniqueCacheKey(query);
    const cachedData = await redisClientInstance.cacheData(uniqueKey, data);
    expect(cachedData).toBe(false);
  });
});
