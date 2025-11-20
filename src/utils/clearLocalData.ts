/**
 * 清空所有本地数据工具
 * 用于清除 localStorage 中的所有数据
 */

/**
 * 所有需要清空的 localStorage 键
 */
const LOCAL_STORAGE_KEYS = [
  'mock-products',              // 商品数据
  'users',                       // 用户数据
  'local_orders',                // 订单数据
  'furniture_favorites',         // 收藏数据
  'cart',                        // 购物车数据
  'packages',                    // 套餐数据
  'furniture_materials',         // 素材数据
  'notifications',               // 通知数据
  'furniture_compare',           // 对比数据
  'auth-storage',                // 认证数据
  'test_users',                  // 测试用户
  'customer_orders',             // 客户订单
];

/**
 * 清空所有本地数据
 */
export const clearAllLocalData = () => {
  try {
    console.log('🗑️ 开始清空所有本地数据...');
    
    let clearedCount = 0;
    
    // 清空指定的键
    LOCAL_STORAGE_KEYS.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`  ✓ 已清空: ${key}`);
      }
    });

    // 清空所有剩余的键（以防有遗漏）
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (!LOCAL_STORAGE_KEYS.includes(key)) {
        localStorage.removeItem(key);
        clearedCount++;
        console.log(`  ✓ 已清空: ${key}`);
      }
    });

    console.log('');
    console.log('✅ 所有本地数据已清空！');
    console.log(`   共清空 ${clearedCount} 个数据项`);
    console.log('');
    console.log('📝 后续说明：');
    console.log('   • 所有数据现在都将保存到云端数据库');
    console.log('   • 请刷新页面重新开始');
    console.log('   • 所有操作都会自动同步到服务器');
    console.log('');

    return true;
  } catch (error) {
    console.error('❌ 清空数据失败:', error);
    return false;
  }
};

/**
 * 清空特定的本地数据
 */
export const clearSpecificLocalData = (keys: string[]) => {
  try {
    console.log(`🗑️ 清空指定的本地数据...`);
    
    keys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`  ✓ 已清空: ${key}`);
      }
    });

    console.log('✅ 指定数据已清空！');
    return true;
  } catch (error) {
    console.error('❌ 清空数据失败:', error);
    return false;
  }
};

/**
 * 获取本地数据统计
 */
export const getLocalDataStats = () => {
  const stats = {
    totalItems: 0,
    totalSize: 0,
    items: [] as Array<{ key: string; size: number }>,
  };

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        
        stats.items.push({ key, size });
        stats.totalItems++;
        stats.totalSize += size;
      }
    }

    return stats;
  } catch (error) {
    console.error('获取本地数据统计失败:', error);
    return stats;
  }
};

/**
 * 显示本地数据统计
 */
export const showLocalDataStats = () => {
  const stats = getLocalDataStats();

  console.log('');
  console.log('📊 本地数据统计：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  总项数: ${stats.totalItems}`);
  console.log(`  总大小: ${(stats.totalSize / 1024).toFixed(2)} KB`);
  console.log('');
  console.log('  详细信息：');
  
  stats.items.forEach(({ key, size }) => {
    console.log(`    • ${key}: ${(size / 1024).toFixed(2)} KB`);
  });

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');

  return stats;
};

/**
 * 验证本地数据是否已清空
 */
export const verifyLocalDataCleared = () => {
  const stats = getLocalDataStats();
  
  if (stats.totalItems === 0) {
    console.log('✅ 验证成功：所有本地数据已清空');
    return true;
  } else {
    console.log('⚠️ 验证失败：仍有本地数据存在');
    showLocalDataStats();
    return false;
  }
};

/**
 * 初始化本地数据清空（在应用启动时调用）
 */
export const initLocalDataCleanup = () => {
  // 检查是否需要清空数据
  const shouldClear = localStorage.getItem('CLEAR_LOCAL_DATA_ON_STARTUP');
  
  if (shouldClear === 'true') {
    console.log('🔄 检测到需要清空本地数据的标记...');
    clearAllLocalData();
    localStorage.removeItem('CLEAR_LOCAL_DATA_ON_STARTUP');
    
    // 刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }
};
