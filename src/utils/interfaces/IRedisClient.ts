export interface IRedisClient {
  generateUniqueCacheKey(
    queryParams: Record<string, string | undefined>
  ): string;
  cacheData(key: string, data: any): Promise<void>;
  getCachedData(key: string): Promise<any | null>;
  resetCache(key?: string, data?: any): Promise<void>;
  invalidateCache(key: string): Promise<void>;
}
