export type AppView = 
  | 'home' 
  | 'details' 
  | 'cart' 
  | 'checkout' 
  | 'order-success' 
  | 'sell' 
  | 'profile'
  | 'admin';

export type ProductCategory = 'all' | 'mobile' | 'watch' | 'accessory';

export type LanguageCode = 'en' | 'bn' | 'hi';
export type Language = LanguageCode;

export interface ProductVariant {
  id: string;
  ram: string;
  rom: string;
  storage: string;
  price: number;
  mrp: number;
  outOfStock?: boolean;
  processor?: string;
  camera?: string;
  display?: string;
  battery?: string;
  network?: string;
  condition?: string;
  quality?: string;
}

export interface CustomSpec {
  name: string;
  value: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: 'mobile' | 'watch' | 'accessory';
  price: number;
  mrp: number;
  rating: number;
  reviewsCount: number;
  createdAt: number;
  outOfStock?: boolean;
  stockQuantity?: number;
  conditionType?: 'new' | 'used';
  condition: string;
  quality: string;
  bodyCondition: string;
  displayCondition: string;
  batteryCondition: string;
  accessories: string;
  boxAvailable: string;
  warranty: string;
  processor: string;
  camera: string;
  display: string;
  battery: string;
  network?: string;
  images: string[];
  description?: string;
  highlights: {
    ram: string;
    rom: string;
  };
  variants?: ProductVariant[];
  customSpecs?: CustomSpec[];
}

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  variantText?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  quantity: number;
  variantName?: string;
}

export type OrderStatus = 
  | 'Order Placed'
  | 'Confirmed & Processing'
  | '32-Point Quality Inspection'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled';

export interface OrderTrackingEvent {
  status: string;
  timestamp: string;
  note?: string;
}

export interface OrderRecord {
  id: string;
  userId?: string;
  customerName: string;
  customerPhone: string;
  mobile?: string;
  customerEmail?: string;
  items: OrderItem[];
  productName: string;
  productPrice: number;
  productImage: string;
  selectedVariant?: string;
  deliveryType: 'home' | 'store';
  address: string;
  houseArea?: string;
  city?: string;
  state?: string;
  pincode?: string;
  paymentMethod: 'cod' | 'upi' | 'store';
  status: OrderStatus;
  date: string;
  time?: string;
  createdAt?: string | number;
  cancelledAt?: string;
  expectedDelivery?: string;
  trackingNumber?: string;
  trackingEvents?: OrderTrackingEvent[];
  latitude?: number;
  longitude?: number;
  location?: {
    lat: number;
    lng: number;
    accuracy?: number;
  };
}

export interface CustomerProfile {
  uid: string;
  name: string;
  mobile: string;
  email: string;
  createdDate: string;
  accountStatus: 'active' | 'suspended';
}

export interface PendingAuthAction {
  type: 'add_to_cart' | 'buy_now';
  product: Product;
  variant?: ProductVariant;
  quantity?: number;
}

export interface SellerMessage {
  id: string;
  sender: 'admin' | 'seller';
  text: string;
  createdAt: string | number;
}

export interface SellRequest {
  id: string;
  sellerName?: string;
  sellerMobile?: string;
  sellerEmail?: string;
  deviceName?: string;
  name: string;
  brand?: string;
  model?: string;
  deviceType?: string;
  ram?: string;
  storage?: string;
  ramRom?: string;
  price: number;
  expectedPrice?: number;
  condition?: string;
  conditionType?: 'new' | 'used';
  description?: string;
  contact: string;
  email?: string;
  address: string;
  handoverType?: 'pickup' | 'store';
  images: string[];
  status: string;
  date?: string;
  createdAt?: number | string;
  userId?: string;
  messages?: SellerMessage[];
}

export interface StoreSettings {
  logoUrl?: string;
  shopName?: string;
  shopDescription?: string;
  homeTitle?: string;
  homeSubtitle?: string;
  announcement?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  address?: string;
  openingHours?: string;
  closingHours?: string;
  workingDays?: string;
  latitude?: number | string;
  longitude?: number | string;
  googleMapsUrl?: string;
  deliverySettings?: string;
  services?: string;
  socialFacebook?: string;
  socialInstagram?: string;
  socialYoutube?: string;
  updatedAt?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  userName: string;
  userCity?: string;
  rating: number; // 1 to 5
  title?: string;
  comment: string;
  date: string;
  verifiedPurchase?: boolean;
  helpfulCount?: number;
  tag?: string;
}
