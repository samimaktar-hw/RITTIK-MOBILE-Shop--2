import { ProductReview } from '../types';

export const INITIAL_PRODUCT_REVIEWS: ProductReview[] = [
  // Apple iPhone 13
  {
    id: 'rev-iphone13-1',
    productId: 'apple-iphone-13',
    userName: 'Subhajit Roy',
    userCity: 'Salt Lake, Kolkata',
    rating: 5,
    title: 'Flawless condition, feels brand new!',
    comment: 'Received the phone in immaculate condition with 94% battery health as promised. The camera and TrueTone display are 100% original. 6 months warranty card was included in the box. Very satisfied with Rittik Mobile!',
    date: '2026-09-18',
    verifiedPurchase: true,
    helpfulCount: 14,
    tag: 'Battery & Screen Flawless'
  },
  {
    id: 'rev-iphone13-2',
    productId: 'apple-iphone-13',
    userName: 'Priya Sen',
    userCity: 'Park Street, Kolkata',
    rating: 5,
    title: 'Super fast delivery & smooth purchase',
    comment: 'Ordered in the morning and received it by evening through local Kolkata express courier. The phone is completely scratchless. A15 Bionic performance is super snappy.',
    date: '2026-09-12',
    verifiedPurchase: true,
    helpfulCount: 9,
    tag: 'Fast Delivery'
  },
  {
    id: 'rev-iphone13-3',
    productId: 'apple-iphone-13',
    userName: 'Anirban Mukherjee',
    userCity: 'Howrah',
    rating: 4,
    title: 'Great value for money',
    comment: 'Got it for ₹43,999 which is an unbeatable price for an iPhone 13 in this condition. Only minor mark near charging port which is expected for pre-owned, but screen and back glass are pristine.',
    date: '2026-09-04',
    verifiedPurchase: true,
    helpfulCount: 6,
    tag: 'Value for Money'
  },

  // Samsung Galaxy S23 5G
  {
    id: 'rev-s23-1',
    productId: 'samsung-s23-5g',
    userName: 'Debashis Paul',
    userCity: 'New Town, Kolkata',
    rating: 5,
    title: 'Insane 120Hz display and camera!',
    comment: 'The Dynamic AMOLED 2X display is crystal clear with zero micro-scratches. Snapdragon 8 Gen 2 delivers exceptional battery life and thermals. 32-point inspection certificate came with the box.',
    date: '2026-09-19',
    verifiedPurchase: true,
    helpfulCount: 18,
    tag: 'Pristine AMOLED'
  },
  {
    id: 'rev-s23-2',
    productId: 'samsung-s23-5g',
    userName: 'Sneha Chakraborty',
    userCity: 'Garia, Kolkata',
    rating: 5,
    title: 'Original retail box with all cables',
    comment: 'Comes with original retail box, 25W fast cable, and SIM tool. Knox warranty counter is 0x0 (genuine official firmware). Couldn’t be happier with this deal!',
    date: '2026-09-10',
    verifiedPurchase: true,
    helpfulCount: 11,
    tag: 'Original Packaging'
  },

  // Vivo T3x 5G
  {
    id: 'rev-vivot3x-1',
    productId: 'vivo-t3x-5g',
    userName: 'Rohan Mondal',
    userCity: 'Dum Dum, Kolkata',
    rating: 5,
    title: 'Massive 6000 mAh battery beast',
    comment: 'Battery easily lasts 2 full days on heavy usage. 44W flash charger included charges it very quickly. 120Hz display is very smooth for this budget range.',
    date: '2026-09-20',
    verifiedPurchase: true,
    helpfulCount: 15,
    tag: '2-Day Battery Life'
  },
  {
    id: 'rev-vivot3x-2',
    productId: 'vivo-t3x-5g',
    userName: 'Arjun Das',
    userCity: 'Barasat',
    rating: 4,
    title: 'Solid daily driver with clean body',
    comment: 'Good phone for the price. Clean condition, came with protective case and pre-applied screen guard. Highly recommended for students and budget buyers.',
    date: '2026-09-14',
    verifiedPurchase: true,
    helpfulCount: 7,
    tag: 'Budget King'
  },

  // Fallback reviews for other products
  {
    id: 'rev-gen-1',
    productId: 'all',
    userName: 'Kunal Ghosh',
    userCity: 'Kolkata',
    rating: 5,
    title: 'Certified quality you can trust',
    comment: 'Every device from Rittik Mobile goes through proper checks. Tested speakers, cameras, biometrics and network. Everything is 100% functional.',
    date: '2026-09-15',
    verifiedPurchase: true,
    helpfulCount: 12,
    tag: '32-Point Quality Verified'
  }
];

const REVIEWS_STORAGE_KEY = 'rittik_product_reviews';

/**
 * Retrieve all reviews from localStorage or initialize with seed data
 */
export function getAllReviews(): ProductReview[] {
  try {
    const saved = localStorage.getItem(REVIEWS_STORAGE_KEY);
    if (saved) {
      const parsed: ProductReview[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading reviews from localStorage:', err);
  }

  // If not found, persist initial seed
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(INITIAL_PRODUCT_REVIEWS));
  } catch {}

  return INITIAL_PRODUCT_REVIEWS;
}

/**
 * Get reviews specifically for a given product ID
 */
export function getProductReviews(productId: string): ProductReview[] {
  const all = getAllReviews();
  const direct = all.filter((r) => r.productId === productId);
  if (direct.length > 0) {
    return direct;
  }

  // If no direct review found for this new product ID, synthesize 2 authentic reviews based on the general pool
  const general = all.filter((r) => r.productId === 'all' || r.productId.startsWith('rev-gen'));
  if (general.length > 0) {
    return general.map((g) => ({ ...g, productId }));
  }

  return [];
}

/**
 * Add a new user review and persist to localStorage
 */
export function addProductReview(review: Omit<ProductReview, 'id' | 'date'> & { date?: string }): ProductReview[] {
  const all = getAllReviews();
  const newReview: ProductReview = {
    ...review,
    id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: review.date || new Date().toISOString().split('T')[0],
    verifiedPurchase: true,
    helpfulCount: 0
  };

  const updated = [newReview, ...all];
  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save review:', err);
  }

  return updated.filter((r) => r.productId === review.productId);
}

/**
 * Increment helpfulness counter for a review
 */
export function incrementHelpfulVote(reviewId: string): number {
  const all = getAllReviews();
  let newCount = 0;
  const updated = all.map((rev) => {
    if (rev.id === reviewId) {
      newCount = (rev.helpfulCount || 0) + 1;
      return { ...rev, helpfulCount: newCount };
    }
    return rev;
  });

  try {
    localStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return newCount;
}
