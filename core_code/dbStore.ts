import { 
  User as UserModel, 
  Product as ProductModel, 
  Review as ReviewModel, 
  Address as AddressModel, 
  Cart as CartModel, 
  Wishlist as WishlistModel, 
  Order as OrderModel, 
  Coupon as CouponModel, 
  BoutiqueProfile as BoutiqueProfileModel, 
  DesignerProfile as DesignerModel, 
  CustomizationRequest as CustomizationModel, 
  Tailor as TailorModel, 
  PortfolioItem as PortfolioModel, 
  TailorRequirement as RequirementModel, 
  Notification as NotificationModel 
} from './models';

import { 
  User, Product, Review, Address, Cart, Wishlist, Order, Coupon, 
  BoutiqueProfile, DesignerProfile, CustomizationRequest, Tailor, 
  PortfolioItem, TailorRequirement, Notification 
} from '../types';

class DatabaseStore {
  // In-Memory Cache representing current DB state
  private _users: User[] = [];
  private _products: Product[] = [];
  private _reviews: Review[] = [];
  private _addresses: Address[] = [];
  private _carts: Cart[] = [];
  private _wishlists: Wishlist[] = [];
  private _orders: Order[] = [];
  private _coupons: Coupon[] = [];
  private _boutiques: BoutiqueProfile[] = [];
  private _designers: DesignerProfile[] = [];
  private _customizations: CustomizationRequest[] = [];
  private _tailors: Tailor[] = [];
  private _portfolios: PortfolioItem[] = [];
  private _requirements: TailorRequirement[] = [];
  private _notifications: Notification[] = [];

  constructor() {
    // Loaded asynchronously on app startup inside app.ts
  }

  /**
   * Load entire SQL database tables into memory cache.
   */
  public async loadFromDatabase() {
    try {
      this._users = (await UserModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._products = (await ProductModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._reviews = (await ReviewModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._addresses = (await AddressModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._carts = (await CartModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._wishlists = (await WishlistModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._orders = (await OrderModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._coupons = (await CouponModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._boutiques = (await BoutiqueProfileModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._designers = (await DesignerModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._customizations = (await CustomizationModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._tailors = (await TailorModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._portfolios = (await PortfolioModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._requirements = (await RequirementModel.findAll()).map(m => m.get({ plain: true })) as any;
      this._notifications = (await NotificationModel.findAll()).map(m => m.get({ plain: true })) as any;
      console.log('All SQL tables loaded into memory cache successfully.');
    } catch (err) {
      console.error('Failed to load SQL tables into memory:', err);
    }
  }

  // --- Users ---
  getUsers(): User[] { return this._users; }
  saveUsers(users: User[]) { 
    this._users = users; 
    UserModel.destroy({ where: {} }).then(() => UserModel.bulkCreate(users as any)).catch(e => console.error('BG Save Users Error:', e));
  }

  // --- Products ---
  getProducts(): Product[] { return this._products; }
  saveProducts(products: Product[]) { 
    this._products = products; 
    ProductModel.destroy({ where: {} }).then(() => ProductModel.bulkCreate(products as any)).catch(e => console.error('BG Save Products Error:', e));
  }

  // --- Reviews ---
  getReviews(): Review[] { return this._reviews; }
  saveReviews(reviews: Review[]) { 
    this._reviews = reviews; 
    ReviewModel.destroy({ where: {} }).then(() => ReviewModel.bulkCreate(reviews as any)).catch(e => console.error('BG Save Reviews Error:', e));
  }

  // --- Addresses ---
  getAddresses(): Address[] { return this._addresses; }
  saveAddresses(addresses: Address[]) { 
    this._addresses = addresses; 
    AddressModel.destroy({ where: {} }).then(() => AddressModel.bulkCreate(addresses as any)).catch(e => console.error('BG Save Addresses Error:', e));
  }

  // --- Carts ---
  getCarts(): Cart[] { return this._carts; }
  saveCarts(carts: Cart[]) { 
    this._carts = carts; 
    CartModel.destroy({ where: {} }).then(() => CartModel.bulkCreate(carts as any)).catch(e => console.error('BG Save Carts Error:', e));
  }

  // --- Wishlists ---
  getWishlists(): Wishlist[] { return this._wishlists; }
  saveWishlists(wishlists: Wishlist[]) { 
    this._wishlists = wishlists; 
    WishlistModel.destroy({ where: {} }).then(() => WishlistModel.bulkCreate(wishlists as any)).catch(e => console.error('BG Save Wishlists Error:', e));
  }

  // --- Orders ---
  getOrders(): Order[] { return this._orders; }
  saveOrders(orders: Order[]) { 
    this._orders = orders; 
    OrderModel.destroy({ where: {} }).then(() => OrderModel.bulkCreate(orders as any)).catch(e => console.error('BG Save Orders Error:', e));
  }

  // --- Coupons ---
  getCoupons(): Coupon[] { return this._coupons; }
  saveCoupons(coupons: Coupon[]) { 
    this._coupons = coupons; 
    CouponModel.destroy({ where: {} }).then(() => CouponModel.bulkCreate(coupons as any)).catch(e => console.error('BG Save Coupons Error:', e));
  }

  // --- Boutiques ---
  getBoutiqueProfiles(): BoutiqueProfile[] { return this._boutiques; }
  saveBoutiqueProfiles(profiles: BoutiqueProfile[]) { 
    this._boutiques = profiles; 
    BoutiqueProfileModel.destroy({ where: {} }).then(() => BoutiqueProfileModel.bulkCreate(profiles as any)).catch(e => console.error('BG Save Boutiques Error:', e));
  }

  // --- Designers ---
  getDesignerProfiles(): DesignerProfile[] { return this._designers; }
  saveDesignerProfiles(profiles: DesignerProfile[]) { 
    this._designers = profiles; 
    DesignerModel.destroy({ where: {} }).then(() => DesignerModel.bulkCreate(profiles as any)).catch(e => console.error('BG Save Designers Error:', e));
  }

  // --- Customizations ---
  getCustomizationRequests(): CustomizationRequest[] { return this._customizations; }
  saveCustomizationRequests(requests: CustomizationRequest[]) { 
    this._customizations = requests; 
    CustomizationModel.destroy({ where: {} }).then(() => CustomizationModel.bulkCreate(requests as any)).catch(e => console.error('BG Save Customizations Error:', e));
  }

  // --- Tailors ---
  getTailors(): Tailor[] { return this._tailors; }
  saveTailors(tailors: Tailor[]) { 
    this._tailors = tailors; 
    TailorModel.destroy({ where: {} }).then(() => TailorModel.bulkCreate(tailors as any)).catch(e => console.error('BG Save Tailors Error:', e));
  }

  // --- Portfolios ---
  getPortfolios(): PortfolioItem[] { return this._portfolios; }
  savePortfolios(portfolios: PortfolioItem[]) { 
    this._portfolios = portfolios; 
    PortfolioModel.destroy({ where: {} }).then(() => PortfolioModel.bulkCreate(portfolios as any)).catch(e => console.error('BG Save Portfolios Error:', e));
  }

  // --- Requirements ---
  getTailorRequirements(): TailorRequirement[] { return this._requirements; }
  saveTailorRequirements(requirements: TailorRequirement[]) { 
    this._requirements = requirements; 
    RequirementModel.destroy({ where: {} }).then(() => RequirementModel.bulkCreate(requirements as any)).catch(e => console.error('BG Save Requirements Error:', e));
  }

  // --- Notifications ---
  getNotifications(): Notification[] { return this._notifications; }
  saveNotifications(notifications: Notification[]) { 
    this._notifications = notifications; 
    NotificationModel.destroy({ where: {} }).then(() => NotificationModel.bulkCreate(notifications as any)).catch(e => console.error('BG Save Notifications Error:', e));
  }
}

export const db = new DatabaseStore();
export default db;
