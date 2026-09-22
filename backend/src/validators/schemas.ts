import { z } from 'zod';

// ================= AUTH VALIDATIONS =================
export const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).max(100),
  email: z.string().email({ message: 'Provide a valid email address' }).max(150),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }).max(100),
  role: z.enum(['user', 'boutique', 'designer']).default('user')
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
  paused: z.boolean().optional(),
  stockStatus: z.enum(['in_stock', 'out_of_stock', 'limited_stock', 'available_soon', 'discontinued']).default('in_stock')
});

export const productUpdateSchema = productSchema.partial();

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
  paymentStatus: z.enum(['Pending', 'Completed', 'Success']).default('Pending'),
  items: z.array(z.object({
    productId: z.string().min(1, { message: 'Product ID is required' }),
    quantity: z.number().int().positive({ message: 'Quantity must be a positive integer' }).default(1),
    size: z.string().optional(),
    color: z.string().optional(),
    price: z.number().optional(),
    title: z.string().optional(),
    image: z.string().optional()
  })).min(1, { message: 'Order must contain at least one item' }),
  couponCode: z.string().optional(),
  summary: z.any().optional()
});

// ================= BOUTIQUE SELLER VALIDATIONS =================
export const boutiqueProfileSchema = z.object({
  boutiqueName: z.string().min(1).max(150),
  about: z.string().max(2000).optional().default(''),
  address: z.string().max(300).optional().default(''),
  contactNumber: z.string().max(30).optional().default(''),
  email: z.string().optional().default(''),
  socialLinks: z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional()
  }).optional().default({}),
  businessHours: z.string().max(100).optional().default(''),
  experienceYears: z.union([z.number(), z.string()]).optional().default(0),
  specialization: z.string().max(150).optional().default(''),
  deliveryOptions: z.string().max(200).optional().default(''),
  pricingPolicy: z.string().max(200).optional().default(''),
  logoUrl: z.string().optional().default(''),
  bannerUrl: z.string().optional().default(''),
  verified: z.boolean().optional()
});

export const tailorSchema = z.object({
  name: z.string().min(1).max(100),
  photoUrl: z.string().optional().default(''),
  experience: z.string().max(50).optional().default(''),
  specialization: z.string().max(100).optional().default(''),
  certifications: z.array(z.string()).default([]),
  workingHours: z.string().max(100).optional().default(''),
  languages: z.array(z.string()).default([]),
  bio: z.string().max(1000).optional().default(''),
  projectsCount: z.union([z.number(), z.string()]).optional().default(0)
});

export const portfolioItemSchema = z.object({
  designName: z.string().min(1).max(150),
  category: z.string().min(1).max(100),
  description: z.string().max(1000).optional().default(''),
  fabric: z.string().max(100).optional().default(''),
  stitchingType: z.string().max(100).optional().default(''),
  completionTime: z.string().max(100).optional().default(''),
  images: z.array(z.string()).min(1, { message: 'Provide at least one portfolio image' })
});

export const tailorRequirementSchema = z.object({
  title: z.string().min(1).max(150),
  skills: z.array(z.string()).default([]),
  experience: z.string().max(50).optional().default(''),
  employmentType: z.string().max(100).optional().default('Full-time'),
  salaryRange: z.string().max(100).optional().default(''),
  location: z.string().max(100).optional().default(''),
  vacancies: z.union([z.number(), z.string()]).default(1),
  closingDate: z.string().optional().default('')
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
