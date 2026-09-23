import 'dotenv/config';
import sequelize from './database';
import { Product, DesignerProfile, BoutiqueProfile, User } from './models';

interface ProductSpec {
  title: string;
  brand: string;
  description: string;
  price: number;
  discount: number;
  category: string;
  gender: 'men' | 'women';
  fabric: string;
  fit: string;
  occasion: string;
  pattern: string;
  images: string[];
}

const CATALOG_DEFINITIONS: Record<string, ProductSpec> = {
  // === SAREES (Boutique) ===
  'Kanjeevaram Pure Silk Saree': {
    title: 'Kanjeevaram Pure Silk Saree',
    brand: 'ABespoke Boutique',
    description: 'An authentic Kanjeevaram pure silk saree handcrafted by master weavers with pure gold zari borders. Curated exclusively for ABespoke Boutique atelier.',
    price: 6999,
    discount: 15,
    category: 'Sarees',
    gender: 'women',
    fabric: 'Kanjeevaram Silk',
    fit: 'Traditional Drape',
    occasion: 'Festive & Wedding',
    pattern: 'Zari Woven',
    images: [
      'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Banarasi Brocade Silk Saree': {
    title: 'Banarasi Brocade Silk Saree',
    brand: 'ABespoke Boutique',
    description: 'Traditional Banarasi brocade silk saree with intricate floral vine motifs hand-loomed with metallic gold threads. Sourced directly by ABespoke Boutique.',
    price: 5499,
    discount: 10,
    category: 'Sarees',
    gender: 'women',
    fabric: 'Banarasi Silk',
    fit: 'Traditional Drape',
    occasion: 'Wedding',
    pattern: 'Floral Zari',
    images: [
      'https://images.unsplash.com/photo-1610030470298-40b355e717dc?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Handcrafted Chanderi Cotton Saree': {
    title: 'Handcrafted Chanderi Cotton Saree',
    brand: 'ABespoke Boutique',
    description: 'Bespoke lightweight Chanderi cotton-silk saree with hand-blocked geometric borders and breathable comfort. Boutique exclusive drape.',
    price: 2499,
    discount: 15,
    category: 'Sarees',
    gender: 'women',
    fabric: 'Chanderi Silk-Cotton',
    fit: 'Traditional Drape',
    occasion: 'Casual Festive',
    pattern: 'Hand Block Print',
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Printed Georgette Summer Saree': {
    title: 'Printed Georgette Summer Saree',
    brand: 'ABespoke Boutique',
    description: 'Lightweight fluid georgette saree featuring artistic floral digital prints. Easy-to-drape everyday luxury from ABespoke Boutique.',
    price: 1499,
    discount: 10,
    category: 'Sarees',
    gender: 'women',
    fabric: 'Faux Georgette',
    fit: 'Traditional Drape',
    occasion: 'Casual Wear',
    pattern: 'Floral Print',
    images: [
      'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Handloom Tussar Silk Saree': {
    title: 'Handloom Tussar Silk Saree',
    brand: 'ABespoke Boutique',
    description: 'Rich textured organic Tussar silk saree with contrasting pallu hand-loomed by artisan partners. ABespoke Boutique heritage edition.',
    price: 4499,
    discount: 10,
    category: 'Sarees',
    gender: 'women',
    fabric: 'Pure Tussar Silk',
    fit: 'Traditional Drape',
    occasion: 'Festive',
    pattern: 'Handloom Textured',
    images: [
      'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === LEHENGAS (Designer) ===
  'Royal Velvet Embroidered Lehenga Set': {
    title: 'Royal Velvet Embroidered Lehenga Set',
    brand: 'Sabyasachi Label',
    description: 'Haute couture bridal lehenga hand-crafted in plush royal velvet with heavy zardozi gold embroidery. From Sabyasachi Label private bridal runway.',
    price: 8999,
    discount: 10,
    category: 'Lehengas',
    gender: 'women',
    fabric: 'Micro Velvet',
    fit: 'Flared Lehenga Fit',
    occasion: 'Bridal Wear',
    pattern: 'Zardozi Embroidered',
    images: [
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Georgette Sequined Party Lehenga': {
    title: 'Georgette Sequined Party Lehenga',
    brand: 'Sabyasachi Label',
    description: 'Contemporary cocktail lehenga heavily embellished with metallic sequins and tone-on-tone embroidery. Designed by Sabyasachi Label.',
    price: 5999,
    discount: 15,
    category: 'Lehengas',
    gender: 'women',
    fabric: 'Georgette & Net',
    fit: 'Flared Fit',
    occasion: 'Sangeet & Reception',
    pattern: 'Sequined',
    images: [
      'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Floral Silk Festive Lehenga Choli': {
    title: 'Floral Silk Festive Lehenga Choli',
    brand: 'Sabyasachi Label',
    description: 'Digital art silk lehenga choli featuring heritage floral motifs, embellished waistband, and lightweight dupatta by Sabyasachi Label.',
    price: 4999,
    discount: 10,
    category: 'Lehengas',
    gender: 'women',
    fabric: 'Art Silk',
    fit: 'Regular Flared',
    occasion: 'Festive & Mehndi',
    pattern: 'Heritage Floral',
    images: [
      'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Organza Pastel Designer Lehenga': {
    title: 'Organza Pastel Designer Lehenga',
    brand: 'Sabyasachi Label',
    description: 'Dreamy pastel organza lehenga set adorned with delicate French wire embroidery and ruffled dupatta from Sabyasachi Label summer collection.',
    price: 6999,
    discount: 15,
    category: 'Lehengas',
    gender: 'women',
    fabric: 'Premium Organza',
    fit: 'A-Line Flared',
    occasion: 'Wedding Guest',
    pattern: 'Thread Embroidery',
    images: [
      'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === HALF SAREES (Boutique) ===
  'Kanchipuram Silk Half Saree Set': {
    title: 'Kanchipuram Silk Half Saree Set',
    brand: 'ABespoke Boutique',
    description: 'Traditional South Indian Pavadai Davani set with pure silk pleated skirt, embellished raw silk blouse, and silk dhavani veil by ABespoke Boutique.',
    price: 4999,
    discount: 15,
    category: 'Half Sarees',
    gender: 'women',
    fabric: 'Pure Kanchipuram Silk',
    fit: 'Pavadai Lehenga Fit',
    occasion: 'Traditional Festive',
    pattern: 'Temple Zari Borders',
    images: [
      'https://images.unsplash.com/photo-1583391733975-00c73e04cfb9?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Georgette Sequined Half Saree': {
    title: 'Georgette Sequined Half Saree',
    brand: 'ABespoke Boutique',
    description: 'Bespoke modern Half Saree set crafted in lightweight georgette with shimmering border highlights by ABespoke Boutique.',
    price: 3499,
    discount: 10,
    category: 'Half Sarees',
    gender: 'women',
    fabric: 'Faux Georgette',
    fit: 'Pavadai Flared',
    occasion: 'Festive',
    pattern: 'Sequined Work',
    images: [
      'https://images.unsplash.com/photo-1610030469668-93535c17b6b3?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Banarasi Brocade Half Saree': {
    title: 'Banarasi Brocade Half Saree',
    brand: 'ABespoke Boutique',
    description: 'Vibrant Banarasi brocade woven pavadai set with rich silk blouse piece and matching veil. Custom tailored at ABespoke Boutique atelier.',
    price: 4499,
    discount: 15,
    category: 'Half Sarees',
    gender: 'women',
    fabric: 'Banarasi Silk Blend',
    fit: 'Traditional Flared',
    occasion: 'Festive Celebrations',
    pattern: 'Brocade Woven',
    images: [
      'https://images.unsplash.com/photo-1610030470298-40b355e717dc?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Floral Print Organza Half Saree': {
    title: 'Floral Print Organza Half Saree',
    brand: 'ABespoke Boutique',
    description: 'Pastel organza pavadai set with delicate floral prints and lightweight drape. ABespoke Boutique custom collection.',
    price: 2999,
    discount: 10,
    category: 'Half Sarees',
    gender: 'women',
    fabric: 'Organza & Silk',
    fit: 'A-Line Pavadai',
    occasion: 'Casual Festive',
    pattern: 'Floral Digital Print',
    images: [
      'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === KURTIS (Boutique) ===
  'Chikankari Hand Embroidered Kurti': {
    title: 'Chikankari Hand Embroidered Kurti',
    brand: 'ABespoke Boutique',
    description: 'Authentic Lucknowi Chikankari hand-embroidered georgette tunic with intricate needlework, tailored by ABespoke master tailors.',
    price: 1999,
    discount: 15,
    category: 'Kurtis',
    gender: 'women',
    fabric: 'Georgette Cotton Blend',
    fit: 'Regular Straight',
    occasion: 'Semi-Formal',
    pattern: 'Hand Embroidered',
    images: [
      'https://images.unsplash.com/photo-1608748010899-18f300247112?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Anarkali flared Cotton Kurti': {
    title: 'Anarkali flared Cotton Kurti',
    brand: 'ABespoke Boutique',
    description: 'Bespoke flared Anarkali kurti crafted from breathable 100% organic cotton with subtle floral print accents. ABespoke Boutique atelier.',
    price: 1499,
    discount: 10,
    category: 'Kurtis',
    gender: 'women',
    fabric: '100% Organic Cotton',
    fit: 'Anarkali Flared',
    occasion: 'Casual Daily',
    pattern: 'Floral Print',
    images: [
      'https://images.unsplash.com/photo-1589810635657-232948472d98?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Designer Tunic length Kurti': {
    title: 'Designer Tunic length Kurti',
    brand: 'ABespoke Boutique',
    description: 'Contemporary short tunic kurti featuring neat Mandarin collar, side pockets, and relaxed linen silhouette by ABespoke Boutique.',
    price: 999,
    discount: 10,
    category: 'Kurtis',
    gender: 'women',
    fabric: 'Linen Cotton Blend',
    fit: 'Straight Tunic',
    occasion: 'Daily Office Wear',
    pattern: 'Solid Colored',
    images: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Premium Chanderi Silk Tunic Kurti': {
    title: 'Premium Chanderi Silk Tunic Kurti',
    brand: 'ABespoke Boutique',
    description: 'Fine Chanderi silk tunic kurti with subtle zari thread highlights around neckline and cuffs. ABespoke Boutique festive line.',
    price: 2499,
    discount: 15,
    category: 'Kurtis',
    gender: 'women',
    fabric: 'Chanderi Silk',
    fit: 'Regular Straight',
    occasion: 'Festive Gathering',
    pattern: 'Neckline Hand Embroidery',
    images: [
      'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === HOODIES (Boutique) ===
  'Cashmere Blend Knit Hoodie': {
    title: 'Cashmere Blend Knit Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Ultra-soft oversized knit hoodie crafted from a luxury cotton-cashmere blend. ABespoke Boutique premium knitwear.',
    price: 2499,
    discount: 10,
    category: 'Hoodies',
    gender: 'women',
    fabric: '90% Cotton, 10% Cashmere',
    fit: 'Oversized Fit',
    occasion: 'Casual Lounge',
    pattern: 'Solid Knit',
    images: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Crop Fleece Athletic Hoodie': {
    title: 'Crop Fleece Athletic Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Soft brushed-fleece crop hoodie featuring clean tailored seams and adjustable toggles by ABespoke Boutique.',
    price: 1499,
    discount: 10,
    category: 'Hoodies',
    gender: 'women',
    fabric: 'Cotton-Polyester Fleece',
    fit: 'Cropped Relaxed',
    occasion: 'Casual Sportswear',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Premium French Terry Hoodie': {
    title: 'Premium French Terry Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Organic heavy cotton French Terry hoodie with lined hood and precision flatlock stitching. ABespoke Boutique essential line.',
    price: 1999,
    discount: 15,
    category: 'Hoodies',
    gender: 'women',
    fabric: '100% Organic Cotton',
    fit: 'Regular Fit',
    occasion: 'Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Active zip-up Running Hoodie': {
    title: 'Active zip-up Running Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Slim tailored athletic hoodie with full zipper entry and moisture-management tech fabric from ABespoke Boutique.',
    price: 1499,
    discount: 10,
    category: 'Hoodies',
    gender: 'women',
    fabric: 'Polyester-Elastane Tech',
    fit: 'Slim Fit',
    occasion: 'Active Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'French Terry Sherpa Lined Hoodie': {
    title: 'French Terry Sherpa Lined Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Heavyweight sherpa-lined fleece hoodie offering superior insulation and tailored comfort. ABespoke Boutique cold-weather staple.',
    price: 2799,
    discount: 10,
    category: 'Hoodies',
    gender: 'women',
    fabric: 'Heavyweight Cotton Fleece',
    fit: 'Relaxed Fit',
    occasion: 'Winter Casual',
    pattern: 'Solid Warm',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === MEN'S SHIRTS (Boutique) ===
  'Classic Slim Fit Oxford Shirt': {
    title: 'Classic Slim Fit Oxford Shirt',
    brand: 'ABespoke Boutique',
    description: 'Bespoke tailored Oxford shirt in 100% long-staple cotton featuring button-down collar and mother-of-pearl buttons by ABespoke master tailors.',
    price: 1499,
    discount: 15,
    category: 'Shirts',
    gender: 'men',
    fabric: '100% Cotton Oxford',
    fit: 'Slim Fit',
    occasion: 'Business Casual',
    pattern: 'Solid Oxford',
    images: [
      'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Striped Cotton Pique Polo Shirt': {
    title: 'Striped Cotton Pique Polo Shirt',
    brand: 'ABespoke Boutique',
    description: 'Premium knit pique cotton polo with contrast stripe collar and tailored sleeve cuffs. ABespoke Boutique smart casual collection.',
    price: 1199,
    discount: 10,
    category: 'Shirts',
    gender: 'men',
    fabric: '100% Pique Cotton',
    fit: 'Regular Fit',
    occasion: 'Weekend Casual',
    pattern: 'Striped',
    images: [
      'https://images.unsplash.com/photo-1625910513413-7d8487779ef4?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Breathable Casual Linen Shirt': {
    title: 'Breathable Casual Linen Shirt',
    brand: 'ABespoke Boutique',
    description: 'Pure French flax linen button-down shirt with spread collar and clean hemline. ABespoke Boutique resort edition.',
    price: 1799,
    discount: 10,
    category: 'Shirts',
    gender: 'men',
    fabric: '100% Pure Linen',
    fit: 'Relaxed Fit',
    occasion: 'Resort & Casual',
    pattern: 'Solid Linen',
    images: [
      'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Premium Herringbone Dress Shirt': {
    title: 'Premium Herringbone Dress Shirt',
    brand: 'ABespoke Boutique',
    description: 'Fine double-ply Egyptian cotton dress shirt with subtle herringbone texture and French cuffs. Hand-finished at ABespoke Boutique atelier.',
    price: 2299,
    discount: 10,
    category: 'Shirts',
    gender: 'men',
    fabric: 'Double-Ply Cotton',
    fit: 'Tailored Fit',
    occasion: 'Formal & Black Tie',
    pattern: 'Herringbone',
    images: [
      'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === MEN'S PANTS (Boutique) ===
  'Tech Stretch Chino Trousers': {
    title: 'Tech Stretch Chino Trousers',
    brand: 'ABespoke Boutique',
    description: 'Tailored stretch chino trousers with water-repellent finish, flex waistband, and concealed pocket. ABespoke Boutique modern tailoring.',
    price: 1999,
    discount: 10,
    category: 'Pants',
    gender: 'men',
    fabric: 'Cotton-Elastane Stretch',
    fit: 'Slim Tapered',
    occasion: 'Smart Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Tailored Wool-Blend Dress Pants': {
    title: 'Tailored Wool-Blend Dress Pants',
    brand: 'ABespoke Boutique',
    description: 'Flat-front formal trousers crafted in fine Italian wool-blend with side adjusters and hand-finished hems by ABespoke tailors.',
    price: 2999,
    discount: 15,
    category: 'Pants',
    gender: 'men',
    fabric: 'Wool-Polyester Blend',
    fit: 'Slim Fit',
    occasion: 'Formal Business',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Pleated Cotton Comfort Trousers': {
    title: 'Pleated Cotton Comfort Trousers',
    brand: 'ABespoke Boutique',
    description: 'Double-pleated twill cotton trousers offering classic elegance and comfortable seat. ABespoke Boutique sartorial collection.',
    price: 1499,
    discount: 10,
    category: 'Pants',
    gender: 'men',
    fabric: '100% Twill Cotton',
    fit: 'Relaxed Fit',
    occasion: 'Office Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Summer Linen Cargo Pants': {
    title: 'Summer Linen Cargo Pants',
    brand: 'ABespoke Boutique',
    description: 'Breathable linen-cotton relaxed cargo pants with drawstring waistband and tailored pocket profile from ABespoke Boutique.',
    price: 1799,
    discount: 10,
    category: 'Pants',
    gender: 'men',
    fabric: 'Linen Cotton Blend',
    fit: 'Loose Casual Fit',
    occasion: 'Travel & Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === MEN'S HOODIES (Boutique) ===
  'Classic French Terry Loopback Hoodie': {
    title: 'Classic French Terry Loopback Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Heavyweight organic cotton loopback hoodie with double-lined hood and tailored raglan shoulders by ABespoke Boutique.',
    price: 2299,
    discount: 15,
    category: 'Hoodies',
    gender: 'men',
    fabric: '100% French Terry Cotton',
    fit: 'Regular Fit',
    occasion: 'Everyday Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Premium Knit Cashmere Hoodie': {
    title: 'Premium Knit Cashmere Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Bespoke wool-cashmere sweater knit hoodie offering ultra-fine hand feel and refined loungewear look from ABespoke Boutique.',
    price: 3999,
    discount: 10,
    category: 'Hoodies',
    gender: 'men',
    fabric: '90% Wool, 10% Cashmere',
    fit: 'Tailored Knit Fit',
    occasion: 'Luxury Lounge',
    pattern: 'Ribbed Knit',
    images: [
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Athletic Tech Zip-Up Hoodie': {
    title: 'Athletic Tech Zip-Up Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Lightweight high-stretch performance hoodie with zippered pockets and quick-dry breathability from ABespoke Boutique.',
    price: 1699,
    discount: 15,
    category: 'Hoodies',
    gender: 'men',
    fabric: 'Polyester-Elastane Tech',
    fit: 'Athletic Fit',
    occasion: 'Active Casual',
    pattern: 'Solid',
    images: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Graphic Oversized Cotton Hoodie': {
    title: 'Graphic Oversized Cotton Hoodie',
    brand: 'ABespoke Boutique',
    description: 'Streetwear-inspired heavy cotton hoodie featuring minimalist atelier graphics and ribbed hems by ABespoke Boutique.',
    price: 1799,
    discount: 15,
    category: 'Hoodies',
    gender: 'men',
    fabric: '100% Heavy Cotton',
    fit: 'Oversized Fit',
    occasion: 'Streetwear',
    pattern: 'Printed Graphic',
    images: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === MEN'S BLAZERS (Designer) ===
  'Italian Tweed Single-Breasted Blazer': {
    title: 'Italian Tweed Single-Breasted Blazer',
    brand: 'Sabyasachi Label',
    description: 'Masterfully tailored single-breasted blazer in Italian tweed wool-blend with genuine horn buttons. Exclusive Sabyasachi Label collection.',
    price: 6499,
    discount: 15,
    category: 'Blazers',
    gender: 'men',
    fabric: '70% Wool, 30% Tweed',
    fit: 'Tailored Fit',
    occasion: 'Formal Gala',
    pattern: 'Textured Tweed',
    images: [
      'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Linen Summer Casual Blazer': {
    title: 'Linen Summer Casual Blazer',
    brand: 'Sabyasachi Label',
    description: 'Unstructured single-breasted blazer tailored in pure European linen. Lightweight and refined from Sabyasachi Label resort collection.',
    price: 3999,
    discount: 10,
    category: 'Blazers',
    gender: 'men',
    fabric: '100% Linen',
    fit: 'Unstructured Slim',
    occasion: 'Semi-Formal',
    pattern: 'Solid Linen',
    images: [
      'https://images.unsplash.com/photo-1593032465175-481ac7f401a0?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Classic Wool Flannel Suit Blazer': {
    title: 'Classic Wool Flannel Suit Blazer',
    brand: 'Sabyasachi Label',
    description: 'Double-breasted flannel suit blazer tailored in fine Merino wool with peak lapels from Sabyasachi Label couture menswear line.',
    price: 7999,
    discount: 15,
    category: 'Blazers',
    gender: 'men',
    fabric: '100% Merino Wool Flannel',
    fit: 'Classic Double-Breasted',
    occasion: 'Black Tie & Wedding',
    pattern: 'Solid Flannel',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Cotton Stretch Smart-Casual Blazer': {
    title: 'Cotton Stretch Smart-Casual Blazer',
    brand: 'Sabyasachi Label',
    description: 'Modern stretch knit cotton blazer engineered with natural shoulder line and flexible movement by Sabyasachi Label.',
    price: 3499,
    discount: 10,
    category: 'Blazers',
    gender: 'men',
    fabric: '95% Cotton, 5% Lycra',
    fit: 'Slim Fit',
    occasion: 'Semi-Formal Evening',
    pattern: 'Solid Stretch',
    images: [
      'https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80'
    ]
  },

  // === MEN'S JEANS (Designer) ===
  'Vintage Wash Selvedge Jeans': {
    title: 'Vintage Wash Selvedge Jeans',
    brand: 'Sabyasachi Label',
    description: 'Straight-leg Japanese selvedge denim woven on shuttle looms with hand-applied vintage whiskering. Sabyasachi Label denim edition.',
    price: 2999,
    discount: 15,
    category: 'Jeans',
    gender: 'men',
    fabric: '99% Cotton, 1% Elastane Selvedge',
    fit: 'Straight Fit',
    occasion: 'Casual',
    pattern: 'Faded Wash',
    images: [
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Slim Fit Distressed Black Jeans': {
    title: 'Slim Fit Distressed Black Jeans',
    brand: 'Sabyasachi Label',
    description: 'Black stretch denim jeans featuring custom distressed slash knee details and matte black hardware from Sabyasachi Label.',
    price: 1999,
    discount: 15,
    category: 'Jeans',
    gender: 'men',
    fabric: '98% Cotton, 2% Spandex Stretch',
    fit: 'Slim Tapered',
    occasion: 'Casual Street',
    pattern: 'Distressed Black',
    images: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Loose Fit Utility Carpenter Jeans': {
    title: 'Loose Fit Utility Carpenter Jeans',
    brand: 'Sabyasachi Label',
    description: 'Heavyweight rigid denim carpenter pants featuring side tool pockets and contrast triple-stitch seams by Sabyasachi Label.',
    price: 2299,
    discount: 10,
    category: 'Jeans',
    gender: 'men',
    fabric: '100% Heavy Cotton Denim',
    fit: 'Loose Carpenter Fit',
    occasion: 'Casual Streetwear',
    pattern: 'Stonewash',
    images: [
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=600&auto=format&fit=crop&q=80'
    ]
  },
  'Premium Raw Indigo Rigid Jeans': {
    title: 'Premium Raw Indigo Rigid Jeans',
    brand: 'Sabyasachi Label',
    description: 'Unwashed stiff raw indigo denim with button fly and copper rivets. Fades uniquely with wear. Sabyasachi Label premium denim.',
    price: 3499,
    discount: 10,
    category: 'Jeans',
    gender: 'men',
    fabric: '100% Raw Indigo Denim',
    fit: 'Regular Straight',
    occasion: 'Casual Premium',
    pattern: 'Raw Solid',
    images: [
      'https://images.unsplash.com/photo-1560243563-062bfc001d68?w=600&auto=format&fit=crop&q=80'
    ]
  }
};

async function main() {
  await sequelize.authenticate();
  console.log('PostgreSQL Connected successfully.');

  // Clean any non-boutique / non-designer residual products
  const products = await Product.findAll();
  console.log(`Auditing and updating ${products.length} products...`);

  let updatedCount = 0;
  for (const product of products) {
    const titleKey = product.title?.trim();
    if (CATALOG_DEFINITIONS[titleKey]) {
      const spec = CATALOG_DEFINITIONS[titleKey];
      product.brand = spec.brand;
      product.description = spec.description;
      product.price = spec.price;
      product.discount = spec.discount;
      product.category = spec.category;
      product.gender = spec.gender;
      product.fabric = spec.fabric;
      product.fit = spec.fit;
      product.occasion = spec.occasion;
      product.pattern = spec.pattern;
      product.images = spec.images;
      await product.save();
      updatedCount++;
      console.log(`[OK] Updated ${product.title} | Brand: ${product.brand} | Price: Rs. ${product.price}`);
    }
  }

  // Ensure PRASANNARAJ T designer collection exists in products
  const prasannaDesigner = await DesignerProfile.findOne({ where: { userId: 'u_1784979581861' } });
  if (prasannaDesigner && prasannaDesigner.portfolioImages && prasannaDesigner.portfolioImages.length > 0) {
    await Product.upsert({
      id: 'prod_dsg_u_1784979581861_0',
      title: 'PRASANNARAJ T Royal Bridal Couture',
      brand: 'PRASANNARAJ T',
      description: 'Exclusive couture royal bridal creation from PRASANNARAJ T private designer lookbook.',
      price: 7999,
      discount: 10,
      rating: 5.0,
      reviewsCount: 0,
      sizes: ['Custom Sizing', 'S', 'M', 'L', 'XL'],
      colors: ['Designer Exclusive'],
      images: prasannaDesigner.portfolioImages,
      category: 'Lehengas',
      gender: 'women',
      stock: 5,
      fabric: 'Pure Zari Silk',
      fit: 'Custom Tailored Fit',
      occasion: 'Bridal & Gala',
      pattern: 'Bespoke Zardozi',
      trending: true,
      paused: false,
      stockStatus: 'in_stock',
      createdAt: new Date().toISOString()
    });
    console.log('[OK] Synced PRASANNARAJ T Designer Collection into live catalog.');
  }

  console.log(`\nSuccess! Updated ${updatedCount} products exclusively under Boutique & Designer brands with fair market pricing.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Failed to sync catalog:', err);
  process.exit(1);
});
