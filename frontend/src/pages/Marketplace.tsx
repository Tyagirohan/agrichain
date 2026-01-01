import { useState, useEffect } from 'react';
import { ShoppingCart, Search, Filter, TrendingUp, Star, MapPin, Phone, MessageCircle, X, Plus, Check, Package, Heart } from 'lucide-react';
import { ProductStore, type RegisteredProduct } from '../utils/productStore';
import { WishlistManager } from '../utils/wishlistManager';
import { processPayment } from '../utils/razorpayConfig';
import { useTranslation } from 'react-i18next';
import { getApiEndpoint } from '../config/api';

interface Product {
  id: string;
  name: string;
  farmer: string;
  location: string;
  price: number;
  unit: string;
  quantity: string;
  rating: number;
  reviews: number;
  organic: boolean;
  image: string;
  category: string;
  description: string;
  phone: string;
  farmerEmail?: string; // Added for order tracking
  farmerReputation?: {
    average_rating: number;
    total_ratings: number;
    badge: string;
    reputation_score: number;
  };
  // NEW: Promotional fields
  discount?: number; // Percentage discount (e.g., 10 for 10%)
  originalPrice?: number; // Price before discount
  isOnSale?: boolean;
  promoLabel?: string; // e.g., "FLASH SALE", "NEW", "TRENDING"
  // NEW: Product type markers
  isRealProduct?: boolean; // True for products from registered farmers
  isDemoProduct?: boolean; // True for mock/demo products
}

interface SellerForm {
  farmerName: string;
  phone: string;
  location: string;
  productName: string;
  category: string;
  price: string;
  unit: string;
  quantity: string;
  description: string;
  organic: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const Marketplace = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [minRating, setMinRating] = useState(0);
  
  // NEW: Advanced Filter States
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // NEW: Wishlist States
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [showWishlistModal, setShowWishlistModal] = useState(false);
  
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showListProductModal, setShowListProductModal] = useState(false);
  const [showAddToCartModal, setShowAddToCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedProductForCart, setSelectedProductForCart] = useState<Product | null>(null);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [selectedProductToList, setSelectedProductToList] = useState<RegisteredProduct | null>(null);
  const [listingPrice, setListingPrice] = useState('');
  const [productImage, setProductImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [sellerForm, setSellerForm] = useState<SellerForm>({
    farmerName: '',
    phone: '',
    location: '',
    productName: '',
    category: 'Grains',
    price: '',
    unit: 'kg',
    quantity: '',
    description: '',
    organic: false,
  });

  // Load registered products on mount and when storage changes
  useEffect(() => {
    loadRegisteredProducts();
    
    // Load wishlist
    const loadWishlist = () => {
      setWishlist(WishlistManager.getWishlist().map(item => item.productId));
    };
    loadWishlist();
    
    // Listen for storage changes (when products are registered in Supply Chain)
    const handleStorageChange = () => {
      loadRegisteredProducts();
    };
    
    // Listen for custom product registration event
    const handleProductRegistered = () => {
      loadRegisteredProducts();
    };
    
    // Listen for wishlist updates
    const handleWishlistUpdate = () => {
      loadWishlist();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);
    window.addEventListener('productRegistered', handleProductRegistered as EventListener);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate as EventListener);
    
    // Set up an interval to check for new products every 2 seconds
    const interval = setInterval(handleStorageChange, 2000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
      window.removeEventListener('productRegistered', handleProductRegistered as EventListener);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate as EventListener);
      clearInterval(interval);
    };
  }, []);

  const loadRegisteredProducts = async () => {
    const allProducts = ProductStore.getAllProducts();
    const unlistedProducts = allProducts.filter(p => !p.isListedInMarketplace);
    setRegisteredProducts(unlistedProducts);
    
    // Merge registered marketplace products with existing mock products
    const listedProducts = ProductStore.getMarketplaceProducts();
    const mappedProducts: Product[] = await Promise.all(listedProducts.map(async (p) => {
      // Fetch farmer reputation if farmer email is available
      let reputation = undefined;
      if (p.farmerEmail) {
        try {
          const response = await fetch(getApiEndpoint(`/farmers/${p.farmerEmail}/reputation`));
          if (response.ok) {
            reputation = await response.json();
          }
        } catch (error) {
          console.error('Failed to fetch farmer reputation:', error);
        }
      }
      
      return {
        id: p.trackingId,
        name: p.productName,
        farmer: p.farmerName,
        location: p.farmLocation,
        price: p.price || 0,
        unit: p.unit,
        quantity: p.quantity,
        rating: reputation?.average_rating || 0, // Show 0 if no ratings yet
        reviews: reputation?.total_ratings || 0,
        organic: false,
        image: p.imageUrl || getCategoryImage(p.category), // Use uploaded image or default
        category: p.category,
        description: p.description || '',
        phone: p.farmerPhone,
        farmerEmail: p.farmerEmail, // Map farmer email for orders
        farmerReputation: reputation, // Store reputation data
        isRealProduct: true, // Mark as real product with dynamic ratings
      };
    }));
    
    // Mark mock products as demo
    const demoProducts = mockProducts.map(p => ({ ...p, isDemoProduct: true }));
    
    setProducts([...mappedProducts, ...demoProducts]);
  };

  const getCategoryImage = (category: string): string => {
    const images: Record<string, string> = {
      'Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'Vegetables': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400',
      'Pulses': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400',
      'Spices': 'https://images.unsplash.com/photo-1596040033229-a0b13f78105d?w=400',
      'Dairy': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400',
    };
    return images[category] || images['Grains'];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProductImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleListProduct = () => {
    if (!selectedProductToList || !listingPrice || parseFloat(listingPrice) <= 0) {
      alert('Please enter a valid price');
      return;
    }

    // Update product with price and image
    ProductStore.updateProduct(selectedProductToList.trackingId, {
      price: parseFloat(listingPrice),
      isListedInMarketplace: true,
      imageUrl: productImage || undefined,
    });
    
    alert(
      `${t('success')}!\n\n` +
      `Your product "${selectedProductToList.productName}" is now listed in the marketplace!\n` +
      `Price: ₹${listingPrice}/${selectedProductToList.unit}\n\n` +
      `Buyers can now purchase directly from you.`
    );

    // Reset and reload
    setShowListProductModal(false);
    setSelectedProductToList(null);
    setListingPrice('');
    setProductImage('');
    setImagePreview('');
    loadRegisteredProducts();
  };

  const mockProducts: Product[] = [
    {
      id: '1',
      name: 'Premium Basmati Rice',
      farmer: 'Rajan Singh',
      location: 'Punjab',
      price: 85,
      unit: 'kg',
      quantity: '500 kg available',
      rating: 4.8,
      reviews: 124,
      organic: true,
      image: '🌾',
      category: 'Grains',
      description: 'Aged premium basmati rice, organic certified. Long grain variety with excellent aroma.',
      phone: '+91 98765 43210',
    },
    {
      id: '2',
      name: 'Fresh Tomatoes',
      farmer: 'Lakshmi Devi',
      location: 'Maharashtra',
      price: 40,
      unit: 'kg',
      quantity: '200 kg available',
      rating: 4.6,
      reviews: 89,
      organic: true,
      image: '🍅',
      category: 'Vegetables',
      description: 'Farm-fresh tomatoes, harvested today. Juicy and rich in flavor, perfect for cooking.',
      phone: '+91 98765 43211',
    },
    {
      id: '3',
      name: 'Alphonso Mangoes',
      farmer: 'Suresh Patil',
      location: 'Ratnagiri, Maharashtra',
      price: 250,
      unit: 'dozen',
      quantity: '100 dozens available',
      rating: 5.0,
      reviews: 256,
      organic: true,
      image: '🥭',
      category: 'Fruits',
      description: 'Authentic Ratnagiri Alphonso mangoes. King of mangoes, certified GI tag product.',
      phone: '+91 98765 43212',
    },
    {
      id: '4',
      name: 'Fresh Dairy Milk',
      farmer: 'Ramesh Dairy Farm',
      location: 'Gujarat',
      price: 65,
      unit: 'liter',
      quantity: '500 liters daily',
      rating: 4.9,
      reviews: 312,
      organic: false,
      image: '🥛',
      category: 'Dairy',
      description: 'Pure cow milk, tested for quality daily. Rich in calcium and protein.',
      phone: '+91 98765 43213',
    },
    {
      id: '5',
      name: 'Organic Turmeric Powder',
      farmer: 'Kavita Sharma',
      location: 'Andhra Pradesh',
      price: 180,
      unit: 'kg',
      quantity: '150 kg available',
      rating: 4.7,
      reviews: 98,
      organic: true,
      image: '🌿',
      category: 'Spices',
      description: 'Pure organic turmeric powder. High curcumin content, no additives or preservatives.',
      phone: '+91 98765 43214',
    },
    {
      id: '6',
      name: 'Fresh Green Chillies',
      farmer: 'Arjun Reddy',
      location: 'Telangana',
      price: 55,
      unit: 'kg',
      quantity: '300 kg available',
      rating: 4.5,
      reviews: 67,
      organic: true,
      image: '🌶️',
      category: 'Vegetables',
      description: 'Hot and spicy green chillies. Freshly harvested, perfect for Indian cooking.',
      phone: '+91 98765 43215',
    },
    {
      id: '7',
      name: 'Kashmiri Apples',
      farmer: 'Abdul Rashid',
      location: 'Kashmir',
      price: 120,
      unit: 'kg',
      quantity: '800 kg available',
      rating: 4.8,
      reviews: 189,
      organic: false,
      image: '🍎',
      category: 'Fruits',
      description: 'Premium Kashmiri apples. Crisp, sweet, and juicy. Harvested at peak ripeness.',
      phone: '+91 98765 43216',
    },
    {
      id: '8',
      name: 'Organic Wheat Flour',
      farmer: 'Vijay Kumar',
      location: 'Haryana',
      price: 45,
      unit: 'kg',
      quantity: '1000 kg available',
      rating: 4.6,
      reviews: 145,
      organic: true,
      image: '🌾',
      category: 'Grains',
      description: 'Stone-ground whole wheat flour. No chemicals or preservatives. Perfect for rotis.',
      phone: '+91 98765 43217',
    },
  ];

  const [products, setProducts] = useState<Product[]>(mockProducts);

  const categories = ['all', 'Grains', 'Vegetables', 'Fruits', 'Dairy', 'Spices'];
  
  // Extract unique locations from products
  const locations = ['all', ...Array.from(new Set(products.map(p => p.location)))];

  // Enhanced filtering logic
  const filteredProducts = products.filter(product => {
    // Search in name, farmer name, and description
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.farmer.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesRating = product.rating >= minRating;
    
    // NEW: Location filter
    const matchesLocation = selectedLocation === 'all' || product.location === selectedLocation;
    
    // NEW: Organic filter
    const matchesOrganic = !organicOnly || product.organic;
    
    // NEW: Price range filter
    const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesRating && matchesLocation && matchesOrganic && matchesPrice;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const addToCart = (product: Product) => {
    // Show confirmation modal instead of adding directly
    setSelectedProductForCart(product);
    setCartQuantity(1);
    setShowAddToCartModal(true);
  };

  const confirmAddToCart = () => {
    if (!selectedProductForCart) return;
    
    const existingItem = cart.find(item => item.product.id === selectedProductForCart.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product.id === selectedProductForCart.id 
          ? { ...item, quantity: item.quantity + cartQuantity }
          : item
      ));
    } else {
      setCart([...cart, { product: selectedProductForCart, quantity: cartQuantity }]);
    }
    
    // Close modal and reset
    setShowAddToCartModal(false);
    setSelectedProductForCart(null);
    setCartQuantity(1);
    
    // Show success message
    alert(`${t('addedToCart')}! ${cartQuantity} ${selectedProductForCart.unit} ${t('of')} ${selectedProductForCart.name}`);
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, quantity }
        : item
    ));
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const handleCall = (phone: string, name: string) => {
    if (confirm(`Call ${name} at ${phone}?`)) {
      window.open(`tel:${phone}`, '_blank');
    }
  };

  const handleChat = (phone: string, name: string, productName: string) => {
    const message = encodeURIComponent(`Hi ${name}, I'm interested in your ${productName}. Is it still available?`);
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${message}`, '_blank');
  };

  const toggleWishlist = (product: Product) => {
    if (WishlistManager.isInWishlist(product.id)) {
      WishlistManager.removeFromWishlist(product.id);
      alert(`${product.name} removed from wishlist! ❤️`);
    } else {
      const added = WishlistManager.addToWishlist({
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        price: product.price,
        unit: product.unit,
        farmer: product.farmer,
        location: product.location
      });
      if (added) {
        alert(`${product.name} added to wishlist! ❤️`);
      }
    }
  };

  const handleSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newProduct: Product = {
      id: (products.length + 1).toString(),
      name: sellerForm.productName,
      farmer: sellerForm.farmerName,
      location: sellerForm.location,
      price: parseFloat(sellerForm.price),
      unit: sellerForm.unit,
      quantity: `${sellerForm.quantity} ${sellerForm.unit} available`,
      rating: 0,
      reviews: 0,
      organic: sellerForm.organic,
      image: ['🌾', '🍅', '🥭', '🥛', '🌿'][Math.floor(Math.random() * 5)],
      category: sellerForm.category,
      description: sellerForm.description,
      phone: sellerForm.phone,
    };
    
    setProducts([newProduct, ...products]);
    
    alert(
      `Product Listed Successfully!\n\n` +
      `${sellerForm.productName} is now live on the marketplace!\n` +
      `Buyers can now see and purchase your product.`
    );
    
    // Reset form
    setSellerForm({
      farmerName: '',
      phone: '',
      location: '',
      productName: '',
      category: 'Grains',
      price: '',
      unit: 'kg',
      quantity: '',
      description: '',
      organic: false,
    });
    setShowSellerModal(false);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert(t('cartEmpty'));
      return;
    }
    
    // Check if user is logged in
    const user = localStorage.getItem('user');
    if (!user) {
      alert(t('pleaseLoginToPurchase'));
      return;
    }
    
    // Show checkout form modal
    setShowCartModal(false);
    setShowCheckoutModal(true);
  };

  const confirmCheckout = async () => {
    if (!shippingAddress.trim()) {
      alert(t('pleaseEnterAddress'));
      return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    if (!token) {
      alert(t('pleaseLoginToPurchase'));
      return;
    }

    try {
      // Prepare order data
      const orderData = {
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: parseFloat(item.quantity.toString()), // Ensure it's a float
          unit: item.product.unit,
          price_per_unit: parseFloat(item.product.price.toString()), // Ensure it's a float
          image_url: item.product.image.startsWith('data:') || item.product.image.startsWith('http') 
            ? item.product.image 
            : undefined,
          farmer_email: item.product.farmerEmail || item.product.phone, // Use farmer email if available, fallback to phone
          farm_location: item.product.location
        })),
        total_amount: parseFloat(getTotalPrice().toString()), // Ensure it's a float
        shipping_address: shippingAddress,
        payment_method: paymentMethod
      };

      console.log('[Checkout] Sending order data:', orderData);

      // Send order to backend
      const response = await fetch(getApiEndpoint('/orders/create'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // If payment method is Online, initiate Razorpay payment
        if (paymentMethod === 'Online') {
          console.log('[Payment] Initiating online payment...');
          
          const paymentResult = await processPayment(
            result.order.total_amount,
            result.order.order_id,
            {
              name: user.name || 'Customer',
              email: user.email || '',
              contact: user.phone || '9999999999'
            }
          );

          if (paymentResult.success) {
            alert(
              `${t('paymentSuccessful')}!\n\n` +
              `${t('orderId')}: ${result.order.order_id}\n` +
              `${t('paymentId')}: ${paymentResult.paymentId}\n` +
              `${t('total')}: ₹${result.order.total_amount}\n\n` +
              `${t('orderConfirmed')}`
            );
          } else {
            alert(t('paymentFailed') + '\n' + t('orderCreatedButPaymentPending'));
          }
        } else {
          // COD order
          alert(
            `${t('orderPlacedSuccess')}!\n\n` +
            `${t('orderId')}: ${result.order.order_id}\n` +
            `${t('total')}: ₹${result.order.total_amount}\n` +
            `${t('paymentMethod')}: ${t('cashOnDelivery')}\n\n` +
            `${t('checkDashboard')}`
          );
        }
        
        // Notify farmer dashboard of new order
        window.dispatchEvent(new CustomEvent('orderReceived', { detail: result }));
        
        // Clear cart and close modals
        setCart([]);
        setShowCheckoutModal(false);
        setShippingAddress('');
        setPaymentMethod('COD');
        
      } else {
        // Handle error response
        const errorData = await response.json();
        console.error('Order creation error:', errorData);
        
        // Format error message
        let errorMessage = t('orderFailed') + ': ';
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            // Validation errors from Pydantic
            errorMessage += errorData.detail.map((err: any) => 
              `${err.loc?.join(' → ') || 'Field'}: ${err.msg || err}`
            ).join('\n');
          } else if (typeof errorData.detail === 'string') {
            errorMessage += errorData.detail;
          } else {
            errorMessage += JSON.stringify(errorData.detail);
          }
        } else {
          errorMessage += 'Unknown error';
        }
        
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert(t('orderFailed') + ': ' + (error as Error).message);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Farmer Marketplace
          </h1>
          <p className="text-xl text-gray-600">
            Buy directly from farmers • Zero middlemen • Fair prices for all
          </p>
        </div>

        {/* Benefits Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: '🚫', title: 'No Middlemen', desc: 'Direct farmer to consumer' },
            { icon: '💰', title: 'Fair Pricing', desc: 'Better prices for farmers & consumers' },
            { icon: '✅', title: 'Quality Assured', desc: 'Blockchain verified products' },
          ].map((benefit, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-4xl mb-3">{benefit.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{benefit.title}</h3>
              <p className="text-gray-600 text-sm">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          {/* Main Filter Row */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, farmers, or descriptions..."
                className="w-full pl-12 pr-4 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none cursor-pointer"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none cursor-pointer"
            >
              <option value="featured">{t('featured')}</option>
              <option value="price-low">{t('priceLowToHigh')}</option>
              <option value="price-high">{t('priceHighToLow')}</option>
              <option value="rating">{t('highestRated')}</option>
            </select>
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-6 py-4 border-2 rounded-xl font-semibold transition-colors flex items-center space-x-2 ${
                showAdvancedFilters 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-blue-600 border-blue-600 hover:bg-blue-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </button>
            <button
              onClick={() => setShowWishlistModal(true)}
              className="relative px-6 py-4 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors flex items-center space-x-2"
            >
              <Heart className="w-5 h-5" />
              <span>Wishlist</span>
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setShowCartModal(true)}
              className="relative px-6 py-4 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Cart</span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          </div>

          {/* Advanced Filters (Collapsible) */}
          {showAdvancedFilters && (
            <div className="border-t-2 border-gray-200 pt-4 mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Location Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Location</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none cursor-pointer"
                  >
                    {locations.map(location => (
                      <option key={location} value={location}>
                        {location === 'all' ? 'All Locations' : location}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">⭐ Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none cursor-pointer"
                  >
                    <option value={0}>All Ratings</option>
                    <option value={4}>4+ Stars</option>
                    <option value={4.5}>4.5+ Stars</option>
                    <option value={4.8}>4.8+ Stars</option>
                  </select>
                </div>

                {/* Organic Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">🌱 Certification</label>
                  <div className="flex items-center h-12 px-4 border-2 border-gray-300 rounded-xl bg-gray-50">
                    <input
                      type="checkbox"
                      id="organic"
                      checked={organicOnly}
                      onChange={(e) => setOrganicOnly(e.target.checked)}
                      className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                    />
                    <label htmlFor="organic" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                      Organic Only
                    </label>
                  </div>
                </div>
              </div>

              {/* Price Range Slider */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  💰 Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    min="0"
                    max={priceRange[1]}
                    className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="range"
                    min="0"
                    max="1000"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                  />
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    min={priceRange[0]}
                    max="1000"
                    className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setSelectedLocation('all');
                    setMinRating(0);
                    setOrganicOnly(false);
                    setPriceRange([0, 1000]);
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 mt-4">
            <span className="font-semibold text-gray-800">{sortedProducts.length} {t('productsFound')}</span>
            {minRating > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                {minRating}+ ⭐
              </span>
            )}
            {selectedLocation !== 'all' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                📍 {selectedLocation}
              </span>
            )}
            {organicOnly && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                🌱 Organic
              </span>
            )}
            {(priceRange[0] > 0 || priceRange[1] < 1000) && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                ₹{priceRange[0]}-₹{priceRange[1]}
              </span>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {sortedProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group transform hover:-translate-y-1">
              {/* Product Image */}
              <div className="relative h-48 bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center overflow-hidden">
                {product.image.startsWith('data:') || product.image.startsWith('http') ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.parentElement!.innerHTML += `<span class="text-8xl">${product.category === 'Grains' ? '🌾' : product.category === 'Vegetables' ? '🥬' : product.category === 'Fruits' ? '🍎' : product.category === 'Dairy' ? '🥛' : product.category === 'Spices' ? '🌿' : '📦'}</span>`;
                    }}
                  />
                ) : (
                  <span className="text-8xl">{product.image}</span>
                )}
                
                {/* Wishlist Heart Button */}
                <button
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition-all duration-200 transform hover:scale-110 z-10"
                >
                  <Heart 
                    className={`w-5 h-5 ${
                      wishlist.includes(product.id) 
                        ? 'fill-red-500 text-red-500' 
                        : 'text-gray-400'
                    }`}
                  />
                </button>
                
                {/* Discount Badge */}
                {product.discount && product.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-red-500 to-orange-500 text-white px-3 py-2 rounded-lg text-sm font-bold shadow-lg z-10">
                    {product.discount}% OFF
                  </div>
                )}
                
                {product.organic && !product.discount && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    {t('organic')}
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-semibold text-gray-700">
                  {product.category}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-green-600 transition-colors">
                  {product.name}
                </h3>
                
                {/* Farmer Reputation Badge */}
                {product.farmerReputation && product.farmerReputation.badge !== "New Seller" && (
                  <div className="mb-2">
                    <span className="inline-block bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full border border-yellow-300">
                      {product.farmerReputation.badge}
                    </span>
                  </div>
                )}
                
                {/* Demo Product Badge */}
                {product.isDemoProduct && (
                  <div className="mb-2">
                    <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full border border-blue-300">
                      📋 DEMO PRODUCT
                    </span>
                  </div>
                )}

                {/* Rating Display - Enhanced */}
                {product.rating > 0 ? (
                  <div className="flex items-center mb-3 bg-yellow-50 p-2 rounded-lg border border-yellow-200">
                    <div className="flex items-center text-yellow-600 mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= product.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-bold text-gray-800">{product.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-xs text-gray-600">
                      ({product.reviews} {t('reviews')})
                    </span>
                  </div>
                ) : product.isRealProduct ? (
                  <div className="flex items-center mb-3 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    <div className="flex items-center text-gray-400 mr-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="w-4 h-4 text-gray-300" />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500 italic">
                      {t('noRatingsYet')}
                    </span>
                  </div>
                ) : null}

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="border-t border-gray-200 pt-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{product.location}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{product.farmer}</span>
                    {product.farmerReputation && product.farmerReputation.badge && (
                      <span className="ml-2 text-xs text-green-600 font-semibold">
                        {product.farmerReputation.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-green-600 font-semibold">
                    {product.quantity}
                  </div>
                </div>

                <div className="flex items-end justify-between mb-4">
                  <div>
                    {/* Show discount pricing if available */}
                    {product.discount && product.discount > 0 ? (
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-3xl font-bold text-green-600">₹{product.price}</span>
                          <span className="text-lg text-gray-400 line-through">₹{product.originalPrice || product.price}</span>
                        </div>
                        <span className="text-xs text-green-600 font-semibold">
                          Save {product.discount}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-gray-800">₹{product.price}</span>
                    )}
                    <span className="text-gray-500 ml-1">/{product.unit}</span>
                  </div>
                  {/* Promo Label Badge */}
                  {product.promoLabel && (
                    <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                      {product.promoLabel}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <button 
                    onClick={() => addToCart(product)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{t('addToCart')}</span>
                  </button>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleCall(product.phone, product.farmer)}
                      className="flex-1 border-2 border-green-600 text-green-600 py-2 rounded-xl font-semibold hover:bg-green-50 transition-colors flex items-center justify-center space-x-1 text-sm"
                    >
                      <Phone className="w-4 h-4" />
                      <span>{t('call')}</span>
                    </button>
                    <button 
                      onClick={() => handleChat(product.phone, product.farmer, product.name)}
                      className="flex-1 border-2 border-blue-600 text-blue-600 py-2 rounded-xl font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-1 text-sm"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>{t('chat')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Become a Seller CTA */}
        <div className="mt-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-2xl shadow-xl p-12 text-center text-white">
          <TrendingUp className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Are You a Farmer?</h2>
          <p className="text-xl mb-6 text-orange-50">
            Start selling your products directly to consumers. No middlemen, better profits!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => setShowListProductModal(true)}
              className="px-10 py-4 bg-white text-orange-600 rounded-xl font-semibold text-lg hover:bg-orange-50 transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
            >
              <Package className="w-6 h-6" />
              <span>List Registered Product</span>
            </button>
            <button 
              onClick={() => setShowSellerModal(true)}
              className="px-10 py-4 bg-orange-700 text-white rounded-xl font-semibold text-lg hover:bg-orange-800 transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
            >
              <Plus className="w-6 h-6" />
              <span>Start Selling Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seller Registration Modal */}
      {showSellerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={() => setShowSellerModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Start Selling on AgriChain</h3>
            <p className="text-gray-600 mb-6">List your products and reach thousands of buyers</p>
            
            <form onSubmit={handleSellerSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Your Name *</label>
                  <input
                    type="text"
                    value={sellerForm.farmerName}
                    onChange={(e) => setSellerForm({...sellerForm, farmerName: e.target.value})}
                    required
                    placeholder="Full name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={sellerForm.phone}
                    onChange={(e) => setSellerForm({...sellerForm, phone: e.target.value})}
                    required
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location *</label>
                <input
                  type="text"
                  value={sellerForm.location}
                  onChange={(e) => setSellerForm({...sellerForm, location: e.target.value})}
                  required
                  placeholder="Village, District, State"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Product Name *</label>
                  <input
                    type="text"
                    value={sellerForm.productName}
                    onChange={(e) => setSellerForm({...sellerForm, productName: e.target.value})}
                    required
                    placeholder="e.g., Organic Tomatoes"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                  <select
                    value={sellerForm.category}
                    onChange={(e) => setSellerForm({...sellerForm, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="Grains">Grains</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices">Spices</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Price *</label>
                  <input
                    type="number"
                    value={sellerForm.price}
                    onChange={(e) => setSellerForm({...sellerForm, price: e.target.value})}
                    required
                    min="1"
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                  <select
                    value={sellerForm.unit}
                    onChange={(e) => setSellerForm({...sellerForm, unit: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="liter">liter</option>
                    <option value="dozen">dozen</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    value={sellerForm.quantity}
                    onChange={(e) => setSellerForm({...sellerForm, quantity: e.target.value})}
                    required
                    min="1"
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
                <textarea
                  value={sellerForm.description}
                  onChange={(e) => setSellerForm({...sellerForm, description: e.target.value})}
                  required
                  placeholder="Describe your product quality, farming method, etc."
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="organic"
                  checked={sellerForm.organic}
                  onChange={(e) => setSellerForm({...sellerForm, organic: e.target.checked})}
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="organic" className="text-gray-700 font-medium">
                  This is an organic/certified product
                </label>
              </div>
              
              <div className="p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> Your product will be visible to all buyers immediately. Make sure to provide accurate information and keep your phone accessible for buyer inquiries.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowSellerModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-200"
                >
                  List Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowCartModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-green-600" />
              {t('yourCart') || 'Your Cart'}
            </h3>
            <p className="text-gray-600 mb-6">{cart.length} {t('itemsInCart') || 'items in cart'}</p>
            
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">{t('cartEmpty') || 'Your cart is empty'}</p>
                <p className="text-gray-500">{t('addProductsToCart') || 'Add some products to get started!'}</p>
              </div>
            ) : (
              <>
                <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl hover:shadow-md transition-shadow">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {item.product.image.startsWith('data:') || item.product.image.startsWith('http') ? (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                parent.innerHTML = `<div class="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center text-4xl">${item.product.image.startsWith('data:') ? '📦' : item.product.image}</div>`;
                              }
                            }}
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center text-5xl border-2 border-white shadow">
                            {item.product.image}
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-lg text-gray-800 mb-1">{item.product.name}</h4>
                        <div className="flex items-center space-x-2 mb-2">
                          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-sm text-gray-600">{item.product.farmer}</p>
                        </div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <p className="text-sm text-gray-600">{item.product.location}</p>
                        </div>
                        <p className="text-green-600 font-semibold">₹{item.product.price}/{item.product.unit}</p>
                        {item.product.organic && (
                          <span className="inline-block mt-1 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                            {t('organic') || 'ORGANIC'}
                          </span>
                        )}
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end space-y-3">
                        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm p-1">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-red-500 hover:text-white transition-all flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="w-12 text-center font-bold text-gray-800">{item.quantity} {item.product.unit}</span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="w-8 h-8 bg-gray-100 rounded-lg hover:bg-green-500 hover:text-white transition-all flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                        
                        {/* Item Total */}
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{t('subtotal') || 'Subtotal'}</p>
                          <p className="text-xl font-bold text-gray-800">₹{item.product.price * item.quantity}</p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-red-500 text-sm hover:text-red-700 hover:underline font-semibold transition-colors flex items-center space-x-1"
                        >
                          <X className="w-4 h-4" />
                          <span>{t('remove') || 'Remove'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Cart Summary */}
                <div className="border-t-2 border-gray-200 pt-6 bg-gradient-to-r from-gray-50 to-gray-100 -mx-8 px-8 -mb-8 pb-8 rounded-b-2xl">
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600">
                      <span>{t('subtotal') || 'Subtotal'}</span>
                      <span className="font-semibold">₹{getTotalPrice()}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>{t('delivery') || 'Delivery'}</span>
                      <span className="font-semibold text-green-600">{t('free') || 'FREE'}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mb-6 py-4 border-t border-gray-300">
                    <span className="text-2xl font-bold text-gray-800">{t('total') || 'Total'}:</span>
                    <span className="text-4xl font-bold text-green-600">₹{getTotalPrice()}</span>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <Check className="w-6 h-6" />
                    <span>{t('proceedToCheckout') || 'Proceed to Checkout'}</span>
                  </button>
                  
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="w-full mt-3 bg-white text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                  >
                    {t('continueShopping') || 'Continue Shopping'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* List Registered Product Modal */}
      {showListProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={() => {
                setShowListProductModal(false);
                setSelectedProductToList(null);
                setListingPrice('');
                setProductImage('');
                setImagePreview('');
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2">List Your Registered Product</h3>
            <p className="text-gray-600 mb-6">Select a product from your Supply Chain and set a price</p>
            
            {registeredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">
                  You don't have any registered products yet.
                </p>
                <p className="text-gray-600 text-sm">
                  Go to <strong>Supply Chain</strong> page and register your products first!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Product *</label>
                  <select
                    value={selectedProductToList?.trackingId || ''}
                    onChange={(e) => {
                      const product = registeredProducts.find(p => p.trackingId === e.target.value);
                      setSelectedProductToList(product || null);
                      // Reset price and image when selecting new product
                      setListingPrice('');
                      setProductImage('');
                      setImagePreview('');
                    }}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                  >
                    <option value="">-- Select a product --</option>
                    {registeredProducts.map((product) => (
                      <option key={product.trackingId} value={product.trackingId}>
                        {product.productName} - {product.quantity} {product.unit} ({product.trackingId})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProductToList && (
                  <>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-2">Product Details:</h4>
                      <p><strong>Name:</strong> {selectedProductToList.productName}</p>
                      <p><strong>Category:</strong> {selectedProductToList.category}</p>
                      <p><strong>Quantity:</strong> {selectedProductToList.quantity} {selectedProductToList.unit}</p>
                      <p><strong>Farmer:</strong> {selectedProductToList.farmerName}</p>
                      <p><strong>Location:</strong> {selectedProductToList.farmLocation}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price per {selectedProductToList.unit} (₹) *
                      </label>
                      <input
                        type="number"
                        value={listingPrice}
                        onChange={(e) => setListingPrice(e.target.value)}
                        required
                        min="1"
                        step="0.01"
                        placeholder="e.g., 85.00"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('productImage')} ({t('description')})
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{t('imageOptional')}</p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                      />
                      {imagePreview && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">{t('imagePreview')}:</p>
                          <img 
                            src={imagePreview} 
                            alt="Product preview" 
                            className="w-full max-w-xs h-48 object-cover rounded-lg border-2 border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProductImage('');
                              setImagePreview('');
                            }}
                            className="mt-2 text-sm text-red-600 hover:text-red-700"
                          >
                            {t('removeImage')}
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleListProduct}
                      className="w-full py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                      <Check className="w-5 h-5" />
                      <span>List Product in Marketplace</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Wishlist Modal */}
      {showWishlistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowWishlistModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <Heart className="w-8 h-8 mr-3 text-pink-600 fill-pink-600" />
              My Wishlist
            </h3>
            <p className="text-gray-600 mb-6">{wishlist.length} items saved</p>
            
            {wishlist.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">Your wishlist is empty</p>
                <p className="text-gray-500 mb-6">Save your favorite products to buy them later!</p>
                <button
                  onClick={() => setShowWishlistModal(false)}
                  className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {WishlistManager.getWishlist().map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
                      {/* Product Image */}
                      <div className="w-24 h-24 flex-shrink-0 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {item.productImage.startsWith('data:') || item.productImage.startsWith('http') ? (
                          <img 
                            src={item.productImage} 
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-4xl">{item.productImage}</span>
                        )}
                      </div>
                      
                      {/* Product Info */}
                      <div className="flex-1">
                        <h4 className="font-bold text-lg text-gray-800 mb-1">{item.productName}</h4>
                        <p className="text-sm text-gray-600 mb-1">
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {item.farmer} • {item.location}
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          ₹{item.price} <span className="text-sm text-gray-500">/{item.unit}</span>
                        </p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        {product && (
                          <button
                            onClick={() => {
                              addToCart(product);
                              setShowWishlistModal(false);
                            }}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center space-x-2"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Cart</span>
                          </button>
                        )}
                        <button
                          onClick={() => WishlistManager.removeFromWishlist(item.productId)}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg font-semibold hover:bg-red-200 transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
                
                {/* Actions */}
                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      if (confirm('Clear all wishlist items?')) {
                        WishlistManager.clearWishlist();
                      }
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Clear Wishlist
                  </button>
                  <button
                    onClick={() => setShowWishlistModal(false)}
                    className="flex-1 px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Confirmation Modal */}
      {showAddToCartModal && selectedProductForCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => {
                setShowAddToCartModal(false);
                setSelectedProductForCart(null);
                setCartQuantity(1);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {t('addToCart')}?
            </h2>

            {/* Product Details */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-4">
                {selectedProductForCart.image.startsWith('data:') || selectedProductForCart.image.startsWith('http') ? (
                  <img
                    src={selectedProductForCart.image}
                    alt={selectedProductForCart.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-5xl">{selectedProductForCart.image}</div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-800">{selectedProductForCart.name}</h3>
                  <p className="text-sm text-gray-600">{selectedProductForCart.farmer}</p>
                  <p className="text-green-600 font-semibold text-xl mt-1">
                    ₹{selectedProductForCart.price}/{selectedProductForCart.unit}
                  </p>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 text-center">
                {t('selectQuantity')}
              </label>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCartQuantity(Math.max(1, cartQuantity - 1))}
                  className="w-12 h-12 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors font-bold text-xl flex items-center justify-center"
                >
                  −
                </button>
                <div className="text-center">
                  <span className="text-3xl font-bold text-gray-800">{cartQuantity}</span>
                  <p className="text-sm text-gray-600">{selectedProductForCart.unit}</p>
                </div>
                <button
                  onClick={() => setCartQuantity(cartQuantity + 1)}
                  className="w-12 h-12 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors font-bold text-xl flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">{t('total')}:</span>
                <span className="text-2xl font-bold text-green-600">
                  ₹{(selectedProductForCart.price * cartQuantity).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowAddToCartModal(false);
                  setSelectedProductForCart(null);
                  setCartQuantity(1);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                {t('cancel')}
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t('confirm')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowCheckoutModal(false);
                setShippingAddress('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              {t('checkout')} 🛒
            </h2>

            {/* Order Summary */}
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg text-gray-800 mb-4">{t('orderSummary')}</h3>
              <div className="space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-3">
                      {item.product.image.startsWith('data:') || item.product.image.startsWith('http') ? (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <span className="text-2xl">{item.product.image}</span>
                      )}
                      <div>
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.product.unit} × ₹{item.product.price}
                        </p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">
                      ₹{item.quantity * item.product.price}
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-300">
                <div className="flex justify-between text-xl font-bold">
                  <span>{t('total')}:</span>
                  <span className="text-green-600">₹{getTotalPrice()}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-2">
                {t('shippingAddress')} <span className="text-red-500">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
                placeholder={t('enterFullAddress')}
                required
              />
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-gray-700 font-bold mb-3">
                {t('selectPaymentMethod')}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">💵</span>
                    <p className="font-semibold">{t('cashOnDelivery')}</p>
                    <p className="text-xs text-gray-600 mt-1">{t('payWhenReceived')}</p>
                  </div>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('Online')}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    paymentMethod === 'Online'
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-300 hover:border-green-400'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-3xl mb-2 block">💳</span>
                    <p className="font-semibold">{t('payOnline')}</p>
                    <p className="text-xs text-gray-600 mt-1">{t('cards')} • {t('upi')} • {t('wallets')}</p>
                  </div>
                </button>
              </div>
              
              {/* Razorpay Badge */}
              {paymentMethod === 'Online' && (
                <div className="mt-3 text-center">
                  <p className="text-sm text-gray-600">{t('securePayment')}</p>
                  <div className="flex items-center justify-center space-x-2 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">💳 {t('cards')}</span>
                    <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full">📱 {t('upi')}</span>
                    <span className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full">💰 {t('wallets')}</span>
                    <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full">🏦 {t('netBanking')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>📝 {t('note')}:</strong> {t('orderWillBeShared')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCheckoutModal(false);
                  setShowCartModal(true);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                ← {t('backToCart')}
              </button>
              <button
                onClick={confirmCheckout}
                className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors font-semibold flex items-center justify-center space-x-2"
              >
                <Check className="w-5 h-5" />
                <span>{t('placeOrder')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
