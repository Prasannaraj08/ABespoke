import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { User, Product, Coupon, Review, BoutiqueProfile, DesignerProfile } from './models';
import sequelize from './database';

const idMap: { [key: string]: string } = {
  'u1': '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  'u2': '0b5a31e8-780c-43f1-b924-d2c64e5264b1',
  'u3': '5d40cb97-e85d-4f10-bf9e-1d54e4df91e1',
  'u4': '8e27c1f8-085e-4c12-9c4c-7c014fbc9a1f',
  'm_shirt_1': 'fcb9b244-ec8a-4934-9273-057dcf74465b',
  'w_saree_1': 'ad5e0be3-bf2e-4b68-80f4-52d3a3dc312f'
};

function getUUID(oldId: string): string {
  if (!idMap[oldId]) {
    idMap[oldId] = randomUUID();
  }
  return idMap[oldId];
}

export async function seedDatabase() {
  const transaction = await sequelize.transaction();
  try {
    const usersCount = await User.count({ transaction });
    
    // Seed Users if empty
    if (usersCount === 0) {
      const customerPasswordHash = await bcrypt.hash('password123', 10);
      const adminPasswordHash = await bcrypt.hash('CLARA@17', 10);
      const boutiquePasswordHash = await bcrypt.hash('BT@123', 10);
      const designerPasswordHash = await bcrypt.hash('password', 10);

      const initialUsers = [
        {
          id: getUUID('u1'),
          name: 'John Doe',
          email: 'customer@example.com',
          passwordHash: customerPasswordHash,
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        {
          id: getUUID('u2'),
          name: 'Admin Manager',
          email: 'abespokeadmin@example.com',
          passwordHash: adminPasswordHash,
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: getUUID('u3'),
          name: 'ABespoke Boutique',
          email: 'boutique@example.com',
          passwordHash: boutiquePasswordHash,
          role: 'boutique',
          createdAt: new Date().toISOString(),
        },
        {
          id: getUUID('u4'),
          name: 'Sabyasachi Label',
          email: 'designer@example.com',
          passwordHash: designerPasswordHash,
          role: 'designer',
          createdAt: new Date().toISOString(),
        }
      ];
      await User.bulkCreate(initialUsers as any, { transaction });

      // Seed profiles
      await BoutiqueProfile.bulkCreate([
        {
          userId: getUUID('u3'),
          boutiqueName: 'ABespoke Boutique',
          about: 'Premium boutique collection featuring modern trends and classical fabrics.',
          address: '101 Fashion Blvd, Mumbai',
          contactNumber: '+91 98765 43210',
          email: 'boutique@example.com',
          socialLinks: { instagram: '@abespoke.luxe', facebook: 'abespokeluxefashion' },
          businessHours: '10:00 AM - 08:30 PM',
          experienceYears: 8,
          specialization: 'Bridal & Party Wear',
          verified: false,
          deliveryOptions: 'Standard Courier, Next Day Dispatch',
          pricingPolicy: 'Standard Retail',
          followersCount: 142
        }
      ], { transaction });

      await DesignerProfile.bulkCreate([
        {
          userId: getUUID('u4'),
          designerName: 'Sabyasachi Label',
          portfolioImages: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600'
          ],
          exclusiveCollections: ['Bridal Collection 2026', 'Summer Heritage'],
          about: 'Haute couture wedding designer.',
          verified: false,
          customizationTerms: 'Custom sizes and fit adjustments upon request.'
        }
      ], { transaction });

      console.log('Seeded users and profiles successfully.');
    }

    const productsCount = await Product.count({ transaction });
    if (productsCount === 0) {
    const initialProducts: any[] = [
      // ================= WOMEN'S CLOTHING =================
      
      // Category: Sarees
      {
        id: 'w_saree_1',
        title: 'Kanjeevaram Pure Silk Saree',
        brand: 'VedicHeritage',
        description: 'An exquisite Kanjeevaram pure silk saree featuring intricate gold zari borders and matching pallu, crafted by master weavers in Tamil Nadu. Perfect for weddings and grand festive celebrations.',
        price: 8999,
        discount: 15,
        rating: 4.9,
        reviewsCount: 124,
        sizes: ['One Size'],
        colors: ['Ruby Red', 'Emerald Green', 'Royal Blue'],
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Sarees',
        gender: 'women',
        stock: 25,
        fabric: 'Kanjeevaram Silk',
        fit: 'Traditional Drape',
        occasion: 'Festive',
        pattern: 'Zari Woven',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_saree_2',
        title: 'Banarasi Brocade Silk Saree',
        brand: 'VedicHeritage',
        description: 'Traditional Banarasi brocade silk saree with gorgeous floral vines hand-loomed with gold and silver zari threads. Includes an unstitched matching blouse piece.',
        price: 7499,
        discount: 10,
        rating: 4.8,
        reviewsCount: 68,
        sizes: ['One Size'],
        colors: ['Maroon Gold', 'Midnight Black'],
        images: [
          'https://images.unsplash.com/photo-1610030470298-40b355e717dc?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Sarees',
        gender: 'women',
        stock: 30,
        fabric: 'Banarasi Silk',
        fit: 'Traditional Drape',
        occasion: 'Wedding',
        pattern: 'Floral Zari',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_saree_3',
        title: 'Handcrafted Chanderi Cotton Saree',
        brand: 'AuraStyle',
        description: 'Lightweight and semi-sheer, this Chanderi cotton-silk blend Saree features block-print designs and a minimal gold border. Offers ultimate sophistication and comfort.',
        price: 3499,
        discount: 20,
        rating: 4.6,
        reviewsCount: 92,
        sizes: ['One Size'],
        colors: ['Off-White', 'Soft Peach', 'Mint Green'],
        images: [
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Sarees',
        gender: 'women',
        stock: 45,
        fabric: 'Chanderi Silk-Cotton',
        fit: 'Traditional Drape',
        occasion: 'Casual Wear',
        pattern: 'Hand Block Print',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_saree_4',
        title: 'Printed Georgette Summer Saree',
        brand: 'UrbanFlex',
        description: 'Breezy and lightweight georgette saree featuring a modern botanical print. Drapes fluidly and requires low maintenance.',
        price: 1899,
        discount: 10,
        rating: 4.4,
        reviewsCount: 145,
        sizes: ['One Size'],
        colors: ['Sky Blue', 'Sunny Yellow'],
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Sarees',
        gender: 'women',
        stock: 60,
        fabric: 'Faux Georgette',
        fit: 'Traditional Drape',
        occasion: 'Casual',
        pattern: 'Floral Print',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Lehengas
      {
        id: 'w_lehenga_1',
        title: 'Royal Velvet Embroidered Lehenga Set',
        brand: 'LuxeWeave',
        description: 'A heavy velvet lehenga set featuring detailed gold thread embroidery, a matching sequined choli, and an embellished sheer net dupatta.',
        price: 12999,
        discount: 15,
        rating: 4.9,
        reviewsCount: 38,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Wine Red', 'Deep Teal'],
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Lehengas',
        gender: 'women',
        stock: 15,
        fabric: 'Micro Velvet',
        fit: 'Flared Lehenga Fit',
        occasion: 'Bridal Wear',
        pattern: 'Zardozi Embroidered',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_lehenga_2',
        title: 'Georgette Sequined Party Lehenga',
        brand: 'UrbanFlex',
        description: 'Modern lightweight georgette lehenga heavily embellished with metallic sequins. Perfect for sangeet nights and reception parties.',
        price: 7999,
        discount: 20,
        rating: 4.7,
        reviewsCount: 52,
        sizes: ['S', 'M', 'L'],
        colors: ['Champagne Gold', 'Rose Pink'],
        images: [
          'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Lehengas',
        gender: 'women',
        stock: 20,
        fabric: 'Georgette & Net',
        fit: 'Flared Fit',
        occasion: 'Festive',
        pattern: 'Sequined',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_lehenga_3',
        title: 'Floral Silk Festive Lehenga Choli',
        brand: 'AuraStyle',
        description: 'Art silk digital print lehenga with dynamic floral prints and a contrasting borders. Gives a youthful, modern look.',
        price: 5999,
        discount: 10,
        rating: 4.5,
        reviewsCount: 41,
        sizes: ['M', 'L', 'XL'],
        colors: ['Vanilla Cream', 'Mustard Gold'],
        images: [
          'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Lehengas',
        gender: 'women',
        stock: 22,
        fabric: 'Art Silk',
        fit: 'Regular Flared',
        occasion: 'Festive',
        pattern: 'Digital Print',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_lehenga_4',
        title: 'Organza Pastel Designer Lehenga',
        brand: 'LuxeWeave',
        description: 'Dreamy pastel organza lehenga choli set featuring delicate floral embroidery and a sheer ruffle dupatta.',
        price: 9499,
        discount: 15,
        rating: 4.8,
        reviewsCount: 30,
        sizes: ['S', 'M', 'L'],
        colors: ['Lavender Mist', 'Peach Sorbet'],
        images: [
          'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Lehengas',
        gender: 'women',
        stock: 18,
        fabric: 'Premium Organza',
        fit: 'A-Line Flared',
        occasion: 'Wedding',
        pattern: 'Thread Embroidery',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Hoodies (Women)
      {
        id: 'w_hoodie_1',
        title: 'Cashmere Blend Knit Hoodie',
        brand: 'AuraStyle',
        description: 'An incredibly soft oversized knit hoodie made from a premium cotton-cashmere blend. Features drop shoulders and side slit hems.',
        price: 3499,
        discount: 10,
        rating: 4.8,
        reviewsCount: 165,
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Oatmeal Cream', 'Heather Gray', 'Jet Black'],
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'women',
        stock: 50,
        fabric: '90% Cotton, 10% Cashmere',
        sleeve: 'Full Sleeve',
        fit: 'Oversized Fit',
        occasion: 'Casual Lounge',
        pattern: 'Solid Knit',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_hoodie_2',
        title: 'Crop Fleece Athletic Hoodie',
        brand: 'ApexAthletics',
        description: 'High-performance crop hoodie featuring super-soft brushed fleece lining, moisture-wicking capability, and adjustable toggles.',
        price: 1999,
        discount: 15,
        rating: 4.6,
        reviewsCount: 198,
        sizes: ['S', 'M', 'L'],
        colors: ['Blush Pink', 'Slate Charcoal'],
        images: [
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'women',
        stock: 75,
        fabric: 'Cotton-Polyester Fleece',
        sleeve: 'Full Sleeve',
        fit: 'Cropped Relaxed',
        occasion: 'Sportswear',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_hoodie_3',
        title: 'Premium French Terry Hoodie',
        brand: 'UrbanFlex',
        description: 'Mediumweight organic cotton French Terry hoodie. Features a double-layered hood, flatlock stitching, and convenient kangaroo pocket.',
        price: 2499,
        discount: 20,
        rating: 4.5,
        reviewsCount: 110,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Sage Green', 'Warm Sand'],
        images: [
          'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'women',
        stock: 80,
        fabric: '100% Organic Cotton',
        sleeve: 'Full Sleeve',
        fit: 'Regular Fit',
        occasion: 'Casual',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_hoodie_4',
        title: 'Active zip-up Running Hoodie',
        brand: 'ApexAthletics',
        description: 'Slim-fit athletic hoodie featuring a full zipper front, thumbhole sleeves, and reflection strips for safe early morning running.',
        price: 2299,
        discount: 10,
        rating: 4.7,
        reviewsCount: 88,
        sizes: ['XS', 'S', 'M', 'L'],
        colors: ['Electric Purple', 'Stealth Black'],
        images: [
          'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'women',
        stock: 45,
        fabric: 'Polyester-Elastane Tech',
        sleeve: 'Full Sleeve',
        fit: 'Slim Fit',
        occasion: 'Sportswear',
        pattern: 'Solid',
        trending: true,
        createdAt: new Date().toISOString()
      },

      // Category: Half Sarees
      {
        id: 'w_halfsaree_1',
        title: 'Kanchipuram Silk Half Saree Set',
        brand: 'VedicHeritage',
        description: 'A traditional South Indian Pavadai Davani set. Features a pure silk zari pleated skirt, embellished raw silk blouse, and silk georgette dhavani dupatta.',
        price: 6599,
        discount: 15,
        rating: 4.9,
        reviewsCount: 45,
        sizes: ['S', 'M', 'L'],
        colors: ['Magenta & Mustard', 'Parrot Green & Coral'],
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Half Sarees',
        gender: 'women',
        stock: 12,
        fabric: 'Pure Kanchipuram Silk',
        fit: 'Pavadai Lehenga Fit',
        occasion: 'Traditional Festive',
        pattern: 'Temple Zari Borders',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_halfsaree_2',
        title: 'Georgette Sequined Half Saree',
        brand: 'UrbanFlex',
        description: 'A modern design half Saree set featuring lightweight georgette materials and sparkling borders. Trendy look for wedding sangeets.',
        price: 4999,
        discount: 10,
        rating: 4.6,
        reviewsCount: 33,
        sizes: ['S', 'M', 'L'],
        colors: ['Lilac Lavendar', 'Mint Turquoise'],
        images: [
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Half Sarees',
        gender: 'women',
        stock: 15,
        fabric: 'Faux Georgette',
        fit: 'Pavadai Flared',
        occasion: 'Festive',
        pattern: 'Sequined Work',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_halfsaree_3',
        title: 'Banarasi Brocade Half Saree',
        brand: 'VedicHeritage',
        description: 'Vibrant Banarasi brocade woven pavadai set with a matching heavy silk blouse and a contrasting net dhavani veil.',
        price: 5899,
        discount: 20,
        rating: 4.8,
        reviewsCount: 29,
        sizes: ['M', 'L', 'XL'],
        colors: ['Maroon Gold', 'Peacock Blue'],
        images: [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Half Sarees',
        gender: 'women',
        stock: 10,
        fabric: 'Banarasi Silk Blend',
        fit: 'Traditional Flared',
        occasion: 'Festive',
        pattern: 'Brocade Woven',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_halfsaree_4',
        title: 'Floral Print Organza Half Saree',
        brand: 'AuraStyle',
        description: 'Beautifully light pastel organza pavadai set featuring digital floral prints and a clean border layout.',
        price: 3999,
        discount: 10,
        rating: 4.4,
        reviewsCount: 22,
        sizes: ['S', 'M', 'L'],
        colors: ['Peach Pink', 'Off-White Gold'],
        images: [
          'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Half Sarees',
        gender: 'women',
        stock: 20,
        fabric: 'Organza & Silk',
        fit: 'A-Line Pavadai',
        occasion: 'Casual Festive',
        pattern: 'Floral Digital Print',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Kurtis
      {
        id: 'w_kurti_1',
        title: 'Chikankari Hand Embroidered Kurti',
        brand: 'VedicHeritage',
        description: 'A beautiful georgette kurti displaying Lucknowi Chikankari hand embroidery. Gives an elegant, airy, and traditional feel.',
        price: 2499,
        discount: 15,
        rating: 4.8,
        reviewsCount: 210,
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        colors: ['Soft Pink', 'Sky Blue', 'White'],
        images: [
          'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Kurtis',
        gender: 'women',
        stock: 80,
        fabric: 'Georgette Cotton Blend',
        sleeve: '3/4 Sleeve',
        fit: 'Regular Straight',
        occasion: 'Semi-Formal',
        pattern: 'Hand Embroidered',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_kurti_2',
        title: 'Anarkali flared Cotton Kurti',
        brand: 'AuraStyle',
        description: 'Made from premium breathable organic cotton, this Kurti features a flared Anarkali silhouette and minimal floral print detailing.',
        price: 1899,
        discount: 10,
        rating: 4.5,
        reviewsCount: 144,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Indigo Blue', 'Turquoise Green'],
        images: [
          'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Kurtis',
        gender: 'women',
        stock: 65,
        fabric: '100% Organic Cotton',
        sleeve: '3/4 Sleeve',
        fit: 'Anarkali Flared',
        occasion: 'Casual Wear',
        pattern: 'Floral Print',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_kurti_3',
        title: 'Designer Tunic length Kurti',
        brand: 'UrbanFlex',
        description: 'A contemporary short tunic-style kurti featuring side pockets, asymmetrical button cuffs, and a neat Mandarin collar.',
        price: 1299,
        discount: 20,
        rating: 4.3,
        reviewsCount: 98,
        sizes: ['XS', 'S', 'M', 'L', 'XL'],
        colors: ['Mustard Yellow', 'Brick Red'],
        images: [
          'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Kurtis',
        gender: 'women',
        stock: 90,
        fabric: 'Linen Cotton Blend',
        sleeve: 'Roll-up Sleeve',
        fit: 'Straight Tunic',
        occasion: 'Daily Wear',
        pattern: 'Solid Colored',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'w_kurti_4',
        title: 'Premium Chanderi Silk Tunic Kurti',
        brand: 'LuxeWeave',
        description: 'Woven with fine gold threads, this Chanderi silk kurti features delicate hand embroideries around the neckline.',
        price: 3299,
        discount: 15,
        rating: 4.7,
        reviewsCount: 77,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Teal Blue', 'Warm Peach'],
        images: [
          'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Kurtis',
        gender: 'women',
        stock: 35,
        fabric: 'Chanderi Silk',
        sleeve: '3/4 Sleeve',
        fit: 'Regular Straight',
        occasion: 'Festive',
        pattern: 'Neckline Hand Embroidery',
        trending: true,
        createdAt: new Date().toISOString()
      },

      // ================= MEN'S CLOTHING =================
      
      // Category: Shirts
      {
        id: 'm_shirt_1',
        title: 'Classic Slim Fit Oxford Shirt',
        brand: 'LuxeWeave',
        description: 'Crafted from premium 100% long-staple cotton, this classic Oxford shirt is breathable, crisp, and features a clean button-down collar.',
        price: 2499,
        discount: 15,
        rating: 4.6,
        reviewsCount: 142,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['White', 'Light Blue', 'Pink'],
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Shirts',
        gender: 'men',
        stock: 50,
        fabric: '100% Cotton Oxford',
        sleeve: 'Full Sleeve',
        fit: 'Slim Fit',
        occasion: 'Semi-Formal',
        pattern: 'Solid',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_shirt_2',
        title: 'Striped Cotton Pique Polo Shirt',
        brand: 'LuxeWeave',
        description: 'Signature knit pique cotton polo featuring crisp stripes, double button placket, and ribbed cuffs. Lightweight and stylish.',
        price: 1799,
        discount: 15,
        rating: 4.4,
        reviewsCount: 78,
        sizes: ['M', 'L', 'XL'],
        colors: ['Navy/White', 'Navy/Red'],
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Shirts',
        gender: 'men',
        stock: 45,
        fabric: '100% Pique Cotton',
        sleeve: 'Half Sleeve',
        fit: 'Regular Fit',
        occasion: 'Casual',
        pattern: 'Striped',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_shirt_3',
        title: 'Breathable Casual Linen Shirt',
        brand: 'UrbanFlex',
        description: 'Made from 100% organic European flax linen, this shirt features a relaxed fit and single patch pocket.',
        price: 2999,
        discount: 10,
        rating: 4.5,
        reviewsCount: 64,
        sizes: ['M', 'L', 'XL', 'XXL'],
        colors: ['Oatmeal Beige', 'Olive Green', 'White'],
        images: [
          'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Shirts',
        gender: 'men',
        stock: 35,
        fabric: '100% Flax Linen',
        sleeve: 'Full Sleeve',
        fit: 'Relaxed Fit',
        occasion: 'Casual',
        pattern: 'Solid Linen',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_shirt_4',
        title: 'Premium Herringbone Dress Shirt',
        brand: 'LuxeWeave',
        description: 'A high-end double-ply cotton dress shirt with a subtle herringbone weave pattern and french cuffs.',
        price: 3999,
        discount: 10,
        rating: 4.8,
        reviewsCount: 40,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Lavender', 'Pure White'],
        images: [
          'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Shirts',
        gender: 'men',
        stock: 30,
        fabric: 'Double-Ply Cotton',
        sleeve: 'Full Sleeve',
        fit: 'Tailored Fit',
        occasion: 'Formal',
        pattern: 'Herringbone',
        trending: true,
        createdAt: new Date().toISOString()
      },

      // Category: Pants
      {
        id: 'm_pant_1',
        title: 'Tech Stretch Chino Trousers',
        brand: 'UrbanFlex',
        description: 'Chino pants engineered with lightweight 4-way stretch fabric that is water-resistant. Concealed zipper pockets and comfortable flex waistband.',
        price: 2999,
        discount: 10,
        rating: 4.3,
        reviewsCount: 65,
        sizes: ['30', '32', '34', '36'],
        colors: ['Khaki', 'Navy Blue', 'Olive Green'],
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Pants',
        gender: 'men',
        stock: 35,
        fabric: 'Polyester-Elastane Blend',
        fit: 'Slim Tapered',
        occasion: 'Smart Casual',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_pant_2',
        title: 'Tailored Wool-Blend Dress Pants',
        brand: 'LuxeWeave',
        description: 'Elegant tailored dress pants made from a fine wool blend. Flat front styling with side adjusters and unfinished hems for custom tailoring.',
        price: 4999,
        discount: 15,
        rating: 4.7,
        reviewsCount: 33,
        sizes: ['30', '32', '34', '36'],
        colors: ['Charcoal Gray', 'Jet Black'],
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Pants',
        gender: 'men',
        stock: 20,
        fabric: 'Wool-Polyester Blend',
        fit: 'Slim Fit',
        occasion: 'Formal',
        pattern: 'Solid',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_pant_3',
        title: 'Pleated Cotton Comfort Trousers',
        brand: 'AuraStyle',
        description: 'Classic double-pleated cotton trousers offering a relaxed, comfortable seat and thigh. Ideal for smart office wear.',
        price: 2299,
        discount: 10,
        rating: 4.4,
        reviewsCount: 48,
        sizes: ['32', '34', '36', '38'],
        colors: ['Dark Tan', 'Navy Blue'],
        images: [
          'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Pants',
        gender: 'men',
        stock: 45,
        fabric: '100% Twill Cotton',
        fit: 'Relaxed Fit',
        occasion: 'Formal',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_pant_4',
        title: 'Summer Linen Cargo Pants',
        brand: 'UrbanFlex',
        description: 'Breathable linen-blend casual cargo trousers featuring an elasticated drawstring waistband and pocket layouts.',
        price: 2799,
        discount: 15,
        rating: 4.5,
        reviewsCount: 50,
        sizes: ['30', '32', '34', '36'],
        colors: ['Oatmeal', 'Military Green'],
        images: [
          'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Pants',
        gender: 'men',
        stock: 40,
        fabric: 'Linen Cotton Blend',
        fit: 'Loose Casual Fit',
        occasion: 'Casual',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Hoodies (Men)
      {
        id: 'm_hoodie_1',
        title: 'Classic French Terry Loopback Hoodie',
        brand: 'AuraStyle',
        description: 'Made from heavyweight French Terry, this premium hoodie offers maximum comfort and style. Equipped with double-layered hood.',
        price: 3499,
        discount: 25,
        rating: 4.7,
        reviewsCount: 198,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Olive Green', 'Black', 'Heather Gray'],
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'men',
        stock: 60,
        fabric: '100% French Terry Cotton',
        sleeve: 'Full Sleeve',
        fit: 'Regular Fit',
        occasion: 'Casual',
        pattern: 'Solid',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_hoodie_2',
        title: 'Premium Knit Cashmere Hoodie',
        brand: 'LuxeWeave',
        description: 'An elegant sweater knit hoodie crafted from ultra-soft wool-cashmere blend. Offers premium luxury lounging look.',
        price: 6999,
        discount: 10,
        rating: 4.9,
        reviewsCount: 35,
        sizes: ['M', 'L', 'XL'],
        colors: ['Camel Brown', 'Navy Gray'],
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'men',
        stock: 20,
        fabric: '90% Wool, 10% Cashmere',
        sleeve: 'Full Sleeve',
        fit: 'Tailored Knit Fit',
        occasion: 'Casual',
        pattern: 'Ribbed Knit',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_hoodie_3',
        title: 'Athletic Tech Zip-Up Hoodie',
        brand: 'ApexAthletics',
        description: 'Lightweight workout hoodie with full zipper entry, side zipper pockets, and quick-dry sweat technology.',
        price: 2199,
        discount: 15,
        rating: 4.5,
        reviewsCount: 104,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['Slate Grey', 'Signal Neon'],
        images: [
          'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'men',
        stock: 80,
        fabric: 'Polyester-Elastane Tech',
        sleeve: 'Full Sleeve',
        fit: 'Athletic Fit',
        occasion: 'Sportswear',
        pattern: 'Solid',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_hoodie_4',
        title: 'Graphic Oversized Cotton Hoodie',
        brand: 'UrbanFlex',
        description: 'Streetwear-inspired graphic hoodie made from ultra-heavy cotton. Ribbed cuffs and double drawcords.',
        price: 2799,
        discount: 20,
        rating: 4.6,
        reviewsCount: 88,
        sizes: ['M', 'L', 'XL'],
        colors: ['Off-Black', 'Forest Green'],
        images: [
          'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Hoodies',
        gender: 'men',
        stock: 50,
        fabric: '100% Heavy Cotton',
        sleeve: 'Full Sleeve',
        fit: 'Oversized Fit',
        occasion: 'Casual',
        pattern: 'Printed Graphic',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Blazers
      {
        id: 'm_blazer_1',
        title: 'Italian Tweed Single-Breasted Blazer',
        brand: 'LuxeWeave',
        description: 'A masterfully tailored single-breasted blazer featuring a premium Italian tweed wool-blend shell. Equipped with real horn buttons and double vents.',
        price: 9999,
        discount: 15,
        rating: 4.9,
        reviewsCount: 42,
        sizes: ['38', '40', '42', '44'],
        colors: ['Navy Tweed', 'Charcoal Herringbone'],
        images: [
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Blazers',
        gender: 'men',
        stock: 12,
        fabric: '70% Wool, 30% Polyester Tweed',
        sleeve: 'Full Sleeve',
        fit: 'Tailored Fit',
        occasion: 'Formal',
        pattern: 'Textured Tweed',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_blazer_2',
        title: 'Linen Summer Casual Blazer',
        brand: 'UrbanFlex',
        description: 'Unstructured and partially lined casual blazer tailored in breathable lightweight pure linen. Perfect for destination weddings.',
        price: 5499,
        discount: 10,
        rating: 4.6,
        reviewsCount: 39,
        sizes: ['38', '40', '42'],
        colors: ['Oatmeal Sand', 'Sky Blue'],
        images: [
          'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Blazers',
        gender: 'men',
        stock: 18,
        fabric: '100% Linen',
        sleeve: 'Full Sleeve',
        fit: 'Unstructured Slim',
        occasion: 'Semi-Formal',
        pattern: 'Solid Linen',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_blazer_3',
        title: 'Classic Wool Flannel Suit Blazer',
        brand: 'LuxeWeave',
        description: 'Double-breasted flannel suit blazer woven with fine wool fibers. Traditional notch lapel and flap pockets.',
        price: 11999,
        discount: 20,
        rating: 4.8,
        reviewsCount: 26,
        sizes: ['40', '42', '44'],
        colors: ['Mid Gray Flannel', 'Midnight Navy'],
        images: [
          'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Blazers',
        gender: 'men',
        stock: 8,
        fabric: '100% Merino Wool Flannel',
        sleeve: 'Full Sleeve',
        fit: 'Classic Double-Breasted',
        occasion: 'Formal',
        pattern: 'Solid Flannel',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_blazer_4',
        title: 'Cotton Stretch Smart-Casual Blazer',
        brand: 'AuraStyle',
        description: 'Modern knit-style stretch cotton blazer. Offers ultimate comfort of a sweater but gives a structured sharp shoulder line.',
        price: 4599,
        discount: 10,
        rating: 4.4,
        reviewsCount: 53,
        sizes: ['38', '40', '42', '44'],
        colors: ['Navy Blue', 'Forest Green'],
        images: [
          'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Blazers',
        gender: 'men',
        stock: 25,
        fabric: '95% Cotton, 5% Lycra',
        sleeve: 'Full Sleeve',
        fit: 'Slim Fit',
        occasion: 'Semi-Formal',
        pattern: 'Solid Stretch',
        trending: false,
        createdAt: new Date().toISOString()
      },

      // Category: Jeans
      {
        id: 'm_jeans_1',
        title: 'Vintage Wash Selvedge Jeans',
        brand: 'DenimCo',
        description: 'Straight-leg selvedge denim woven on vintage shuttle looms. Featuring a natural indigo wash and classic copper rivets.',
        price: 4999,
        discount: 20,
        rating: 4.5,
        reviewsCount: 88,
        sizes: ['30', '32', '34', '36'],
        colors: ['Indigo', 'Dark Indigo'],
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Jeans',
        gender: 'men',
        stock: 45,
        fabric: '99% Cotton, 1% Elastane Selvedge',
        fit: 'Straight Fit',
        occasion: 'Casual',
        pattern: 'Faded Wash',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_jeans_2',
        title: 'Slim Fit Distressed Black Jeans',
        brand: 'DenimCo',
        description: 'Soft stretch-denim black jeans with custom distressed slash details on knees. Breathable, comfortable, and highly durable.',
        price: 2999,
        discount: 15,
        rating: 4.6,
        reviewsCount: 165,
        sizes: ['30', '32', '34'],
        colors: ['Jet Black', 'Washed Gray'],
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Jeans',
        gender: 'men',
        stock: 60,
        fabric: '98% Cotton, 2% Spandex Stretch',
        fit: 'Slim Tapered',
        occasion: 'Casual',
        pattern: 'Distressed',
        trending: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_jeans_3',
        title: 'Loose Fit Utility Carpenter Jeans',
        brand: 'UrbanFlex',
        description: 'Vintage carpenter style loose-fit denim pants featuring side hammer loop, custom tool pockets, and triple-stitch seams.',
        price: 3499,
        discount: 10,
        rating: 4.3,
        reviewsCount: 74,
        sizes: ['32', '34', '36'],
        colors: ['Light Indigo Wash'],
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Jeans',
        gender: 'men',
        stock: 35,
        fabric: '100% Rigid Heavyweight Cotton Denim',
        fit: 'Loose Carpenter Fit',
        occasion: 'Casual Streetwear',
        pattern: 'Solid Stonewash',
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 'm_jeans_4',
        title: 'Premium Raw Indigo Rigid Jeans',
        brand: 'DenimCo',
        description: 'Unwashed stiff raw denim jeans. Features dark copper stitching, branded waist patch, and button fly. Fades uniquely to your wear.',
        price: 5499,
        discount: 10,
        rating: 4.8,
        reviewsCount: 52,
        sizes: ['30', '32', '34', '36'],
        colors: ['Raw Dark Navy'],
        images: [
          'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
        ],
        category: 'Jeans',
        gender: 'men',
        stock: 30,
        fabric: '100% Selvedge Indigo Denim',
        fit: 'Regular Straight',
        occasion: 'Casual',
        pattern: 'Raw Solid',
        trending: true,
        createdAt: new Date().toISOString()
      }
    ];

    // To hit 42 items, let's duplicate and tweak a couple of items with unique IDs
    const extraProducts: Product[] = [
      {
        ...initialProducts[0], // w_saree_1
        id: 'w_saree_dup_5',
        title: 'Handloom Tussar Silk Saree',
        price: 6899,
        discount: 10,
        trending: false,
        createdAt: new Date().toISOString()
      },
      {
        ...initialProducts[8], // w_hoodie_1
        id: 'w_hoodie_dup_5',
        title: 'French Terry Sherpa Lined Hoodie',
        price: 3999,
        discount: 15,
        trending: false,
        createdAt: new Date().toISOString()
      }
    ];

    const allProducts = [...initialProducts, ...extraProducts];
    const allProductsMapped = allProducts.map(p => ({
      ...p,
      id: getUUID(p.id)
    }));
    await Product.bulkCreate(allProductsMapped as any, { transaction });
    console.log(`Seeded ${allProducts.length} curated categories products successfully.`);
  }

  const couponsCount = await Coupon.count({ transaction });
  if (couponsCount === 0) {
    const initialCoupons: any[] = [
      {
        code: 'FASHION10',
        discountPercent: 10,
        maxDiscount: 500,
        minOrderAmount: 1000,
        expiryDate: '2028-12-31'
      },
      {
        code: 'PREMIUM20',
        discountPercent: 20,
        maxDiscount: 1500,
        minOrderAmount: 3000,
        expiryDate: '2028-12-31'
      },
      {
        code: 'FESTIVE30',
        discountPercent: 30,
        maxDiscount: 3000,
        minOrderAmount: 5000,
        expiryDate: '2028-12-31'
      }
    ];
    await Coupon.bulkCreate(initialCoupons as any, { transaction });
    console.log('Seeded coupons successfully.');
  }

  // Seed default reviews
  const reviewsCount = await Review.count({ transaction });
  if (reviewsCount === 0) {
    const initialReviews: any[] = [
      {
        id: 'r1',
        productId: 'm_shirt_1',
        userId: 'u1',
        userName: 'John Doe',
        rating: 5,
        comment: 'Absolutely amazing fit and premium fabric! Feels incredibly smooth and has a nice weight to it. Will buy more colors soon.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'r2',
        productId: 'm_shirt_1',
        userId: 'u2',
        userName: 'Alex Carter',
        rating: 4,
        comment: 'Nice shirt, runs slightly tight on the shoulders but the overall stitching quality is excellent.',
        createdAt: new Date().toISOString()
      },
      {
        id: 'r3',
        productId: 'w_saree_1',
        userId: 'u1',
        userName: 'Jessica Miller',
        rating: 5,
        comment: 'Stunning silk Saree! Handloom weaving details are gorgeous. High-end look for family gatherings.',
        createdAt: new Date().toISOString()
      }
    ];

    const reviewsMapped = initialReviews.map(r => ({
      ...r,
      id: getUUID(r.id),
      productId: getUUID(r.productId),
      userId: getUUID(r.userId)
    }));
    await Review.bulkCreate(reviewsMapped as any, { transaction });
    console.log('Seeded reviews successfully.');
  }

    // Commit all changes atomically
    await transaction.commit();
    console.log('Database seeding committed successfully.');
  } catch (error) {
    // Rollback changes if any statement fails
    await transaction.rollback();
    console.error('Seeding database failed, transaction rolled back:', error);
    throw error;
  }
}
