import { z } from 'zod';

// ================= AUTH VALIDATIONS =================
export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).max(100),
  email: z.string().email({ message: 'Provide a valid email address' }).max(150),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }).max(100),
  role: z.enum(['user', 'boutique', 'designer', 'admin']).default('user')
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Provide a valid email address' }),
  password: z.string().min(1, { message: 'Password is required' })
});

// ================= PRODUCT & REVIEW VALIDATIONS =================
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5, { message: 'Rating must be between 1 and 5' }),
  comment: z.string().min(2, { message: 'Comment must be at least 2 characters long' }).max(1000)
});

export const productSchema = z.object({
  title: z.string().min(2).max(200),
  brand: z.string().min(2).max(100),
  description: z.string().min(10).max(5000),
  price: z.number().int().positive(),
  discount: z.number().int().min(0).max(100).default(0),
  sizes: z.array(z.string()).min(1, { message: 'Provide at least one size' }),
  colors: z.array(z.string()).min(1, { message: 'Provide at least one color' }),
  images: z.array(z.string().url()).min(1, { message: 'Provide at least one product image URL' }),
  category: z.string().min(2).max(100),
  gender: z.enum(['men', 'women']),
  stock: z.number().int().nonnegative().default(0),
  fabric: z.string().min(2).max(100),
  sleeve: z.string().optional(),
  fit: z.string().min(2).max(100),
  occasion: z.string().min(2).max(100),
  pattern: z.string().min(2).max(100),
  trending: z.boolean().default(false),
  sku: z.string().optional(),
  deliveryTime: z.string().optional(),
  careInstructions: z.string().optional(),
  returnPolicy: z.string().optional(),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited_stock', 'available_soon', 'discontinued']).default('in_stock')
});

// ================= ADDRESS & ORDER VALIDATIONS =================
export const addressSchema = z.object({
  name: z.string().min(2).max(100),
  phone: z.string().regex(/^\+?[0-9\s-]{10,15}$/, { message: 'Provide a valid phone number' }),
  street: z.string().min(5).max(300),
  city: z.string().min(2).max(100),
  state: z.string().min(2).max(100),
  pincode: z.string().regex(/^[0-9]{5,6}$/, { message: 'Provide a valid 5 or 6 digit pincode' }),
  isDefault: z.boolean().default(false)
});

export const orderSchema = z.object({
  addressId: z.string().min(1, { message: 'Address ID is required' }),
  paymentMethod: z.enum(['UPI', 'Card', 'Net Banking', 'COD']),
  paymentStatus: z.enum(['Pending', 'Completed']).default('Pending')
});

// ================= BOUTIQUE SELLER VALIDATIONS =================
export const boutiqueProfileSchema = z.object({
  boutiqueName: z.string().min(2).max(150),
  about: z.string().min(10).max(2000),
  address: z.string().min(5).max(300),
  contactNumber: z.string().regex(/^\+?[0-9\s-]{10,15}$/, { message: 'Provide a valid contact number' }),
  email: z.string().email(),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional()
  }).default({}),
  businessHours: z.string().min(2).max(100),
  experienceYears: z.number().int().nonnegative().default(0),
  specialization: z.string().min(2).max(150),
  deliveryOptions: z.string().min(2).max(200),
  pricingPolicy: z.string().min(2).max(200),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional()
});

export const tailorSchema = z.object({
  name: z.string().min(2).max(100),
  photoUrl: z.string().url().optional(),
  experience: z.string().min(1).max(50),
  specialization: z.string().min(2).max(100),
  certifications: z.array(z.string()).default([]),
  workingHours: z.string().min(2).max(100),
  languages: z.array(z.string()).default([]),
  bio: z.string().max(1000).default('')
});

export const portfolioItemSchema = z.object({
  designName: z.string().min(2).max(150),
  category: z.string().min(2).max(100),
  description: z.string().max(1000).default(''),
  fabric: z.string().min(2).max(100),
  stitchingType: z.string().min(2).max(100),
  completionTime: z.string().min(1).max(100),
  images: z.array(z.string().url()).min(1, { message: 'Provide at least one portfolio image URL' })
});

export const tailorRequirementSchema = z.object({
  title: z.string().min(2).max(150),
  skills: z.array(z.string()).min(1),
  experience: z.string().min(1).max(50),
  employmentType: z.string().min(2).max(100),
  salaryRange: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
  vacancies: z.number().int().positive().default(1),
  closingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Provide closing date in YYYY-MM-DD format' })
});

// ================= DESIGNER VALIDATIONS =================
export const designerProfileSchema = z.object({
  designerName: z.string().min(2).max(150),
  about: z.string().max(2000).optional().default('Haute couture fashion collections.'),
  customizationTerms: z.string().max(1000).optional().default('Custom size adjustments upon request.'),
  portfolioImages: z.array(z.string()).default([]),
  exclusiveCollections: z.array(z.string()).default([])
});

export const customizationRequestSchema = z.object({
  description: z.string().min(10, { message: 'Description must be at least 10 characters long' }).max(2000),
  referenceImage: z.string().url().optional()
});
