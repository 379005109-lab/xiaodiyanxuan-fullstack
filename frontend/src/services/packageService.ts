import apiClient from '@/lib/apiClient'
import { PackagePlan, PackageProductMaterial, PackageProductOption } from '@/types'
import { getFileUrl } from '@/services/uploadService'

// 所有localStorage、假数据、旧数据结构已删除，只使用API

export const getAllPackages = async (): Promise<PackagePlan[]> => {
  try {
    // 先尝试从 API 获取套餐列表
    const response = await apiClient.get('/packages')
    const apiData = response.data.data
    
    // 如果 API 返回数据，使用 API 数据
    if (apiData && apiData.length > 0) {
      // 获取所有产品的详细信息
      const packagesWithDetails = await Promise.all(
        apiData.map(async (pkg: any) => {
          let categories: any[] = []
          
          // 优先使用新的categories结构（后端已填充完整商品信息）
          if (pkg.categories && pkg.categories.length > 0) {
            // 直接使用后端返回的categories数据，但需要从SKU提取材质信息
            categories = pkg.categories.map((cat: any) => ({
              key: cat._id || cat.name,
              name: cat.name,
              required: cat.required || 1,
              products: cat.products.map((product: any) => {
                // 从SKU中提取材质信息
                const materials: Record<string, string[]> = {}
                const materialImages: Record<string, string> = {}
                let specs = product.specs || ''
                
                if (product.skus && product.skus.length > 0) {
                  const fabricSet = new Set<string>()
                  const fillingSet = new Set<string>()
                  const frameSet = new Set<string>()
                  const legSet = new Set<string>()
                  
                  product.skus.forEach((sku: any) => {
                    // 提取材质
                    if (sku.material) {
                      if (Array.isArray(sku.material.fabric)) {
                        sku.material.fabric.forEach((f: string) => fabricSet.add(f))
                      } else if (sku.material.fabric) {
                        fabricSet.add(sku.material.fabric)
                      }
                      
                      if (Array.isArray(sku.material.filling)) {
                        sku.material.filling.forEach((f: string) => fillingSet.add(f))
                      } else if (sku.material.filling) {
                        fillingSet.add(sku.material.filling)
                      }
                      
                      if (Array.isArray(sku.material.frame)) {
                        sku.material.frame.forEach((f: string) => frameSet.add(f))
                      } else if (sku.material.frame) {
                        frameSet.add(sku.material.frame)
                      }
                      
                      if (Array.isArray(sku.material.leg)) {
                        sku.material.leg.forEach((l: string) => legSet.add(l))
                      } else if (sku.material.leg) {
                        legSet.add(sku.material.leg)
                      }
                    }
                    
                    // 提取材质图片
                    if (sku.images && sku.images.length > 0) {
                      const skuImage = getFileUrl(sku.images[0])
                      if (sku.material) {
                        if (Array.isArray(sku.material.fabric)) {
                          sku.material.fabric.forEach((f: string) => {
                            if (!materialImages[f]) materialImages[f] = skuImage
                          })
                        }
                        if (Array.isArray(sku.material.filling)) {
                          sku.material.filling.forEach((f: string) => {
                            if (!materialImages[f]) materialImages[f] = skuImage
                          })
                        }
                        if (Array.isArray(sku.material.frame)) {
                          sku.material.frame.forEach((f: string) => {
                            if (!materialImages[f]) materialImages[f] = skuImage
                          })
                        }
                        if (Array.isArray(sku.material.leg)) {
                          sku.material.leg.forEach((l: string) => {
                            if (!materialImages[l]) materialImages[l] = skuImage
                          })
                        }
                      }
                    }
                  })
                  
                  if (fabricSet.size > 0) materials['fabric'] = Array.from(fabricSet)
                  if (fillingSet.size > 0) materials['filling'] = Array.from(fillingSet)
                  if (frameSet.size > 0) materials['frame'] = Array.from(frameSet)
                  if (legSet.size > 0) materials['leg'] = Array.from(legSet)
                  
                  console.log('🔥 [PackageService] 提取材质 for', product.name, ':', materials)
                  console.log('🔥 [PackageService] 材质图片:', materialImages)
                }
                
                return {
                  id: product.id,
                  name: product.name,
                  category: cat.name,
                  basePrice: product.basePrice || 0,
                  packagePrice: product.packagePrice || product.basePrice,
                  image: product.image ? getFileUrl(product.image) : '/placeholder.svg',
                  images: product.image ? [getFileUrl(product.image)] : [],
                  specs: specs,
                  description: product.description || '',
                  materials: materials,
                  materialImages: materialImages,
                  skus: product.skus || [],
                  specifications: product.specifications,
                  videos: product.videos
                }
              })
            }))
          }
          // 如果没有新的categories结构，按旧方式处理products数组
          else if (pkg.products && pkg.products.length > 0) {
            // 获取所有产品详情
            const productDetails = await Promise.all(
              pkg.products.map(async (item: any) => {
                try {
                  const prodResponse = await apiClient.get(`/products/${item.productId}`)
                  return {
                    ...prodResponse.data.data,
                    packageQuantity: item.quantity || 1,
                    packagePrice: item.price
                  }
                } catch (err) {
                  console.error(`获取产品${item.productId}失败:`, err)
                  return null
                }
              })
            )
            
            // 过滤掉获取失败的产品
            const validProducts = productDetails.filter(p => p !== null)
            
            // 按类别分组
            const categoryMap: Record<string, any[]> = {}
            validProducts.forEach(product => {
              const category = product.category || product.categoryName || '其他'
              if (!categoryMap[category]) {
                categoryMap[category] = []
              }
              
              // 从商品的skus中提取材质信息和规格
              const materials: Record<string, string[]> = {}
              const materialImages: Record<string, string> = {}
              let specs = ''
              
              if (product.skus && product.skus.length > 0) {
                // 收集所有SKU的材质和对应的图片
                const fabricSet = new Set<string>()
                const fillingSet = new Set<string>()
                const frameSet = new Set<string>()
                const legSet = new Set<string>()
                
                // 收集规格信息：尺寸
                const specsArray: string[] = []
                
                product.skus.forEach((sku: any) => {
                  // 提取材质（材质是数组）
                  if (sku.material) {
                    if (Array.isArray(sku.material.fabric)) {
                      sku.material.fabric.forEach((f: string) => fabricSet.add(f))
                    } else if (sku.material.fabric) {
                      fabricSet.add(sku.material.fabric)
                    }
                    
                    if (Array.isArray(sku.material.filling)) {
                      sku.material.filling.forEach((f: string) => fillingSet.add(f))
                    } else if (sku.material.filling) {
                      fillingSet.add(sku.material.filling)
                    }
                    
                    if (Array.isArray(sku.material.frame)) {
                      sku.material.frame.forEach((f: string) => frameSet.add(f))
                    } else if (sku.material.frame) {
                      frameSet.add(sku.material.frame)
                    }
                    
                    if (Array.isArray(sku.material.leg)) {
                      sku.material.leg.forEach((l: string) => legSet.add(l))
                    } else if (sku.material.leg) {
                      legSet.add(sku.material.leg)
                    }
                  }
                  
                  // 提取规格：从length/width/height字段（单位mm，转换为cm）
                  if (sku.length && sku.width && sku.height) {
                    const l = Math.round(sku.length / 10)
                    const w = Math.round(sku.width / 10)
                    const h = Math.round(sku.height / 10)
                    const size = `${l}x${w}x${h}cm`
                    if (!specsArray.includes(size)) {
                      specsArray.push(size)
                    }
                  }
                  
                  // 提取材质对应的图片（材质是数组）
                  if (sku.images && sku.images.length > 0) {
                    const skuImage = getFileUrl(sku.images[0])
                    // 为每个材质保存图片
                    if (sku.material) {
                      // fabric
                      if (Array.isArray(sku.material.fabric)) {
                        sku.material.fabric.forEach((f: string) => {
                          if (!materialImages[f]) materialImages[f] = skuImage
                        })
                      } else if (sku.material.fabric && !materialImages[sku.material.fabric]) {
                        materialImages[sku.material.fabric] = skuImage
                      }
                      
                      // filling
                      if (Array.isArray(sku.material.filling)) {
                        sku.material.filling.forEach((f: string) => {
                          if (!materialImages[f]) materialImages[f] = skuImage
                        })
                      } else if (sku.material.filling && !materialImages[sku.material.filling]) {
                        materialImages[sku.material.filling] = skuImage
                      }
                      
                      // frame
                      if (Array.isArray(sku.material.frame)) {
                        sku.material.frame.forEach((f: string) => {
                          if (!materialImages[f]) materialImages[f] = skuImage
                        })
                      } else if (sku.material.frame && !materialImages[sku.material.frame]) {
                        materialImages[sku.material.frame] = skuImage
                      }
                      
                      // leg
                      if (Array.isArray(sku.material.leg)) {
                        sku.material.leg.forEach((l: string) => {
                          if (!materialImages[l]) materialImages[l] = skuImage
                        })
                      } else if (sku.material.leg && !materialImages[sku.material.leg]) {
                        materialImages[sku.material.leg] = skuImage
                      }
                    }
                  }
                })
                
                if (fabricSet.size > 0) materials['fabric'] = Array.from(fabricSet)
                if (fillingSet.size > 0) materials['filling'] = Array.from(fillingSet)
                if (frameSet.size > 0) materials['frame'] = Array.from(frameSet)
                if (legSet.size > 0) materials['leg'] = Array.from(legSet)
                
                // 构建规格字符串
                if (specsArray.length > 0) {
                  specs = `尺寸：${specsArray.join('、')}`
                }
              }
              
              // 如果没有从SKU提取到规格，使用description
              if (!specs && product.description) {
                specs = product.description
              }
              
              // 保存完整的商品数据，包括SKU数组
              categoryMap[category].push({
                id: product._id,
                name: product.name,
                category: product.category || product.categoryName,
                basePrice: product.basePrice || 0,
                packagePrice: product.packagePrice,
                image: product.images?.[0] ? getFileUrl(product.images[0]) : '/placeholder.svg',
                images: product.images ? product.images.map((img: string) => getFileUrl(img)) : [],
                specs: specs,
                description: product.description || '',
                materials: materials,
                materialImages: materialImages,
                // 保存完整的SKU数组
                skus: product.skus || [],
                // 其他商品信息
                specifications: product.specifications,
                videos: product.videos
              })
            })
            
            // 转换为categories格式
            // 如果套餐有保存categories信息，使用它的required，否则默认为1
            const savedCategories = pkg.categories || [];
            Object.entries(categoryMap).forEach(([categoryName, products]) => {
              const savedCategory = savedCategories.find((c: any) => c.name === categoryName);
              categories.push({
                key: categoryName,
                name: categoryName,
                required: savedCategory?.required || 1,  // 使用保存的required值，默认为1
                products: products
              })
            })
          }
          
          return {
            id: pkg._id,
            name: pkg.name,
            price: pkg.basePrice || 0,
            banner: pkg.thumbnail ? getFileUrl(pkg.thumbnail) : (pkg.images?.[0] ? getFileUrl(pkg.images[0]) : '/placeholder.svg'),
            gallery: pkg.images && pkg.images.length > 0 ? pkg.images.map((img: string) => getFileUrl(img)) : [pkg.thumbnail ? getFileUrl(pkg.thumbnail) : '/placeholder.svg'],
            tags: categories.map(c => c.name),
            description: pkg.description || '',
            status: pkg.status || 'active',
            categories: categories
          }
        })
      )
      
      return packagesWithDetails
    }
    
    // API返回空数据
    console.warn('📦 API返回空数据')
    return []
  } catch (error) {
    console.error('获取套餐列表失败', error)
    return []
  }
}

export const getPackageById = async (id: string): Promise<PackagePlan | null> => {
  try {
    // 先尝试从 API 获取
    const response = await apiClient.get(`/api/packages/${id}`)
    const pkg = response.data.data
    return {
      id: pkg._id,
      name: pkg.name,
      price: pkg.basePrice,
      banner: pkg.image || '/placeholder.svg',
      gallery: [pkg.image || '/placeholder.svg'],
      tags: pkg.tags || [],
      description: pkg.description,
      status: pkg.status,
      categories: [],
    }
  } catch (error) {
    console.error('获取套餐详情失败', error)
    return null
  }
}
