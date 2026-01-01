import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Package, MapPin, Calendar, User, CheckCircle, Truck, Store, Home, X, Plus, Clock } from 'lucide-react';
import { ProductStore } from '../utils/productStore';
import type { RegisteredProduct } from '../utils/productStore';

interface SupplyChainStage {
  id: string;
  stage: string;
  location: string;
  timestamp: string;
  handler: string;
  status: 'completed' | 'in-progress' | 'pending';
  icon: any;
  details: string;
}

interface NewProduct {
  productName: string;
  category: string;
  quantity: string;
  unit: string;
  farmLocation: string;
  farmerName: string;
  farmerPhone: string;
  description: string;
}

export const SupplyChain = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState('');
  const [showTracking, setShowTracking] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProduct>({
    productName: '',
    category: 'Grains',
    quantity: '',
    unit: 'kg',
    farmLocation: '',
    farmerName: '',
    farmerPhone: '',
    description: '',
  });
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [orderData, setOrderData] = useState<any>(null);

  // Load products from localStorage on mount
  useEffect(() => {
    setRegisteredProducts(ProductStore.getAllProducts());
    
    // Check URL parameter for tracking ID
    const trackParam = searchParams.get('track');
    if (trackParam) {
      setTrackingId(trackParam);
      handleTrackNow(trackParam);
    }
  }, [searchParams]);

  const getMockTrackingData = (productData?: RegisteredProduct): SupplyChainStage[] => {
    if (!productData) {
      // Return empty or minimal data if no product found
      return [];
    }

    const registrationDate = new Date(productData.registeredDate);
    const now = new Date();
    const daysSinceRegistration = Math.floor((now.getTime() - registrationDate.getTime()) / (24 * 60 * 60 * 1000));
    
    const farmerName = productData.farmerName;
    const location = productData.farmLocation;
    const productName = productData.productName;
    const quantity = `${productData.quantity} ${productData.unit}`;
    
    // Build stages based on how long ago the product was registered
    const stages: SupplyChainStage[] = [
      {
        id: '1',
        stage: 'Product Registration',
        location: location,
        timestamp: registrationDate.toLocaleString(),
        handler: `Farmer: ${farmerName}`,
        status: 'completed',
        icon: Home,
        details: `Product registered on blockchain: ${productName}, Quantity: ${quantity}`,
      }
    ];

    // If listed in marketplace, add that stage
    if (productData.isListedInMarketplace && productData.price) {
      stages.push({
        id: '2',
        stage: 'Listed in Marketplace',
        location: 'AgriChain Marketplace',
        timestamp: registrationDate.toLocaleString(),
        handler: `Farmer: ${farmerName}`,
        status: 'completed',
        icon: Package,
        details: `Listed for sale at ₹${productData.price}/${productData.unit}. Available for purchase.`,
      });
    }

    // Quality check (always completed after registration)
    stages.push({
      id: '3',
      stage: 'Quality Check',
      location: location,
      timestamp: new Date(registrationDate.getTime() + 24 * 60 * 60 * 1000).toLocaleString(),
      handler: `Quality Inspector`,
      status: daysSinceRegistration > 1 ? 'completed' : 'in-progress',
      icon: CheckCircle,
      details: 'Product quality verified. Meets organic certification standards.',
    });

    // Storage
    stages.push({
      id: '4',
      stage: 'Storage',
      location: `${location} - Cold Storage`,
      timestamp: daysSinceRegistration > 2 ? new Date(registrationDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Storage Manager`,
      status: daysSinceRegistration > 2 ? 'completed' : daysSinceRegistration > 1 ? 'in-progress' : 'pending',
      icon: Package,
      details: 'Product stored in temperature-controlled facility. Optimal conditions maintained.',
    });

    // Awaiting Order or Ready for Dispatch
    if (productData.isListedInMarketplace) {
      stages.push({
        id: '5',
        stage: 'Awaiting Order',
        location: 'AgriChain Marketplace',
        timestamp: daysSinceRegistration > 3 ? new Date(registrationDate.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
        handler: `Marketplace`,
        status: daysSinceRegistration > 3 ? 'in-progress' : 'pending',
        icon: Clock,
        details: 'Product available for consumers to order. Waiting for purchase.',
      });
    }

    // Transportation (only if order is placed - for now pending)
    stages.push({
      id: '6',
      stage: 'Transportation',
      location: 'In Transit',
      timestamp: 'Pending Order',
      handler: 'Logistics Partner',
      status: 'pending',
      icon: Truck,
      details: 'Will be dispatched once order is confirmed.',
    });

    // Delivery (pending)
    stages.push({
      id: '7',
      stage: 'Delivered',
      location: 'Customer Location',
      timestamp: 'Pending',
      handler: 'Delivery Agent',
      status: 'pending',
      icon: CheckCircle,
      details: 'Product will be delivered to customer address.',
    });
    
    return stages;
  };

  const getCurrentProductData = (): RegisteredProduct | undefined => {
    return registeredProducts.find(p => p.trackingId === trackingId);
  };

  const fetchOrderData = async (trackingId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch('http://localhost:8000/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const orders = await response.json();
        // Find order by tracking ID
        return orders.find((order: any) => order.tracking_id === trackingId);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    }
    return null;
  };

  const getOrderTrackingStages = (order: any): SupplyChainStage[] => {
    if (!order) return [];

    const orderDate = new Date(order.order_date);
    const stages: SupplyChainStage[] = [];

    // 1. Order Placed
    stages.push({
      id: '1',
      stage: 'Order Placed',
      location: 'AgriChain Marketplace',
      timestamp: orderDate.toLocaleString(),
      handler: `Consumer: ${order.consumer_name}`,
      status: 'completed',
      icon: CheckCircle,
      details: `Order placed for ₹${order.total_amount}. Payment method: ${order.payment_method}`,
    });

    // 2. Order Confirmed
    const confirmed = ['Confirmed', 'Packed', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.status);
    stages.push({
      id: '2',
      stage: 'Order Confirmed',
      location: order.items?.[0]?.farm_location || 'Farm',
      timestamp: confirmed ? new Date(orderDate.getTime() + 2 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Farmer`,
      status: confirmed ? 'completed' : order.status === 'Pending' ? 'in-progress' : 'pending',
      icon: CheckCircle,
      details: confirmed ? 'Farmer confirmed the order and is preparing it.' : 'Waiting for farmer confirmation...',
    });

    // 3. Packed
    const packed = ['Packed', 'In Transit', 'Out for Delivery', 'Delivered'].includes(order.status);
    stages.push({
      id: '3',
      stage: 'Packed',
      location: order.items?.[0]?.farm_location || 'Farm',
      timestamp: packed ? new Date(orderDate.getTime() + 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Farmer`,
      status: packed ? 'completed' : order.status === 'Confirmed' ? 'in-progress' : 'pending',
      icon: Package,
      details: packed ? 'Order packed and ready for pickup.' : 'Farmer is packing your order...',
    });

    // 4. In Transit
    const inTransit = ['In Transit', 'Out for Delivery', 'Delivered'].includes(order.status);
    stages.push({
      id: '4',
      stage: 'In Transit',
      location: 'On Route',
      timestamp: inTransit ? new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Logistics Partner`,
      status: inTransit ? 'completed' : order.status === 'Packed' ? 'in-progress' : 'pending',
      icon: Truck,
      details: inTransit ? `Package in transit. Tracking ID: ${order.tracking_id}` : 'Waiting for shipment...',
    });

    // 5. Out for Delivery
    const outForDelivery = ['Out for Delivery', 'Delivered'].includes(order.status);
    stages.push({
      id: '5',
      stage: 'Out for Delivery',
      location: 'Near You',
      timestamp: outForDelivery ? new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Delivery Agent`,
      status: outForDelivery ? 'completed' : order.status === 'In Transit' ? 'in-progress' : 'pending',
      icon: Truck,
      details: outForDelivery ? 'Package is out for delivery today!' : 'Delivery will be scheduled soon...',
    });

    // 6. Delivered
    const delivered = order.status === 'Delivered';
    stages.push({
      id: '6',
      stage: 'Delivered',
      location: order.shipping_address?.substring(0, 50) || 'Customer Address',
      timestamp: delivered ? new Date(orderDate.getTime() + 4 * 24 * 60 * 60 * 1000).toLocaleString() : 'Pending',
      handler: `Delivery Agent`,
      status: delivered ? 'completed' : order.status === 'Out for Delivery' ? 'in-progress' : 'pending',
      icon: CheckCircle,
      details: delivered ? 'Order delivered successfully!' : 'Delivery in progress...',
    });

    return stages;
  };

  const handleTrackNow = async (id: string = trackingId) => {
    if (!id.trim()) return;

    // Check if it's an order tracking ID (starts with TRK-)
    if (id.startsWith('TRK-')) {
      const order = await fetchOrderData(id);
      setOrderData(order);
      setShowTracking(true);
    } else {
      // It's a product tracking ID (AGR-)
      setOrderData(null);
      setShowTracking(true);
    }
  };

  const trackingData = orderData 
    ? getOrderTrackingStages(orderData)
    : getMockTrackingData(getCurrentProductData());

  const handleTrack = () => {
    handleTrackNow();
  };

  const generateSampleId = () => {
    setTrackingId('AGR-2025-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    setShowTracking(true);
  };

  const handleRegisterProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get current user info
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    
    // Generate tracking ID
    const newTrackingId = 'AGR-2025-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // Create product data object with user info
    const productData: RegisteredProduct = {
      id: newTrackingId, // Use tracking ID as product ID
      trackingId: newTrackingId,
      productName: newProduct.productName,
      category: newProduct.category,
      quantity: newProduct.quantity,
      unit: newProduct.unit,
      farmLocation: newProduct.farmLocation,
      farmerName: currentUser?.name || newProduct.farmerName,
      farmerEmail: currentUser?.email || '', // Save farmer email
      farmerPhone: newProduct.farmerPhone,
      description: newProduct.description,
      registeredDate: new Date().toISOString(),
      isListedInMarketplace: false,
    };
    
    // Save to store
    ProductStore.saveProduct(productData);
    
    // Update local state
    setRegisteredProducts(ProductStore.getAllProducts());
    
    // Trigger custom event to notify other components (like Marketplace)
    window.dispatchEvent(new CustomEvent('productRegistered', { detail: productData }));
    
    // Show success message
    alert(
      `${t('success')}!\n\n` +
      `${t('trackingId')}: ${newTrackingId}\n` +
      `${t('productName')}: ${newProduct.productName}\n` +
      `${t('farmerName')}: ${productData.farmerName}\n` +
      `${t('farmLocation')}: ${newProduct.farmLocation}\n` +
      `${t('quantity')}: ${newProduct.quantity} ${newProduct.unit}\n\n` +
      `Your product is now on the blockchain!\n` +
      `To sell it, go to Marketplace and list your product with a price.`
    );
    
    // Reset form and close modal
    setNewProduct({
      productName: '',
      category: 'Grains',
      quantity: '',
      unit: 'kg',
      farmLocation: '',
      farmerName: '',
      farmerPhone: '',
      description: '',
    });
    setShowRegisterModal(false);
    
    // Set the tracking ID and show tracking
    setTrackingId(newTrackingId);
    setShowTracking(true);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t('supplyChainTitle')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('supplyChainDesc')}
          </p>
        </div>

        {/* Tracking Input */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('trackCrop')}</h2>
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder="Enter Tracking ID (e.g., AGR-2025-ABC123)"
              className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:outline-none text-lg"
            />
            <button
              onClick={handleTrack}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Track Now
            </button>
            <button
              onClick={generateSampleId}
              className="px-6 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              Try Sample
            </button>
          </div>

          {/* Blockchain Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm text-gray-700">
                {t('blockchainVerifiedInfo')}
              </p>
            </div>
          </div>

          {/* Registered Products */}
          {registeredProducts.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-gray-800 mb-3">{t('yourRegisteredProducts')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {registeredProducts.map((product, index) => (
                  <button
                    key={index}
                    onClick={() => { setTrackingId(product.trackingId); setShowTracking(true); }}
                    className="px-4 py-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium text-left"
                  >
                    <div className="font-bold">{product.trackingId}</div>
                    <div className="text-xs mt-1">{product.productName} - {product.farmerName}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tracking Timeline */}
        {showTracking && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-800">{t('supplyChainJourney')}</h2>
              <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg font-semibold">
                ID: {trackingId}
              </div>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-8 top-0 bottom-0 w-1 bg-gray-200"></div>

              {trackingData.map((stage, index) => {
                const Icon = stage.icon;
                const isLast = index === trackingData.length - 1;

                return (
                  <div key={stage.id} className={`relative ${!isLast ? 'mb-8' : ''}`}>
                    {/* Icon Circle */}
                    <div className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center z-10 ${
                      stage.status === 'completed' 
                        ? 'bg-green-500' 
                        : stage.status === 'in-progress' 
                        ? 'bg-blue-500 animate-pulse' 
                        : 'bg-gray-300'
                    }`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>

                    {/* Content Card */}
                    <div className="ml-24 p-6 bg-gray-50 rounded-xl hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{stage.stage}</h3>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {stage.location}
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {stage.timestamp}
                            </span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          stage.status === 'completed' 
                            ? 'bg-green-100 text-green-700' 
                            : stage.status === 'in-progress' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {stage.status.toUpperCase().replace('-', ' ')}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-700 mb-3">
                        <User className="w-4 h-4 mr-2" />
                        {stage.handler}
                      </div>
                      <p className="text-gray-600">{stage.details}</p>
                      
                      {/* Blockchain Hash (Mock) */}
                      <div className="mt-4 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Blockchain Hash:</p>
                        <code className="text-xs text-gray-700 font-mono break-all">
                          0x{Math.random().toString(16).substr(2, 64)}
                        </code>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: '🔒',
              title: 'Immutable Records',
              description: 'Once recorded, data cannot be altered or deleted',
            },
            {
              icon: '👁️',
              title: 'Full Transparency',
              description: 'Complete visibility from farm to consumer',
            },
            {
              icon: '⚡',
              title: 'Real-time Updates',
              description: 'Track your crop journey in real-time',
            },
            {
              icon: '✅',
              title: 'Quality Assurance',
              description: 'Verify authenticity and quality at every stage',
            },
            {
              icon: '📱',
              title: 'QR Code Scanning',
              description: 'Consumers can scan to see complete history',
            },
            {
              icon: '🌍',
              title: 'Build Trust',
              description: 'Prove organic/quality claims with verifiable data',
            },
          ].map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Add Product CTA */}
        <div className="mt-12 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl shadow-xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Tracking Your Crops</h2>
          <p className="text-xl mb-6 text-green-50">
            Register your produce and build trust with transparent supply chain tracking
          </p>
          <button 
            onClick={() => setShowRegisterModal(true)}
            className="px-8 py-4 bg-white text-green-600 rounded-xl font-semibold text-lg hover:bg-green-50 transform hover:scale-105 transition-all duration-200 inline-flex items-center space-x-2"
          >
            <Plus className="w-6 h-6" />
            <span>Register New Product</span>
          </button>
        </div>
      </div>

      {/* Register Product Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={() => setShowRegisterModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2">Register New Product</h3>
            <p className="text-gray-600 mb-6">Add your product to the blockchain supply chain</p>
            
            <form onSubmit={handleRegisterProduct} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('productName')} *</label>
                  <input
                    type="text"
                    value={newProduct.productName}
                    onChange={(e) => setNewProduct({...newProduct, productName: e.target.value})}
                    required
                    placeholder="e.g., Organic Basmati Rice"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('category')} *</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="Grains">{t('grains')}</option>
                    <option value="Vegetables">{t('vegetables')}</option>
                    <option value="Fruits">{t('fruits')}</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Spices">{t('spices')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('quantity')} *</label>
                  <input
                    type="number"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    required
                    min="1"
                    placeholder="100"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                  <select
                    value={newProduct.unit}
                    onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="ton">Tons</option>
                    <option value="liter">Liters</option>
                    <option value="dozen">Dozen</option>
                    <option value="pieces">Pieces</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('farmLocation')} *</label>
                <input
                  type="text"
                  value={newProduct.farmLocation}
                  onChange={(e) => setNewProduct({...newProduct, farmLocation: e.target.value})}
                  required
                  placeholder="Village, District, State"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('farmerName')} *</label>
                  <input
                    type="text"
                    value={newProduct.farmerName}
                    onChange={(e) => setNewProduct({...newProduct, farmerName: e.target.value})}
                    required
                    placeholder="Your full name"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('farmerPhone')} *</label>
                  <input
                    type="tel"
                    value={newProduct.farmerPhone}
                    onChange={(e) => setNewProduct({...newProduct, farmerPhone: e.target.value})}
                    required
                    placeholder="+91 9876543210"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('description')}</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  placeholder="Additional details about your product (organic, quality grade, etc.)"
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                />
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Note:</strong> After registration, you'll receive a unique tracking ID that will be used throughout the supply chain. This ID will be stored on the blockchain and cannot be modified.
                </p>
              </div>
              
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                >
                  Register Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
