/**
 * 图片缓存服务
 * 用于在内存中缓存大量图片数据，避免 localStorage 超限
 */

interface ImageCacheEntry {
  data: string;
  timestamp: number;
  size: number;
}

class ImageCacheService {
  private cache = new Map<string, ImageCacheEntry>();
  private maxSize = 50 * 1024 * 1024; // 50MB 内存限制
  private currentSize = 0;

  /**
   * 生成缓存键
   */
  private generateKey(productId: string, skuId: string, imageIndex: number): string {
    return `${productId}:${skuId}:${imageIndex}`;
  }

  /**
   * 保存图片到缓存
   */
  saveImage(productId: string, skuId: string, imageIndex: number, imageData: string): boolean {
    const key = this.generateKey(productId, skuId, imageIndex);
    const size = imageData.length;

    // 检查是否超过内存限制
    if (this.currentSize + size > this.maxSize) {
      console.warn('[ImageCache] 内存缓存已满，清理最旧的图片');
      this.evictOldest();
    }

    // 删除旧的条目
    const oldEntry = this.cache.get(key);
    if (oldEntry) {
      this.currentSize -= oldEntry.size;
    }

    // 保存新的条目
    this.cache.set(key, {
      data: imageData,
      timestamp: Date.now(),
      size,
    });
    this.currentSize += size;

    console.log(`[ImageCache] 保存图片: ${key}, 大小: ${(size / 1024).toFixed(2)}KB, 总大小: ${(this.currentSize / (1024 * 1024)).toFixed(2)}MB`);
    return true;
  }

  /**
   * 获取缓存的图片
   */
  getImage(productId: string, skuId: string, imageIndex: number): string | null {
    const key = this.generateKey(productId, skuId, imageIndex);
    const entry = this.cache.get(key);
    if (entry) {
      // 更新访问时间
      entry.timestamp = Date.now();
      return entry.data;
    }
    return null;
  }

  /**
   * 清理最旧的图片
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.currentSize -= entry.size;
        this.cache.delete(oldestKey);
        console.log(`[ImageCache] 清理图片: ${oldestKey}`);
      }
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
    console.log('[ImageCache] 已清空所有缓存');
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      count: this.cache.size,
      size: this.currentSize,
      sizeMB: (this.currentSize / (1024 * 1024)).toFixed(2),
      maxSize: this.maxSize,
      maxSizeMB: (this.maxSize / (1024 * 1024)).toFixed(2),
    };
  }
}

export const imageCache = new ImageCacheService();
