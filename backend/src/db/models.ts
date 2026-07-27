import { DataTypes, Model } from 'sequelize';
import { randomUUID } from 'crypto';
import sequelize from './database';

// Helper to generate UUIDs
const generateUUID = () => randomUUID();

// ================= USER MODEL =================
export class User extends Model {
  public id!: string;
  public name!: string;
  public email!: string;
  public passwordHash!: string;
  public role!: 'user' | 'boutique' | 'designer' | 'admin';
  public createdAt!: string;
}
User.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, allowNull: false }
}, { 
  sequelize, 
  modelName: 'User', 
  tableName: 'users', 
  timestamps: true, 
  updatedAt: false,
  indexes: [{ unique: true, fields: ['email'] }]
});

// ================= PRODUCT MODEL =================
export class Product extends Model {
  public id!: string;
  public title!: string;
  public brand!: string;
  public description!: string;
  public price!: number;
  public discount!: number;
  public rating!: number;
  public reviewsCount!: number;
  public sizes!: string[];
  public colors!: string[];
  public images!: string[];
  public category!: string;
  public gender!: 'men' | 'women';
  public stock!: number;
  public fabric!: string;
  public sleeve?: string;
  public fit!: string;
  public occasion!: string;
  public pattern!: string;
  public trending!: boolean;
  public sku?: string;
  public deliveryTime?: string;
  public careInstructions?: string;
  public returnPolicy?: string;
  public paused!: boolean;
  public stockStatus!: 'in_stock' | 'out_of_stock' | 'limited_stock' | 'available_soon' | 'discontinued';
  public createdAt!: string;
}
Product.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  title: { type: DataTypes.STRING, allowNull: false },
  brand: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  price: { type: DataTypes.INTEGER, allowNull: false },
  discount: { type: DataTypes.INTEGER, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  reviewsCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  sizes: { type: DataTypes.JSON, allowNull: false },
  colors: { type: DataTypes.JSON, allowNull: false },
  images: { type: DataTypes.JSON, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  gender: { type: DataTypes.STRING, allowNull: false },
  stock: { type: DataTypes.INTEGER, defaultValue: 0 },
  fabric: { type: DataTypes.STRING, allowNull: false },
  sleeve: { type: DataTypes.STRING, allowNull: true },
  fit: { type: DataTypes.STRING, allowNull: false },
  occasion: { type: DataTypes.STRING, allowNull: false },
  pattern: { type: DataTypes.STRING, allowNull: false },
  trending: { type: DataTypes.BOOLEAN, defaultValue: false },
  sku: { type: DataTypes.STRING, allowNull: true },
  deliveryTime: { type: DataTypes.STRING, allowNull: true },
  careInstructions: { type: DataTypes.TEXT, allowNull: true },
  returnPolicy: { type: DataTypes.TEXT, allowNull: true },
  paused: { type: DataTypes.BOOLEAN, defaultValue: false },
  stockStatus: { type: DataTypes.STRING, defaultValue: 'in_stock' }
}, { 
  sequelize, 
  modelName: 'Product', 
  tableName: 'products', 
  timestamps: true, 
  updatedAt: false,
  indexes: [
    { fields: ['category'] },
    { fields: ['brand'] },
    { fields: ['createdAt'] }
  ]
});

// ================= REVIEW MODEL =================
export class Review extends Model {
  public id!: string;
  public productId!: string;
  public userId!: string;
  public userName!: string;
  public rating!: number;
  public comment!: string;
  public createdAt!: string;
}
Review.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  productId: { type: DataTypes.STRING, allowNull: false },
  userId: { type: DataTypes.STRING, allowNull: false },
  userName: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false }
}, { 
  sequelize, 
  modelName: 'Review', 
  tableName: 'reviews', 
  timestamps: true, 
  updatedAt: false,
  indexes: [
    { fields: ['productId'] },
    { fields: ['userId'] }
  ]
});

// ================= ADDRESS MODEL =================
export class Address extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public phone!: string;
  public street!: string;
  public city!: string;
  public state!: string;
  public pincode!: string;
  public isDefault!: boolean;
}
Address.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  userId: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  street: { type: DataTypes.STRING, allowNull: false },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  pincode: { type: DataTypes.STRING, allowNull: false },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { 
  sequelize, 
  modelName: 'Address', 
  tableName: 'addresses', 
  timestamps: false,
  indexes: [{ fields: ['userId'] }]
});

// ================= CART MODEL =================
export class Cart extends Model {
  public userId!: string;
  public items!: any[]; // Array of CartItem objects
}
Cart.init({
  userId: { type: DataTypes.STRING, primaryKey: true },
  items: { type: DataTypes.JSON, defaultValue: [] }
}, { sequelize, modelName: 'Cart', tableName: 'carts', timestamps: false });

// ================= WISHLIST MODEL =================
export class Wishlist extends Model {
  public userId!: string;
  public productIds!: string[];
}
Wishlist.init({
  userId: { type: DataTypes.STRING, primaryKey: true },
  productIds: { type: DataTypes.JSON, defaultValue: [] }
}, { sequelize, modelName: 'Wishlist', tableName: 'wishlists', timestamps: false });

// ================= ORDER MODEL =================
export class Order extends Model {
  public id!: string;
  public userId!: string;
  public addressId!: string;
  public paymentMethod!: string;
  public paymentStatus!: string;
  public orderStatus!: 'Placed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  public items!: any[];
  public summary!: any;
  public createdAt!: string;
}
Order.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  userId: { type: DataTypes.STRING, allowNull: false },
  addressId: { type: DataTypes.STRING, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, allowNull: false },
  paymentStatus: { type: DataTypes.STRING, allowNull: false },
  orderStatus: { type: DataTypes.STRING, defaultValue: 'Placed' },
  items: { type: DataTypes.JSON, allowNull: false },
  summary: { type: DataTypes.JSON, allowNull: false }
}, { 
  sequelize, 
  modelName: 'Order', 
  tableName: 'orders', 
  timestamps: true, 
  updatedAt: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['orderStatus'] },
    { fields: ['createdAt'] }
  ]
});

// ================= COUPON MODEL =================
export class Coupon extends Model {
  public code!: string;
  public discountPercent!: number;
  public maxDiscount!: number;
  public minOrderAmount!: number;
  public expiryDate!: string;
}
Coupon.init({
  code: { type: DataTypes.STRING, primaryKey: true },
  discountPercent: { type: DataTypes.INTEGER, allowNull: false },
  maxDiscount: { type: DataTypes.INTEGER, allowNull: false },
  minOrderAmount: { type: DataTypes.INTEGER, defaultValue: 0 },
  expiryDate: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, modelName: 'Coupon', tableName: 'coupons', timestamps: false });

// ================= BOUTIQUE PROFILE MODEL =================
export class BoutiqueProfile extends Model {
  public userId!: string;
  public boutiqueName!: string;
  public logoUrl?: string;
  public bannerUrl?: string;
  public about!: string;
  public address!: string;
  public contactNumber!: string;
  public email!: string;
  public socialLinks!: any;
  public businessHours!: string;
  public experienceYears!: number;
  public specialization!: string;
  public verified!: boolean;
  public deliveryOptions!: string;
  public pricingPolicy!: string;
  public followersCount!: number;
}
BoutiqueProfile.init({
  userId: { type: DataTypes.STRING, primaryKey: true },
  boutiqueName: { type: DataTypes.STRING, allowNull: false },
  logoUrl: { type: DataTypes.STRING, allowNull: true },
  bannerUrl: { type: DataTypes.STRING, allowNull: true },
  about: { type: DataTypes.TEXT, allowNull: false },
  address: { type: DataTypes.TEXT, allowNull: false },
  contactNumber: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  socialLinks: { type: DataTypes.JSON, defaultValue: {} },
  businessHours: { type: DataTypes.STRING, allowNull: false },
  experienceYears: { type: DataTypes.INTEGER, defaultValue: 0 },
  specialization: { type: DataTypes.STRING, allowNull: false },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  deliveryOptions: { type: DataTypes.STRING, allowNull: false },
  pricingPolicy: { type: DataTypes.STRING, allowNull: false },
  followersCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, modelName: 'BoutiqueProfile', tableName: 'boutique_profiles', timestamps: false });

// ================= DESIGNER PROFILE MODEL =================
export class DesignerProfile extends Model {
  public userId!: string;
  public designerName!: string;
  public portfolioImages!: string[];
  public exclusiveCollections!: string[];
  public about!: string;
  public verified!: boolean;
  public customizationTerms!: string;
}
DesignerProfile.init({
  userId: { type: DataTypes.STRING, primaryKey: true },
  designerName: { type: DataTypes.STRING, allowNull: false },
  portfolioImages: { type: DataTypes.JSON, defaultValue: [] },
  exclusiveCollections: { type: DataTypes.JSON, defaultValue: [] },
  about: { type: DataTypes.TEXT, allowNull: false },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  customizationTerms: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, modelName: 'DesignerProfile', tableName: 'designer_profiles', timestamps: false });

// ================= CUSTOMIZATION REQUEST MODEL =================
export class CustomizationRequest extends Model {
  public id!: string;
  public designerId!: string;
  public customerId!: string;
  public customerName!: string;
  public description!: string;
  public referenceImage?: string;
  public status!: 'pending' | 'accepted' | 'rejected' | 'completed';
  public reply?: string;
  public createdAt!: string;
}
CustomizationRequest.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  designerId: { type: DataTypes.STRING, allowNull: false },
  customerId: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  referenceImage: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  reply: { type: DataTypes.TEXT, allowNull: true }
}, { 
  sequelize, 
  modelName: 'CustomizationRequest', 
  tableName: 'customization_requests', 
  timestamps: true, 
  updatedAt: false,
  indexes: [
    { fields: ['designerId'] },
    { fields: ['customerId'] }
  ]
});

// ================= TAILOR MODEL =================
export class Tailor extends Model {
  public id!: string;
  public boutiqueId!: string;
  public name!: string;
  public photoUrl!: string;
  public experience!: string;
  public specialization!: string;
  public certifications!: string[];
  public workingHours!: string;
  public languages!: string[];
  public bio!: string;
  public rating!: number;
  public projectsCount!: number;
}
Tailor.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  boutiqueId: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  photoUrl: { type: DataTypes.STRING, allowNull: false },
  experience: { type: DataTypes.STRING, allowNull: false },
  specialization: { type: DataTypes.STRING, allowNull: false },
  certifications: { type: DataTypes.JSON, defaultValue: [] },
  workingHours: { type: DataTypes.STRING, allowNull: false },
  languages: { type: DataTypes.JSON, defaultValue: [] },
  bio: { type: DataTypes.TEXT, allowNull: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  projectsCount: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { 
  sequelize, 
  modelName: 'Tailor', 
  tableName: 'tailors', 
  timestamps: false,
  indexes: [{ fields: ['boutiqueId'] }]
});

// ================= PORTFOLIO ITEM MODEL =================
export class PortfolioItem extends Model {
  public id!: string;
  public boutiqueId!: string;
  public images!: string[];
  public designName!: string;
  public category!: string;
  public description!: string;
  public fabric!: string;
  public stitchingType!: string;
  public completionTime!: string;
  public customerReview?: string;
}
PortfolioItem.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  boutiqueId: { type: DataTypes.STRING, allowNull: false },
  images: { type: DataTypes.JSON, defaultValue: [] },
  designName: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  fabric: { type: DataTypes.STRING, allowNull: false },
  stitchingType: { type: DataTypes.STRING, allowNull: false },
  completionTime: { type: DataTypes.STRING, allowNull: false },
  customerReview: { type: DataTypes.TEXT, allowNull: true }
}, { 
  sequelize, 
  modelName: 'PortfolioItem', 
  tableName: 'portfolio_items', 
  timestamps: false,
  indexes: [{ fields: ['boutiqueId'] }]
});

// ================= TAILOR REQUIREMENT MODEL =================
export class TailorRequirement extends Model {
  public id!: string;
  public boutiqueId!: string;
  public title!: string;
  public skills!: string[];
  public experience!: string;
  public employmentType!: string;
  public salaryRange!: string;
  public location!: string;
  public vacancies!: number;
  public closingDate!: string;
}
TailorRequirement.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  boutiqueId: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  skills: { type: DataTypes.JSON, defaultValue: [] },
  experience: { type: DataTypes.STRING, allowNull: false },
  employmentType: { type: DataTypes.STRING, allowNull: false },
  salaryRange: { type: DataTypes.STRING, allowNull: false },
  location: { type: DataTypes.STRING, allowNull: false },
  vacancies: { type: DataTypes.INTEGER, defaultValue: 1 },
  closingDate: { type: DataTypes.STRING, allowNull: false }
}, { 
  sequelize, 
  modelName: 'TailorRequirement', 
  tableName: 'tailor_requirements', 
  timestamps: false,
  indexes: [{ fields: ['boutiqueId'] }]
});

// ================= NOTIFICATION MODEL =================
export class Notification extends Model {
  public id!: string;
  public userId!: string;
  public type!: 'order' | 'inventory' | 'tailor' | 'customer';
  public title!: string;
  public message!: string;
  public read!: boolean;
  public createdAt!: string;
}
Notification.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: generateUUID },
  userId: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  message: { type: DataTypes.TEXT, allowNull: false },
  read: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { 
  sequelize, 
  modelName: 'Notification', 
  tableName: 'notifications', 
  timestamps: true, 
  updatedAt: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['read'] }
  ]
});

// Setup associations
User.hasMany(Address, { foreignKey: 'userId', as: 'addresses' });
Address.belongsTo(User, { foreignKey: 'userId' });
