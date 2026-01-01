import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Eye, 
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Truck,
  RefreshCw,
  Trash2,
  BarChart3  // Added for Analytics
} from 'lucide-react';
import { ConsumerAnalytics } from '../components/Analytics';

interface Order {
  order_id: string;
  farmer_email: string;
  items: Array<{
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    price_per_unit: number;
    image_url?: string;
    farmer_email: string;
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

export const ConsumerDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [analytics, setAnalytics] = useState<any>(null); // Analytics data
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const userData = JSON.parse(storedUser);
    setUser(userData);
    loadConsumerData();
  }, [navigate]);

  const loadConsumerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('http://localhost:8000/orders/my-orders', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          const ordersData = await response.json();
          // Ensure ordersData is an array
          if (Array.isArray(ordersData)) {
            setOrders(ordersData);
          } else {
            console.error('Orders data is not an array:', ordersData);
            setOrders([]);
          }
        } else {
          console.error('Failed to fetch orders:', response.status);
          setOrders([]);
        }
      } else {
        console.log('No token found, skipping order fetch');
        setOrders([]);
      }

      // Fetch analytics data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.email) {
        const analyticsResponse = await fetch(`http://localhost:8000/analytics/consumer/${userData.email}`);
        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        } else {
          console.error('Failed to fetch analytics:', analyticsResponse.status);
          setAnalytics(null);
        }
      }
    } catch (error) {
      console.error('Error loading consumer data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (!selectedOrder || rating === 0) {
      alert(t('pleaseSelectRating'));
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/orders/${selectedOrder.order_id}/rate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rating, review })
      });

      if (response.ok) {
        const updatedOrder = await response.json();
        setOrders(orders.map(o => o.order_id === selectedOrder.order_id ? updatedOrder : o));
        setShowRatingModal(false);
        setRating(0);
        setReview('');
        alert(t('thankYouForRating'));
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      alert(t('errorSubmittingRating'));
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert(t('pleaseLogin'));
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/auth/delete-account', {
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
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'Delivered').length;
  const totalSpent = orders.reduce((sum, order) => sum + order.total_amount, 0);
  const pendingOrders = orders.filter(o => 
    o.status !== 'Delivered' && o.status !== 'Cancelled'
  ).length;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="w-5 h-5" />;
      case 'Confirmed': return <CheckCircle className="w-5 h-5" />;
      case 'Packed': return <Package className="w-5 h-5" />;
      case 'In Transit': return <Truck className="w-5 h-5" />;
      case 'Out for Delivery': return <Truck className="w-5 h-5" />;
      case 'Delivered': return <CheckCircle className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
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
              {t('welcome')}, {user?.name}! 🛒
            </h1>
            <p className="text-xl text-gray-600">{t('consumerDashboardDesc')}</p>
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
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <ShoppingBag className="w-10 h-10" />
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{totalOrders}</h3>
            <p className="text-blue-100">{t('totalOrders')}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-10 h-10" />
              <Package className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{deliveredOrders}</h3>
            <p className="text-green-100">{t('delivered')}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-10 h-10" />
              <TrendingUp className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">₹{totalSpent}</h3>
            <p className="text-purple-100">{t('totalSpent')}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Truck className="w-10 h-10" />
              <Clock className="w-6 h-6 opacity-70" />
            </div>
            <h3 className="text-3xl font-bold mb-1">{pendingOrders}</h3>
            <p className="text-orange-100">{t('inProgress')}</p>
          </div>
        </div>

        {/* Analytics Dashboard */}
        {analytics && <ConsumerAnalytics data={analytics} />}

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">{t('readyToShop')}</h2>
              <p className="text-green-50">{t('exploreProducts')}</p>
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-3 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors shadow-lg"
            >
              {t('goToMarketplace')} →
            </button>
          </div>
        </div>

        {/* My Orders Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <ShoppingBag className="w-6 h-6 mr-3 text-blue-600" />
              {t('myPurchases')}
            </h2>
            <button
              onClick={loadConsumerData}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('refresh')}
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg mb-4">{t('noOrdersYet')}</p>
              <p className="text-sm mb-6">{t('startShoppingNow')}</p>
              <button
                onClick={() => navigate('/marketplace')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {t('browseProducts')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.order_id} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-800">
                          {t('order')} #{order.order_id.slice(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1">{order.status}</span>
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('orderDate')}: {new Date(order.order_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">₹{order.total_amount}</p>
                      <p className="text-xs text-gray-500">{order.payment_method}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                      <span>{t('pending')}</span>
                      <span>{t('packed')}</span>
                      <span>{t('inTransit')}</span>
                      <span>{t('delivered')}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          order.status === 'Delivered' ? 'bg-green-500 w-full' :
                          order.status === 'Out for Delivery' || order.status === 'In Transit' ? 'bg-blue-500 w-3/4' :
                          order.status === 'Packed' ? 'bg-purple-500 w-1/2' :
                          order.status === 'Confirmed' ? 'bg-blue-500 w-1/4' :
                          'bg-yellow-500 w-1/4'
                        }`}
                      ></div>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="font-semibold text-gray-700 mb-3 text-sm">{t('items')}:</h4>
                    <div className="space-y-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center space-x-3">
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.product_name} 
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-600">
                              {item.quantity} {item.unit} × ₹{item.price_per_unit}
                            </p>
                          </div>
                          <p className="font-semibold text-sm">₹{item.quantity * item.price_per_unit}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="flex items-start space-x-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-500 mt-1 flex-shrink-0" />
                    <p className="text-sm text-gray-600">{order.shipping_address}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      {t('viewDetails')}
                    </button>
                    
                    {order.tracking_id && (
                      <button
                        onClick={() => navigate(`/supply-chain?track=${order.tracking_id}`)}
                        className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                      >
                        <Truck className="w-4 h-4 mr-2" />
                        {t('trackOrder')}
                      </button>
                    )}

                    {order.status === 'Delivered' && !order.rating && (
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowRatingModal(true);
                        }}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
                      >
                        <Star className="w-4 h-4 mr-2" />
                        {t('rateOrder')}
                      </button>
                    )}
                  </div>

                  {/* Rating Display */}
                  {order.rating && (
                    <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center mb-2">
                        <span className="text-yellow-500 font-semibold mr-2">
                          {'⭐'.repeat(order.rating)}
                        </span>
                        <span className="text-sm text-gray-600">
                          {t('yourRating')}: {order.rating}/5
                        </span>
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
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative max-h-[80vh] overflow-y-auto">
            <button
              onClick={() => setShowOrderModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {t('orderDetails')} #{selectedOrder.order_id.slice(0, 8)}
            </h2>
            
            <div className="space-y-6">
              {/* Status */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('status')}:</h3>
                <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-2">{selectedOrder.status}</span>
                </span>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">{t('orderItems')}:</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      {item.image_url && (
                        <img 
                          src={item.image_url} 
                          alt={item.product_name} 
                          className="w-20 h-20 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{item.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} {item.unit} × ₹{item.price_per_unit}
                        </p>
                      </div>
                      <p className="font-bold text-lg">₹{item.quantity * item.price_per_unit}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Details */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('shippingAddress')}:</h3>
                <div className="flex items-start space-x-2 p-4 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-500 mt-1" />
                  <p className="text-gray-700">{selectedOrder.shipping_address}</p>
                </div>
              </div>

              {/* Payment */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">{t('paymentMethod')}:</h3>
                <p className="p-4 bg-gray-50 rounded-lg">{selectedOrder.payment_method}</p>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-800">{t('total')}:</span>
                  <span className="text-3xl font-bold text-green-600">₹{selectedOrder.total_amount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => {
                setShowRatingModal(false);
                setRating(0);
                setReview('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
            </button>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              {t('rateYourExperience')}
            </h2>
            
            <div className="space-y-6">
              {/* Star Rating */}
              <div>
                <p className="text-center text-gray-600 mb-4">{t('howWasYourOrder')}</p>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="text-4xl transition-transform hover:scale-110"
                    >
                      {star <= rating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-gray-600 mt-2">
                    {rating === 5 ? t('excellent') :
                     rating === 4 ? t('good') :
                     rating === 3 ? t('average') :
                     rating === 2 ? t('poor') :
                     t('veryPoor')}
                  </p>
                )}
              </div>

              {/* Review Text */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  {t('writeReview')} ({t('optional')})
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={4}
                  placeholder={t('shareYourThoughts')}
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                onClick={submitRating}
                disabled={rating === 0}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  rating > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {t('submitRating')}
              </button>
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
                  <li>• {t('orderHistory')} ({orders.length} {t('orders')})</li>
                  <li>• {t('personalData')}</li>
                  <li>• {t('savedAddresses')}</li>
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

