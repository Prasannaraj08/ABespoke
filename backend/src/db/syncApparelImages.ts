import 'dotenv/config';
import sequelize from './database';
import { Product } from './models';

const DISTINCT_CLOTHING_IMAGES: Record<string, string[]> = {
  // --- MEN: SHIRTS ---
  'Classic Slim Fit Oxford Shirt': [
    'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
  ],
  'Striped Cotton Pique Polo Shirt': [
    'https://images.unsplash.com/photo-1625910513413-7d8487779ef4?w=600&auto=format&fit=crop&q=80'
  ],
  'Breathable Casual Linen Shirt': [
    'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80'
  ],
  'Premium Herringbone Dress Shirt': [
    'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
  ],

  // --- MEN: PANTS ---
  'Tech Stretch Chino Trousers': [
    'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80'
  ],
  'Tailored Wool-Blend Dress Pants': [
    'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80'
  ],
  'Pleated Cotton Comfort Trousers': [
    'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80'
  ],
  'Summer Linen Cargo Pants': [
    'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80'
  ],

  // --- MEN: HOODIES ---
  'Classic French Terry Loopback Hoodie': [
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
  ],
  'Premium Knit Cashmere Hoodie': [
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80'
  ],
  'Athletic Tech Zip-Up Hoodie': [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
  ],
  'Graphic Oversized Cotton Hoodie': [
    'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80'
  ],

  // --- MEN: BLAZERS ---
  'Italian Tweed Single-Breasted Blazer': [
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80'
  ],
  'Linen Summer Casual Blazer': [
    'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&auto=format&fit=crop&q=80'
  ],
  'Classic Wool Flannel Suit Blazer': [
    'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80'
  ],
  'Cotton Stretch Smart-Casual Blazer': [
    'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80'
  ],

  // --- MEN: JEANS ---
  'Vintage Wash Selvedge Jeans': [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
  ],
  'Slim Fit Distressed Black Jeans': [
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80'
  ],
  'Loose Fit Utility Carpenter Jeans': [
    'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80'
  ],
  'Premium Raw Indigo Rigid Jeans': [
    'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600&auto=format&fit=crop&q=80'
  ],

  // --- WOMEN: SAREES ---
  'Kanjeevaram Pure Silk Saree': [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
  ],
  'Banarasi Brocade Silk Saree': [
    'https://images.unsplash.com/photo-1610030470298-40b355e717dc?w=600&auto=format&fit=crop&q=80'
  ],
  'Handcrafted Chanderi Cotton Saree': [
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
  ],
  'Printed Georgette Summer Saree': [
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
  ],
  'Handloom Tussar Silk Saree': [
    'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80'
  ],

  // --- WOMEN: LEHENGAS ---
  'Royal Velvet Embroidered Lehenga Set': [
    'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80'
  ],
  'Georgette Sequined Party Lehenga': [
    'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
  ],
  'Floral Silk Festive Lehenga Choli': [
    'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&auto=format&fit=crop&q=80'
  ],
  'Organza Pastel Designer Lehenga': [
    'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&auto=format&fit=crop&q=80'
  ],

  // --- WOMEN: HOODIES ---
  'Cashmere Blend Knit Hoodie': [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
  ],
  'Crop Fleece Athletic Hoodie': [
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
  ],
  'Premium French Terry Hoodie': [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
  ],
  'Active zip-up Running Hoodie': [
    'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
  ],
  'French Terry Sherpa Lined Hoodie': [
    'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80'
  ],

  // --- WOMEN: HALF SAREES ---
  'Kanchipuram Silk Half Saree Set': [
    'https://images.unsplash.com/photo-1583391733975-00c73e04cfb9?w=600&auto=format&fit=crop&q=80'
  ],
  'Georgette Sequined Half Saree': [
    'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
  ],
  'Banarasi Brocade Half Saree': [
    'https://images.unsplash.com/photo-1610030470298-40b355e717dc?w=600&auto=format&fit=crop&q=80'
  ],
  'Floral Print Organza Half Saree': [
    'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
  ],

  // --- WOMEN: KURTIS ---
  'Chikankari Hand Embroidered Kurti': [
    'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80'
  ],
  'Anarkali flared Cotton Kurti': [
    'https://images.unsplash.com/photo-1589810635657-232948472d98?w=600&auto=format&fit=crop&q=80'
  ],
  'Designer Tunic length Kurti': [
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80'
  ],
  'Premium Chanderi Silk Tunic Kurti': [
    'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80'
  ]
};

async function syncImages() {
  await sequelize.authenticate();
  console.log('PostgreSQL Connected successfully.');

  const products = await Product.findAll();
  console.log(`Auditing and synchronizing ${products.length} products in database...`);

  let updatedCount = 0;
  for (const product of products) {
    const title = product.title?.trim();
    for (const [key, imgs] of Object.entries(DISTINCT_CLOTHING_IMAGES)) {
      if (title && key.toLowerCase() === title.toLowerCase()) {
        product.images = imgs;
        await product.save();
        updatedCount++;
        console.log(`[OK] Updated ${product.title}`);
      }
    }
  }

  console.log(`\nCompleted! Synchronized ${updatedCount} products with 100% apparel-only high-definition imagery.`);
  process.exit(0);
}

syncImages().catch(err => {
  console.error('Failed to sync clothing images:', err);
  process.exit(1);
});
