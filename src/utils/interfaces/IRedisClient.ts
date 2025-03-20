export interface IRedisClient {
  setCache(key: string, data: any): Promise<void>;
  getCache(key: string): Promise<any | null>;
  deleteCache(key?: string, data?: any): Promise<void>;
  clearCache(key: string): Promise<void>;
}
