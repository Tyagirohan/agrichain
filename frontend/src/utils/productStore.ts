/**
 * Shared Product Store
 * Manages products across Supply Chain and Marketplace
 */

export interface RegisteredProduct {
  id?: string; // Product ID (same as trackingId)
  trackingId: string;
  productName: string;
  category: string;
  quantity: string;
  unit: string;
  farmLocation: string;
  farmerName: string;
  farmerEmail?: string; // Farmer's email for filtering
  farmerPhone: string;
  description: string;
  registeredDate: string;
  price?: number;
  imageUrl?: string;
  isListedInMarketplace?: boolean;
}

const STORAGE_KEY = 'agrichain_registered_products';

export class ProductStore {
  static saveProduct(product: RegisteredProduct): void {
    const products = this.getAllProducts();
    products.push(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  }

  static getAllProducts(): RegisteredProduct[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getProductByTrackingId(trackingId: string): RegisteredProduct | undefined {
    const products = this.getAllProducts();
    return products.find(p => p.trackingId === trackingId);
  }

  static updateProduct(trackingId: string, updates: Partial<RegisteredProduct>): void {
    const products = this.getAllProducts();
    const index = products.findIndex(p => p.trackingId === trackingId);
    if (index !== -1) {
      products[index] = { ...products[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }

  static getMarketplaceProducts(): RegisteredProduct[] {
    const products = this.getAllProducts();
    return products.filter(p => p.isListedInMarketplace && p.price);
  }

  static listInMarketplace(trackingId: string, price: number): void {
    this.updateProduct(trackingId, {
      price,
      isListedInMarketplace: true,
    });
  }

  static deleteProduct(trackingId: string): void {
    const products = this.getAllProducts();
    const filtered = products.filter(p => p.trackingId !== trackingId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
}

export default ProductStore;
