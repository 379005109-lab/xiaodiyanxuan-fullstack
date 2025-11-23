// 简单测试API调用
import { getAllMaterials } from './src/services/materialService.js';

console.log('Testing getAllMaterials...');
const result = getAllMaterials();
console.log('Result type:', typeof result);
console.log('Is Promise:', result instanceof Promise);
console.log('Has filter:', typeof result.filter);

if (result instanceof Promise) {
  result.then(data => {
    console.log('Resolved data type:', typeof data);
    console.log('Is array:', Array.isArray(data));
    console.log('Has filter:', typeof data.filter);
  }).catch(err => {
    console.error('Error:', err);
  });
}
