const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE_URL = 'http://localhost:8080';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function getToken() {
  try {
    log('\n📝 获取认证令牌...', 'cyan');
    const response = await axios.post(`${API_BASE_URL}/api/auth/wxlogin`, {
      code: 'test_code_123'
    });

    if (response.data.success) {
      log('✅ 令牌获取成功', 'green');
      return response.data.data.token;
    } else {
      log('❌ 令牌获取失败', 'red');
      return null;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return null;
  }
}

async function createTestImage() {
  try {
    log('\n📸 创建测试图片...', 'cyan');
    
    // 创建一个简单的 PNG 图片（1x1 像素）
    const pngData = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0x99, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x03, 0x01, 0x01, 0x00, 0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00,
      0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82
    ]);

    const testImagePath = path.join(__dirname, 'test-image.png');
    fs.writeFileSync(testImagePath, pngData);
    log('✅ 测试图片创建成功', 'green');
    return testImagePath;
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return null;
  }
}

async function testFileUpload(token, imagePath) {
  try {
    log('\n📤 测试文件上传...', 'cyan');
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);

    const response = await axios.post(`${API_BASE_URL}/api/files/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.data.success) {
      log('✅ 文件上传成功', 'green');
      log(`   文件 ID: ${response.data.data.fileId}`, 'blue');
      log(`   文件 URL: ${response.data.data.url}`, 'blue');
      return response.data.data;
    } else {
      log('❌ 文件上传失败', 'red');
      return null;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return null;
  }
}

async function testFileDownload(fileId) {
  try {
    log('\n📥 测试文件下载...', 'cyan');
    
    const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}`, {
      responseType: 'arraybuffer'
    });

    if (response.status === 200) {
      log('✅ 文件下载成功', 'green');
      log(`   文件大小: ${response.data.length} 字节`, 'blue');
      return true;
    } else {
      log('❌ 文件下载失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function testFileInfo(fileId) {
  try {
    log('\n📋 测试获取文件信息...', 'cyan');
    
    const response = await axios.get(`${API_BASE_URL}/api/files/${fileId}/info`);

    if (response.data.success) {
      log('✅ 文件信息获取成功', 'green');
      log(`   文件名: ${response.data.data.filename}`, 'blue');
      log(`   MIME 类型: ${response.data.data.mimeType}`, 'blue');
      log(`   文件大小: ${response.data.data.size} 字节`, 'blue');
      return true;
    } else {
      log('❌ 文件信息获取失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function testProductUpload(token, productId, imagePath) {
  try {
    log('\n🛍️  测试产品缩略图上传...', 'cyan');
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);

    const response = await axios.post(
      `${API_BASE_URL}/api/products/${productId}/upload-thumbnail`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      log('✅ 产品缩略图上传成功', 'green');
      log(`   产品 ID: ${response.data.data.productId}`, 'blue');
      log(`   缩略图 URL: ${response.data.data.thumbnail}`, 'blue');
      return true;
    } else {
      log('❌ 产品缩略图上传失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function testCategoryUpload(token, categoryId, imagePath) {
  try {
    log('\n📁 测试分类图片上传...', 'cyan');
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);

    const response = await axios.post(
      `${API_BASE_URL}/api/categories/${categoryId}/upload-image`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      log('✅ 分类图片上传成功', 'green');
      log(`   分类 ID: ${response.data.data.categoryId}`, 'blue');
      log(`   图片 URL: ${response.data.data.image}`, 'blue');
      return true;
    } else {
      log('❌ 分类图片上传失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function testPackageUpload(token, packageId, imagePath) {
  try {
    log('\n📦 测试套餐缩略图上传...', 'cyan');
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);

    const response = await axios.post(
      `${API_BASE_URL}/api/packages/${packageId}/upload-thumbnail`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      log('✅ 套餐缩略图上传成功', 'green');
      log(`   套餐 ID: ${response.data.data.packageId}`, 'blue');
      log(`   缩略图 URL: ${response.data.data.thumbnail}`, 'blue');
      return true;
    } else {
      log('❌ 套餐缩略图上传失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function testBargainUpload(token, bargainId, imagePath) {
  try {
    log('\n💰 测试砍价缩略图上传...', 'cyan');
    
    const formData = new FormData();
    const fileStream = fs.createReadStream(imagePath);
    formData.append('file', fileStream);

    const response = await axios.post(
      `${API_BASE_URL}/api/bargains/${bargainId}/upload-thumbnail`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (response.data.success) {
      log('✅ 砍价缩略图上传成功', 'green');
      log(`   砍价 ID: ${response.data.data.bargainId}`, 'blue');
      log(`   缩略图 URL: ${response.data.data.thumbnail}`, 'blue');
      return true;
    } else {
      log('❌ 砍价缩略图上传失败', 'red');
      return false;
    }
  } catch (err) {
    log(`❌ 错误: ${err.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🌐 云端存储功能测试', 'cyan');
  log('='.repeat(60), 'cyan');

  // 获取令牌
  const token = await getToken();
  if (!token) {
    log('\n❌ 无法获取认证令牌，测试中止', 'red');
    return;
  }

  // 创建测试图片
  const imagePath = await createTestImage();
  if (!imagePath) {
    log('\n❌ 无法创建测试图片，测试中止', 'red');
    return;
  }

  // 测试文件上传
  const fileData = await testFileUpload(token, imagePath);
  if (!fileData) {
    log('\n❌ 文件上传失败，测试中止', 'red');
    fs.unlinkSync(imagePath);
    return;
  }

  // 测试文件下载
  await testFileDownload(fileData.fileId);

  // 测试文件信息
  await testFileInfo(fileData.fileId);

  // 获取产品列表以获取产品 ID
  try {
    log('\n📝 获取产品列表...', 'cyan');
    const productsResponse = await axios.get(`${API_BASE_URL}/api/products?pageSize=1`);
    if (productsResponse.data.success && productsResponse.data.data.length > 0) {
      const productId = productsResponse.data.data[0]._id;
      await testProductUpload(token, productId, imagePath);
    } else {
      log('⚠️  没有可用的产品用于测试', 'yellow');
    }
  } catch (err) {
    log(`⚠️  获取产品列表失败: ${err.message}`, 'yellow');
  }

  // 获取分类列表以获取分类 ID
  try {
    log('\n📝 获取分类列表...', 'cyan');
    const categoriesResponse = await axios.get(`${API_BASE_URL}/api/categories?pageSize=1`);
    if (categoriesResponse.data.success && categoriesResponse.data.data.length > 0) {
      const categoryId = categoriesResponse.data.data[0]._id;
      await testCategoryUpload(token, categoryId, imagePath);
    } else {
      log('⚠️  没有可用的分类用于测试', 'yellow');
    }
  } catch (err) {
    log(`⚠️  获取分类列表失败: ${err.message}`, 'yellow');
  }

  // 获取套餐列表以获取套餐 ID
  try {
    log('\n📝 获取套餐列表...', 'cyan');
    const packagesResponse = await axios.get(`${API_BASE_URL}/api/packages?pageSize=1`);
    if (packagesResponse.data.success && packagesResponse.data.data.length > 0) {
      const packageId = packagesResponse.data.data[0]._id;
      await testPackageUpload(token, packageId, imagePath);
    } else {
      log('⚠️  没有可用的套餐用于测试', 'yellow');
    }
  } catch (err) {
    log(`⚠️  获取套餐列表失败: ${err.message}`, 'yellow');
  }

  // 获取砍价列表以获取砍价 ID
  try {
    log('\n📝 获取砍价列表...', 'cyan');
    const bargainsResponse = await axios.get(`${API_BASE_URL}/api/bargains?pageSize=1`);
    if (bargainsResponse.data.success && bargainsResponse.data.data.length > 0) {
      const bargainId = bargainsResponse.data.data[0]._id;
      await testBargainUpload(token, bargainId, imagePath);
    } else {
      log('⚠️  没有可用的砍价用于测试', 'yellow');
    }
  } catch (err) {
    log(`⚠️  获取砍价列表失败: ${err.message}`, 'yellow');
  }

  // 清理测试文件
  fs.unlinkSync(imagePath);

  log('\n' + '='.repeat(60), 'cyan');
  log('✅ 云端存储功能测试完成', 'green');
  log('='.repeat(60), 'cyan');
  log('\n📖 详细文档请查看: CLOUD_STORAGE_GUIDE.md\n', 'blue');
}

// 运行测试
runTests().catch(err => {
  log(`\n❌ 测试出错: ${err.message}`, 'red');
  process.exit(1);
});
