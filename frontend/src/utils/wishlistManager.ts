// Wishlist Management Utility
interface WishlistItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  unit: string;
  farmer: string;
  location: string;
  addedAt: string;
}

const WISHLIST_KEY = 'agrichain_wishlist';

export class WishlistManager {
  static getWishlist(): WishlistItem[] {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading wishlist:', error);
      return [];
    }
  }

  static addToWishlist(item: Omit<WishlistItem, 'addedAt'>): boolean {
    try {
      const wishlist = this.getWishlist();
      
      // Check if already in wishlist
      if (wishlist.some(w => w.productId === item.productId)) {
        return false; // Already exists
      }
      
      const newItem: WishlistItem = {
        ...item,
        addedAt: new Date().toISOString()
      };
      
      wishlist.push(newItem);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      return false;
    }
  }

  static removeFromWishlist(productId: string): boolean {
    try {
      const wishlist = this.getWishlist();
      const filtered = wishlist.filter(item => item.productId !== productId);
      
      if (filtered.length === wishlist.length) {
        return false; // Item not found
      }
      
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
      
      // Dispatch custom event for real-time updates
      window.dispatchEvent(new CustomEvent('wishlistUpdated'));
      
      return true;
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      return false;
    }
  }

  static isInWishlist(productId: string): boolean {
    const wishlist = this.getWishlist();
    return wishlist.some(item => item.productId === productId);
  }

  static getWishlistCount(): number {
    return this.getWishlist().length;
  }

  static clearWishlist(): void {
    localStorage.removeItem(WISHLIST_KEY);
    window.dispatchEvent(new CustomEvent('wishlistUpdated'));
  }
}

