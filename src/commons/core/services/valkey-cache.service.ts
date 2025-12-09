import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ValkeyCacheService {
  private readonly logger = new Logger(ValkeyCacheService.name);
  constructor(
    @Inject(CACHE_MANAGER) private cacheManger: Cache, //
  ) {}

  private serialize<T>(value: T): string {
    return JSON.stringify(value);
  }

  private deserialize<T>(serializedValue: string): T | undefined {
    try {
      return JSON.parse(serializedValue) as T;
    } catch (error) {
      this.logger.error(
        'Failed to deserialize cached value',
        error,
        'JSON.parse',
      );
      // 데이터가 손상된 것으로 간주하고 undefined 반환
      return undefined;
    }
  }

  async set<T>(
    key: string,
    value: T,
    expireTimeInSeconds?: number,
  ): Promise<void> {
    // 밀리초 사용
    const ttl = expireTimeInSeconds ?? 10;
    const serializedValue = this.serialize(value);

    await this.cacheManger.set(key, serializedValue, ttl * 1000);
  }

  async get<T>(key: string): Promise<T | undefined> {
    const serializedValue = await this.cacheManger.get<string>(key);

    if (!serializedValue) {
      return undefined; // 캐시 누락
    }

    return this.deserialize<T>(serializedValue);
  }

  async del(key: string): Promise<void> {
    await this.cacheManger.del(key);
  }
}

// 1. 단순 캐싱
// 2. 인증 및 세션 관리 : refreshToken entity 존재
// - 블랙리스트 구현
// 3. 횟수 제한
