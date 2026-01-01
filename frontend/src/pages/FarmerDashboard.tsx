import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getApiEndpoint } from '../config/api';
import { 
  Package, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Trash2,
  Clock,
  Truck,
  MapPin,
  ShoppingCart
} from 'lucide-react';
import { ProductStore } from '../utils/productStore';
import { FarmerAnalytics } from '../components/Analytics';

interface Order {
  order_id: string;
  consumer_email: string;
  consumer_name: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    image_url?: string;
  }>;
  total_amount: number;
  shipping_address: string;
  payment_method: string;
  order_date: string;
  status: string;
  tracking_id?: string;
  rating?: number;
  review?: string;
}

export const FarmerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchases, setPurchases] = useState<Order[]>([]); // Orders placed as buyer
  const [analytics, setAnalytics] = useState<any>(null); // Analytics data
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadFarmerData(userData);

    // Listen for product registration events
    const handleProductRegistered = () => {
      console.log('[Dashboard] Product registered event received, reloading data');
      loadFarmerData(userData);
    };

    // Listen for order received events
    const handleOrderReceived = () => {
      console.log('[Dashboard] Order received event, reloading data');
      loadFarmerData(userData);
    };

    // Listen for storage changes (when products are registered/updated)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'agrichain_registered_products') {
        console.log('[Dashboard] Product store updated, reloading data');
        loadFarmerData(userData);
      }
    };

    window.addEventListener('productRegistered', handleProductRegistered as EventListener);
    window.addEventListener('orderReceived', handleOrderReceived as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('productRegistered', handleProductRegistered as EventListener);
      window.removeEventListener('orderReceived', handleOrderReceived as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const loadFarmerData = async (userData: any) => {
    setLoading(true);
    try {
      // Load products from ProductStore
      const allProducts = ProductStore.getAllProducts();
      const myProducts = allProducts.filter(p => 
        p.farmerEmail === userData.email ||
        p.farmerName?.toLowerCase() === userData.name?.toLowerCase()
      );
      setProducts(myProducts);
      
      console.log('Farmer Dashboard - All Products:', allProducts);
      console.log('Farmer Dashboard - My Products:', myProducts);
      console.log('Farmer Dashboard - User Email:', userData.email);

      // Load orders from backend
      const token = localStorage.getItem('token');
      if (token) {
        // Fetch orders RECEIVED (as seller)
        const receivedResponse = await fetch(getApiEndpoint('/orders/received'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (receivedResponse.ok) {
          const ordersData = await receivedResponse.json();
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          } else {
            console.error('Orders data is not an array:', ordersData);
            setOrders([]);
          }
        } else {
          console.error('Failed to fetch orders:', receivedResponse.status);
          setOrders([]);
        }

        // Fetch orders PLACED (as buyer)
        const purchasesResponse = await fetch(getApiEndpoint('/orders/my-orders'), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (purchasesResponse.ok) {
          const purchasesData = await purchasesResponse.json();
          if (Array.isArray(purchasesData)) {
            setPurchases(purchasesData);
          } else {
            console.error('Purchases data is not an array:', purchasesData);
            setPurchases([]);
          }
        } else {
          console.error('Failed to fetch purchases:', purchasesResponse.status);
          setPurchases([]);
        }
      } else {
        console.log('No token found, skipping order fetch');
        setOrders([]);
        setPurchases([]);
      }

      // Fetch analytics data
      const analyticsResponse = await fetch(getApiEndpoint(`/analytics/farmer/${userData.email}`));
      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData);
      } else {
        console.error('Failed to fetch analytics:', analyticsResponse.status);
        setAnalytics(null);
      }
    } catch (error) {
      console.error('Error loading farmer data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(getApiEndpoint(`/orders/${orderId}/update-status?new_status=${newStatus}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(orders.map(o => o.order_id === orderId ? updatedOrder : o));
        alert(t('orderStatusUpdated'));
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert(t('errorUpdatingOrder'));
    }
  };

  const deleteProduct = (productId: string) => {
    if (confirm(t('confirmDeleteProduct'))) {
      // Use trackingId to delete since that's what the store uses
      const product = products.find(p => p.id === productId || p.trackingId === productId);
      if (product) {
        ProductStore.deleteProduct(product.trackingId);
        setProducts(products.filter(p => p.id !== productId && p.trackingId !== productId));
        alert(t('productDeleted'));
      }
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('pleaseLogin'));
      return;
    }

    try {
      const response = await fetch(getApiEndpoint('/auth/delete-account'), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert(t('accountDeletedSuccess'));
        // Clear all local data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to home
        navigate('/');
      } else {
        const error = await response.json();
        alert(`${t('accountDeleteFailed')}: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert(t('accountDeleteFailed') + ': ' + (error as Error).message);
    }
  };

  // Calculate stats
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalEarnings = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-700';
      case 'Confirmed': return 'bg-blue-100 text-blue-700';
      case 'Packed': return 'bg-purple-100 text-purple-700';
      case 'In Transit': return 'bg-indigo-100 text-indigo-700';
      case 'Out for Delivery': return 'bg-orange-100 text-orange-700';
      case 'Delivered': return 'bg-green-100 text-green-700';
      case 'Cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-gray-600">{t('loading')}...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              {t('welcome')}, {user?.name}! 👨‍🌾
            </h1>
            <p className="text-xl text-gray-600">{t('farmerDashboardDesc')}</p>
          </div>
          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('deleteAccount')}</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-10 h-10" />
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{totalProducts}</h3>
            <p className="text-green-100">{t('totalProducts')}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-10 h-10" />
              <Clock className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{totalOrders}</h3>
            <p className="text-blue-100">{t('totalOrders')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10" />
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">₹{totalEarnings}</h3>
            <p className="text-purple-100">{t('totalEarnings')}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Truck className="w-10 h-10" />
              <Clock className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{pendingOrders}</h3>
            <p className="text-orange-100">{t('pendingOrders')}</p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && <FarmerAnalytics data={analytics} />}

        {/* My Products Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <Package className="w-6 h-6 mr-3 text-green-600" />
              {t('myProducts')}
            </h2>
            <button
              onClick={() => navigate('/supply-chain')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              + {t('addNewProduct')}
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t('noProductsYet')}</p>
              <button
                onClick={() => navigate('/supply-chain')}
                className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('registerFirstProduct')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <div key={product.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.productName}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg mb-4 flex items-center justify-center">
                      <Package className="w-16 h-16 text-green-600" />
                    </div>
                  )}
                  <h3 className="font-bold text-lg text-gray-800 mb-2">{product.productName}</h3>
                  <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                  <p className="text-green-600 font-semibold mb-4">
                    ₹{product.price}/{product.unit}
                  </p>
                  {product.isListedInMarketplace && (
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full mb-3">
                      {t('listedInMarketplace')}
                    </span>
                  )}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => navigate(`/supply-chain?track=${product.id}`)}
                      className="flex-1 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      {t('view')}
                    </button>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="flex-1 px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders Received Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
            {t('ordersReceived')}
          </h2>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t('noOrdersYet')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.order_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {t('order')} #{order.order_id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {t('from')}: {order.consumer_name || order.consumer_email}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{t('items')}:</h4>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{item.product_name} x {item.quantity}{item.unit}</span>
                        <span className="font-semibold">₹{item.price_per_unit * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                      <span>{t('total')}:</span>
                      <span className="text-green-600">₹{order.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  </div>

                  {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                    <div className="flex space-x-2">
                      {order.status === 'Pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'Confirmed')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          {t('confirmOrder')}
                        </button>
                      )}
                      {order.status === 'Confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'Packed')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          {t('markAsPacked')}
                        </button>
                      )}
                      {order.status === 'Packed' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'In Transit')}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          {t('markAsInTransit')}
                        </button>
                      )}
                      {order.status === 'In Transit' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'Out for Delivery')}
                          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          {t('outForDelivery')}
                        </button>
                      )}
                      {order.status === 'Out for Delivery' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'Delivered')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          {t('markAsDelivered')}
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderModal(true);
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        {t('viewDetails')}
                      </button>
                    </div>
                  )}

                  {order.rating && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 font-semibold mr-2">
                          {'⭐'.repeat(order.rating)}
                        </span>
                        <span className="text-sm text-gray-600">({order.rating}/5)</span>
                      </div>
                      {order.review && (
                        <p className="text-sm text-gray-700 italic">"{order.review}"</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Purchases Section (Orders placed as buyer) */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <ShoppingCart className="w-6 h-6 mr-3 text-green-600" />
            {t('myPurchases')} 
            <span className="ml-2 text-sm text-gray-500 font-normal">({t('purchasesAsABuyer')})</span>
          </h2>

          {purchases.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>{t('noOrdersYet')}</p>
              <p className="text-sm mt-2">Buy products from other farmers in the Marketplace</p>
            </div>
          ) : (
            <div className="space-y-4">
              {purchases.map(purchase => (
                <div key={purchase.order_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800">
                        {t('order')} #{purchase.order_id.slice(0, 8)}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Seller: {(purchase as any).farmer_email || purchase.items?.[0]?.product_name || 'Farmer'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(purchase.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(purchase.status)}`}>
                      {purchase.status}
                    </span>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-2">{t('items')}:</h4>
                    {purchase.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm mb-1">
                        <span>{item.product_name} x {item.quantity}{item.unit}</span>
                        <span className="font-semibold">₹{item.price_per_unit * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-300 mt-2 pt-2 flex justify-between font-bold">
                      <span>{t('total')}:</span>
                      <span className="text-green-600">₹{purchase.total_amount}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-600">{purchase.shipping_address}</p>
                  </div>

                  {purchase.tracking_id && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/supply-chain?track=${purchase.tracking_id}`)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {t('trackOrder')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t('orderDetails')} #{selectedOrder.order_id.slice(0, 8)}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('customer')}:</h3>
                <p>{selectedOrder.consumer_name || selectedOrder.consumer_email}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('items')}:</h3>
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex items-center space-x-4 mb-3 p-3 bg-gray-50 rounded-lg">
                    {item.image_url && (
                      <img src={item.image_url} alt={item.product_name} className="w-16 h-16 object-cover rounded" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-sm text-gray-600">{item.quantity} {item.unit} × ₹{item.price_per_unit}</p>
                    </div>
                    <p className="font-bold">₹{item.quantity * item.price_per_unit}</p>
                  </div>
                ))}
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('shippingAddress')}:</h3>
                <p>{selectedOrder.shipping_address}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('paymentMethod')}:</h3>
                <p>{selectedOrder.payment_method}</p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>{t('total')}:</span>
                  <span className="text-green-600">₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative shadow-2xl">
            <button
              onClick={() => setShowDeleteAccountModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-8 w-8 text-red-600" />
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {t('deleteAccount')}?
              </h2>

              <p className="text-gray-600 mb-6">
                {t('deleteAccountWarning')}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-800 font-semibold mb-2">
                  {t('whatWillBeDeleted')}:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• {t('yourAccount')}</li>
                  <li>• {t('allProducts')} ({products.length} {t('products')})</li>
                  <li>• {t('orderHistory')} ({orders.length} {t('orders')})</li>
                  <li>• {t('personalData')}</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteAccountModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    handleDeleteAccount();
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>{t('deleteForever')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

