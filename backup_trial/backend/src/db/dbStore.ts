import fs from 'fs';
import path from 'path';
import { User, Product, Review, Address, Cart, Wishlist, Order, Coupon, BoutiqueProfile, DesignerProfile, CustomizationRequest, Tailor, PortfolioItem, TailorRequirement, Notification } from '../types';

// On Vercel: use /tmp (writable, ephemeral). Locally: use the project's data/ folder.
const IS_VERCEL = !!process.env.VERCEL;
const SEED_DATA_DIR = path.join(__dirname, '../../data');
const DATA_DIR = IS_VERCEL ? '/tmp/clara-data' : SEED_DATA_DIR;

const DATA_FILES = [
  'users.json', 'products.json', 'reviews.json', 'addresses.json',
  'carts.json', 'wishlists.json', 'orders.json', 'coupons.json',
  'boutiques.json', 'designers.json', 'customizations.json',
  'tailors.json', 'portfolios.json', 'tailor_requirements.json', 'notifications.json'
];

class DatabaseStore {
  private usersFile = path.join(DATA_DIR, 'users.json');
  private productsFile = path.join(DATA_DIR, 'products.json');
  private reviewsFile = path.join(DATA_DIR, 'reviews.json');
  private addressesFile = path.join(DATA_DIR, 'addresses.json');
  private cartsFile = path.join(DATA_DIR, 'carts.json');
  private wishlistsFile = path.join(DATA_DIR, 'wishlists.json');
  private ordersFile = path.join(DATA_DIR, 'orders.json');
  private couponsFile = path.join(DATA_DIR, 'coupons.json');
  private boutiquesFile = path.join(DATA_DIR, 'boutiques.json');
  private designersFile = path.join(DATA_DIR, 'designers.json');
  private customizationsFile = path.join(DATA_DIR, 'customizations.json');
  private tailorsFile = path.join(DATA_DIR, 'tailors.json');
  private portfoliosFile = path.join(DATA_DIR, 'portfolios.json');
  private requirementsFile = path.join(DATA_DIR, 'tailor_requirements.json');
  private notificationsFile = path.join(DATA_DIR, 'notifications.json');

  constructor() {
    this.ensureDataDirectory();
    if (IS_VERCEL) {
      this.initFromSeedIfNeeded();
    }
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  // On Vercel cold start: copy bundled seed files into /tmp so reads have data
  private initFromSeedIfNeeded() {
    for (const file of DATA_FILES) {
      const tmpFile = path.join(DATA_DIR, file);
      const seedFile = path.join(SEED_DATA_DIR, file);
      if (!fs.existsSync(tmpFile)) {
        if (fs.existsSync(seedFile)) {
          try {
            fs.copyFileSync(seedFile, tmpFile);
          } catch {
            // If seed file missing, write empty array
            fs.writeFileSync(tmpFile, '[]', 'utf-8');
          }
        } else {
          fs.writeFileSync(tmpFile, '[]', 'utf-8');
        }
      }
    }
  }

  private readJSON<T>(filePath: string, defaultVal: T): T {
    try {
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data) as T;
      }
    } catch (err) {
      console.error(`Error reading database file: ${filePath}`, err);
    }
    return defaultVal;
  }

  private writeJSON<T>(filePath: string, data: T) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error(`Error writing database file: ${filePath}`, err);
    }
  }

  // --- Users Table ---
  getUsers(): User[] { return this.readJSON<User[]>(this.usersFile, []); }
  saveUsers(users: User[]) { this.writeJSON<User[]>(this.usersFile, users); }

  // --- Products Table ---
  getProducts(): Product[] { return this.readJSON<Product[]>(this.productsFile, []); }
  saveProducts(products: Product[]) { this.writeJSON<Product[]>(this.productsFile, products); }

  // --- Reviews Table ---
  getReviews(): Review[] { return this.readJSON<Review[]>(this.reviewsFile, []); }
  saveReviews(reviews: Review[]) { this.writeJSON<Review[]>(this.reviewsFile, reviews); }

  // --- Addresses Table ---
  getAddresses(): Address[] { return this.readJSON<Address[]>(this.addressesFile, []); }
  saveAddresses(addresses: Address[]) { this.writeJSON<Address[]>(this.addressesFile, addresses); }

  // --- Carts Table ---
  getCarts(): Cart[] { return this.readJSON<Cart[]>(this.cartsFile, []); }
  saveCarts(carts: Cart[]) { this.writeJSON<Cart[]>(this.cartsFile, carts); }

  // --- Wishlists Table ---
  getWishlists(): Wishlist[] { return this.readJSON<Wishlist[]>(this.wishlistsFile, []); }
  saveWishlists(wishlists: Wishlist[]) { this.writeJSON<Wishlist[]>(this.wishlistsFile, wishlists); }

  // --- Orders Table ---
  getOrders(): Order[] { return this.readJSON<Order[]>(this.ordersFile, []); }
  saveOrders(orders: Order[]) { this.writeJSON<Order[]>(this.ordersFile, orders); }

  // --- Coupons Table ---
  getCoupons(): Coupon[] { return this.readJSON<Coupon[]>(this.couponsFile, []); }
  saveCoupons(coupons: Coupon[]) { this.writeJSON<Coupon[]>(this.couponsFile, coupons); }

  // --- Boutiques Table ---
  getBoutiqueProfiles(): BoutiqueProfile[] { return this.readJSON<BoutiqueProfile[]>(this.boutiquesFile, []); }
  saveBoutiqueProfiles(profiles: BoutiqueProfile[]) { this.writeJSON<BoutiqueProfile[]>(this.boutiquesFile, profiles); }

  // --- Designers Table ---
  getDesignerProfiles(): DesignerProfile[] { return this.readJSON<DesignerProfile[]>(this.designersFile, []); }
  saveDesignerProfiles(profiles: DesignerProfile[]) { this.writeJSON<DesignerProfile[]>(this.designersFile, profiles); }

  // --- Customizations Table ---
  getCustomizationRequests(): CustomizationRequest[] { return this.readJSON<CustomizationRequest[]>(this.customizationsFile, []); }
  saveCustomizationRequests(requests: CustomizationRequest[]) { this.writeJSON<CustomizationRequest[]>(this.customizationsFile, requests); }

  // --- Tailors Table ---
  getTailors(): Tailor[] { return this.readJSON<Tailor[]>(this.tailorsFile, []); }
  saveTailors(tailors: Tailor[]) { this.writeJSON<Tailor[]>(this.tailorsFile, tailors); }

  // --- Portfolios Table ---
  getPortfolios(): PortfolioItem[] { return this.readJSON<PortfolioItem[]>(this.portfoliosFile, []); }
  savePortfolios(portfolios: PortfolioItem[]) { this.writeJSON<PortfolioItem[]>(this.portfoliosFile, portfolios); }

  // --- Tailor Requirements Table ---
  getTailorRequirements(): TailorRequirement[] { return this.readJSON<TailorRequirement[]>(this.requirementsFile, []); }
  saveTailorRequirements(requirements: TailorRequirement[]) { this.writeJSON<TailorRequirement[]>(this.requirementsFile, requirements); }

  // --- Notifications Table ---
  getNotifications(): Notification[] { return this.readJSON<Notification[]>(this.notificationsFile, []); }
  saveNotifications(notifications: Notification[]) { this.writeJSON<Notification[]>(this.notificationsFile, notifications); }
}

export const db = new DatabaseStore();
export default db;
