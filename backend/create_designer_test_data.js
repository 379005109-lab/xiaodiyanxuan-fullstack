#!/usr/bin/env node
require('dotenv').config()
const mongoose = require('mongoose')

const createDesignerTestData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000
    })
    console.log('✅ MongoDB connected')
    
    const Authorization = mongoose.model('Authorization', new mongoose.Schema({}, {strict:false}))
    const TierSystem = mongoose.model('TierSystem', new mongoose.Schema({}, {strict:false}))
    
    const designerId = '693291d267d9a95c0e583a46'
    const manufacturerId = '693a5796eaf66650e465084f'
    
    // Check if tier system exists
    let tier = await TierSystem.findOne({manufacturerId}).lean()
    if (!tier) {
      console.log('Creating TierSystem...')
      tier = await TierSystem.create({
        manufacturerId,
        profitSettings: {
          minSaleDiscountRate: 0.7
        },
        roleModules: [
          {
            code: 'designer',
            name: '设计师',
            isActive: true,
            discountRules: [
              {
                name: '默认折扣',
                discountType: 'rate',
                discountRate: 0.85,
                commissionRate: 0.15,
                isDefault: true
              }
            ]
          }
        ],
        authorizedAccounts: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ TierSystem created:', tier._id)
    } else {
      console.log('✅ TierSystem exists:', tier._id)
    }
    
    // Check if authorization exists
    const existingAuth = await Authorization.findOne({
      toDesigner: designerId,
      fromManufacturer: manufacturerId,
      status: 'active'
    }).lean()
    
    if (!existingAuth) {
      console.log('Creating Authorization...')
      const auth = await Authorization.create({
        fromManufacturer: manufacturerId,
        toDesigner: designerId,
        authorizationType: 'designer',
        scope: 'all',
        categories: [],
        products: [],
        priceSettings: {
          globalDiscount: 1,
          categoryDiscounts: [],
          productPrices: []
        },
        status: 'active',
        validFrom: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      console.log('✅ Authorization created:', auth._id)
    } else {
      console.log('✅ Authorization exists:', existingAuth._id)
    }
    
    console.log('')
    console.log('✅ Designer test data ready!')
    console.log('Designer ID:', designerId)
    console.log('Manufacturer ID:', manufacturerId)
    
    process.exit(0)
  } catch (err) {
    console.error('❌ Error:', err.message)
    process.exit(1)
  }
}

createDesignerTestData()
