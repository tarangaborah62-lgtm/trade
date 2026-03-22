const path = require('path');
const backendDir = path.join(__dirname, '..', '..', 'backend');
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function(request, parent, ...args) {
  if (!request.startsWith('.') && !request.startsWith('/') && !path.isAbsolute(request)) {
    try {
      return originalResolveFilename.call(this, request, parent, ...args);
    } catch (e) {
      const backendModulePath = path.join(backendDir, 'node_modules', request);
      return originalResolveFilename.call(this, backendModulePath, parent, ...args);
    }
  }
  return originalResolveFilename.call(this, request, parent, ...args);
};

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(backendDir, '.env') });

const User = require(path.join(backendDir, 'models', 'User'));
const Product = require(path.join(backendDir, 'models', 'Product'));
const connectDB = require(path.join(backendDir, 'config', 'db'));

const seedData = async () => {
  try {
    await connectDB();
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@tradebridge.com',
      phone: '+1234567890',
      password: 'admin123',
      role: 'admin',
      verified: true
    });
    console.log('Admin created:', admin.email);

    // Create suppliers
    const supplier1 = await User.create({
      name: 'Raj Textiles',
      email: 'raj@textiles.com',
      phone: '+919876543210',
      password: 'supplier123',
      role: 'supplier',
      verified: true,
      businessName: 'Raj Premium Textiles',
      businessDescription: 'Premium quality fabrics and textiles for retailers. Established since 1995 with pan-India distribution.',
      location: 'Mumbai, India',
      whatsapp: '+919876543210'
    });

    const supplier2 = await User.create({
      name: 'TechWorld Electronics',
      email: 'tech@world.com',
      phone: '+919876543211',
      password: 'supplier123',
      role: 'supplier',
      verified: true,
      businessName: 'TechWorld Electronics Wholesale',
      businessDescription: 'Wholesale dealer for smartphones, accessories, and electronic gadgets. Authorized distributor for major brands.',
      location: 'Delhi, India',
      whatsapp: '+919876543211'
    });

    const supplier3 = await User.create({
      name: 'Fresh Farms Grocery',
      email: 'fresh@farms.com',
      phone: '+919876543212',
      password: 'supplier123',
      role: 'supplier',
      verified: false,
      businessName: 'Fresh Farms Organic Grocery',
      businessDescription: 'Organic and farm-fresh produce delivered directly to retailers.',
      location: 'Pune, India',
      whatsapp: '+919876543212'
    });
    console.log('Suppliers created');

    // Create buyers
    await User.create({
      name: 'Amit Kumar',
      email: 'amit@shop.com',
      phone: '+919876543213',
      password: 'buyer123',
      role: 'buyer'
    });

    await User.create({
      name: 'Priya Sharma',
      email: 'priya@store.com',
      phone: '+919876543214',
      password: 'buyer123',
      role: 'buyer'
    });
    console.log('Buyers created');

    // Create products
    const products = [
      {
        name: 'Premium Cotton Fabric Roll - White',
        description: 'High-quality 100% cotton fabric, perfect for retail shops. 40-inch width, pre-washed and ready for retail.',
        price: 250,
        supplierId: supplier1._id,
        category: 'clothing',
        moq: 10,
        discountTiers: [
          { minQty: 20, discountPercent: 5 },
          { minQty: 50, discountPercent: 10 },
          { minQty: 100, discountPercent: 15 }
        ],
        stock: 500,
        unit: 'piece'
      },
      {
        name: 'Silk Saree Collection - Assorted',
        description: 'Handwoven silk sarees in assorted designs. Banarasi and Kanchipuram styles available.',
        price: 1500,
        supplierId: supplier1._id,
        category: 'clothing',
        moq: 5,
        discountTiers: [
          { minQty: 10, discountPercent: 8 },
          { minQty: 25, discountPercent: 12 }
        ],
        stock: 200,
        unit: 'piece'
      },
      {
        name: 'Men\'s Casual T-Shirts - Bulk Pack',
        description: 'Pack of basic casual t-shirts in multiple sizes and colors. 180 GSM cotton material.',
        price: 180,
        supplierId: supplier1._id,
        category: 'clothing',
        moq: 24,
        discountTiers: [
          { minQty: 50, discountPercent: 10 },
          { minQty: 100, discountPercent: 18 }
        ],
        stock: 1000,
        unit: 'dozen'
      },
      {
        name: 'Wireless Bluetooth Earbuds Pro',
        description: 'TWS earbuds with active noise cancellation, 30-hour battery, IPX5 waterproof. Perfect for retail.',
        price: 450,
        supplierId: supplier2._id,
        category: 'electronics',
        moq: 20,
        discountTiers: [
          { minQty: 50, discountPercent: 8 },
          { minQty: 100, discountPercent: 15 }
        ],
        stock: 800,
        unit: 'piece'
      },
      {
        name: 'Fast Charging Cable Type-C 1m',
        description: 'Nylon braided USB-C cable, 65W fast charging, durable connector. Retail-ready packaging.',
        price: 85,
        supplierId: supplier2._id,
        category: 'electronics',
        moq: 50,
        discountTiers: [
          { minQty: 100, discountPercent: 12 },
          { minQty: 200, discountPercent: 20 }
        ],
        stock: 2000,
        unit: 'piece'
      },
      {
        name: '10000mAh Power Bank Slim',
        description: 'Ultra-slim portable power bank with dual USB ports and LED display. Available in black, white, and blue.',
        price: 550,
        supplierId: supplier2._id,
        category: 'electronics',
        moq: 10,
        discountTiers: [
          { minQty: 25, discountPercent: 5 },
          { minQty: 50, discountPercent: 10 }
        ],
        stock: 400,
        unit: 'piece'
      },
      {
        name: 'Organic Basmati Rice 5kg',
        description: 'Premium aged basmati rice, certified organic. Long grain, aromatic. Ideal for grocery resellers.',
        price: 320,
        supplierId: supplier3._id,
        category: 'grocery',
        moq: 20,
        discountTiers: [
          { minQty: 50, discountPercent: 5 },
          { minQty: 100, discountPercent: 10 }
        ],
        stock: 600,
        unit: 'piece'
      },
      {
        name: 'Cold Pressed Coconut Oil 1L',
        description: '100% pure cold-pressed virgin coconut oil. Glass bottle packaging for premium retail.',
        price: 280,
        supplierId: supplier3._id,
        category: 'grocery',
        moq: 12,
        discountTiers: [
          { minQty: 24, discountPercent: 7 },
          { minQty: 48, discountPercent: 12 }
        ],
        stock: 300,
        unit: 'piece'
      },
      {
        name: 'Herbal Green Tea 100 Bags',
        description: 'Premium green tea bags with tulsi and ginger. Individually wrapped. Attractive retail packaging.',
        price: 150,
        supplierId: supplier3._id,
        category: 'grocery',
        moq: 25,
        discountTiers: [
          { minQty: 50, discountPercent: 8 },
          { minQty: 100, discountPercent: 15 }
        ],
        stock: 500,
        unit: 'box'
      },
      {
        name: 'Smart Watch Fitness Tracker',
        description: 'Fitness tracker with heart rate, SpO2, sleep tracking. 7-day battery. Multiple color options.',
        price: 750,
        supplierId: supplier2._id,
        category: 'electronics',
        moq: 10,
        discountTiers: [
          { minQty: 20, discountPercent: 6 },
          { minQty: 50, discountPercent: 12 }
        ],
        stock: 300,
        unit: 'piece'
      },
      {
        name: 'Yoga Mat Premium 6mm',
        description: 'Anti-slip yoga mat with carrying strap. Available in 8 colors. Eco-friendly TPE material.',
        price: 350,
        supplierId: supplier1._id,
        category: 'sports',
        moq: 15,
        discountTiers: [
          { minQty: 30, discountPercent: 8 },
          { minQty: 60, discountPercent: 14 }
        ],
        stock: 400,
        unit: 'piece'
      },
      {
        name: 'Wooden Bookshelf 3-Tier',
        description: 'Solid sheesham wood bookshelf with natural finish. Easy assembly. Dimensions: 36"x12"x48".',
        price: 2800,
        supplierId: supplier1._id,
        category: 'furniture',
        moq: 3,
        discountTiers: [
          { minQty: 5, discountPercent: 5 },
          { minQty: 10, discountPercent: 12 }
        ],
        stock: 50,
        unit: 'piece'
      }
    ];

    await Product.insertMany(products);
    console.log(`${products.length} products created`);

    console.log('\n--- Seed Complete ---');
    console.log('Admin: admin@tradebridge.com / admin123');
    console.log('Supplier 1: raj@textiles.com / supplier123');
    console.log('Supplier 2: tech@world.com / supplier123');
    console.log('Supplier 3: fresh@farms.com / supplier123');
    console.log('Buyer 1: amit@shop.com / buyer123');
    console.log('Buyer 2: priya@store.com / buyer123');

    return true;
  } catch (error) {
    console.error('Seed error:', error);
    throw error;
  }
};

module.exports = seedData;
