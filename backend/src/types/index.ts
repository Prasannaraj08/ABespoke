export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'boutique' | 'designer' | 'admin';
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  description: string;
  price: number;
  discount: number; // percentage
  rating: number;
  reviewsCount: number;
  sizes: string[];
  colors: string[];
  images: string[];
  category: string;
  gender: 'men' | 'women';
  stock: number;
  fabric: string;
  sleeve?: string;
  fit: string;
  occasion: string;
  pattern: string;
  trending: boolean;
  createdAt: string;
  sku?: string;
  deliveryTime?: string;
  careInstructions?: string;
  returnPolicy?: string;
  paused?: boolean;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'limited_stock' | 'available_soon' | 'discontinued';
}

export interface CartItem {
  productId: string;
  size: string;
  color: string;
  quantity: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
}

export interface Wishlist {
  userId: string;
  productIds: string[];
}

export interface Address {
  id: string;
  userId: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface OrderItem {
  productId: string;
  title: string;
  brand: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
  image: string;
}

export interface OrderSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
}

export interface Order {
  id: string;
  userId: string;
  addressId: string;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: 'Placed' | 'Shipped' | 'Out for Delivery' | 'Delivered' | 'Cancelled';
  items: OrderItem[];
  summary: OrderSummary;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  maxDiscount: number;
  minOrderAmount: number;
  expiryDate: string;
}

export interface BoutiqueProfile {
  userId: string;
  boutiqueName: string;
  logoUrl?: string;
  bannerUrl?: string;
  about: string;
  address: string;
  contactNumber: string;
  email: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string };
  businessHours: string;
  experienceYears: number;
  specialization: string;
  verified: boolean;
  deliveryOptions: string;
  pricingPolicy: string;
  followersCount?: number;
}

export interface DesignerProfile {
  userId: string;
  designerName: string;
  portfolioImages: string[];
  exclusiveCollections: string[];
  about: string;
  verified: boolean;
  customizationTerms: string;
}

export interface CustomizationRequest {
  id: string;
  designerId: string;
  customerId: string;
  customerName: string;
  description: string;
  referenceImage?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  reply?: string;
  createdAt: string;
}

export interface Tailor {
  id: string;
  boutiqueId: string;
  name: string;
  photoUrl: string;
  experience: string;
  specialization: string;
  certifications: string[];
  workingHours: string;
  languages: string[];
  bio: string;
  rating: number;
  projectsCount: number;
}

export interface PortfolioItem {
  id: string;
  boutiqueId: string;
  images: string[];
  designName: string;
  category: string;
  description: string;
  fabric: string;
  stitchingType: string;
  completionTime: string;
  customerReview?: string;
}

export interface TailorRequirement {
  id: string;
  boutiqueId: string;
  title: string;
  skills: string[];
  experience: string;
  employmentType: string;
  salaryRange: string;
  location: string;
  vacancies: number;
  closingDate: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'order' | 'inventory' | 'tailor' | 'customer';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
