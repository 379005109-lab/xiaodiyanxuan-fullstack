const { successResponse, errorResponse } = require('../utils/response')
const Product = require('../models/Product')
const Category = require('../models/Category')
const Style = require('../models/Style')
const Package = require('../models/Package')

const getHomeData = async (req, res) => {
  try {
    // Get featured products (先按order排序，再按销量排序)
    const featuredProducts = await Product.find({ status: 'active' })
      .sort('order -sales')
      .limit(8)
      .lean()
    
    // Get hot products (先按order排序，再按浏览量排序)
    const hotProducts = await Product.find({ status: 'active' })
      .sort('order -views')
      .limit(8)
      .lean()
    
    // Get categories
    const categories = await Category.find({ status: 'active' })
      .sort('order')
      .limit(6)
      .lean()
    
    // Get styles
    const styles = await Style.find({ status: 'active' })
      .sort('order')
      .limit(6)
      .lean()
    
    // Get featured packages
    const packages = await Package.find({ status: 'active' })
      .sort('-createdAt')
      .limit(4)
      .lean()
    
    const data = {
      banners: [
        {
          id: '1',
          image: 'https://via.placeholder.com/1200x400?text=Banner+1',
          link: '/products'
        },
        {
          id: '2',
          image: 'https://via.placeholder.com/1200x400?text=Banner+2',
          link: '/products'
        }
      ],
      featuredProducts,
      hotProducts,
      categories,
      styles,
      packages
    }
    
    res.json(successResponse(data))
  } catch (err) {
    console.error('Get home data error:', err)
    res.status(500).json(errorResponse(err.message, 500))
  }
}

module.exports = {
  getHomeData
}
