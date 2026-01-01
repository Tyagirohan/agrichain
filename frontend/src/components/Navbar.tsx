import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sprout, Microscope, Package, FileText, ShoppingCart, LogIn, User, LogOut, MessageCircle } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { useState, useEffect } from 'react';

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState<any>(null);

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    // Common items for everyone
    const commonItems = [
      { path: '/', label: t('home'), icon: Sprout },
    ];

    // Farmer-specific items
    const farmerItems = [
      { path: '/crop-detection', label: t('cropDetection'), icon: Microscope },
      { path: '/supply-chain', label: t('supplyChain'), icon: Package },
      { path: '/govt-schemes', label: t('govtSchemes'), icon: FileText },
      { path: '/marketplace', label: t('marketplace'), icon: ShoppingCart },
    ];

    // Consumer-specific items
    const consumerItems = [
      { path: '/marketplace', label: t('marketplace'), icon: ShoppingCart },
    ];

    // Guest items (not logged in)
    const guestItems = [
      { path: '/crop-detection', label: t('cropDetection'), icon: Microscope },
      { path: '/supply-chain', label: t('supplyChain'), icon: Package },
      { path: '/govt-schemes', label: t('govtSchemes'), icon: FileText },
      { path: '/marketplace', label: t('marketplace'), icon: ShoppingCart },
    ];

    if (!user) {
      return [...commonItems, ...guestItems];
    }

    if (user.role === 'farmer') {
      return [...commonItems, ...farmerItems];
    }

    if (user.role === 'consumer') {
      return [...commonItems, ...consumerItems];
    }

    return [...commonItems, ...guestItems];
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Sprout className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              AgriChain
            </span>
          </Link>

          <div className="hidden md:flex items-center space-x-2 ml-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-green-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-green-50 hover:text-green-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            {/* Chat Icon (only show if logged in) */}
            {user && (
              <Link
                to="/chat"
                className="relative p-2 text-gray-600 hover:bg-green-50 rounded-lg transition-colors"
                title={t('chat')}
              >
                <MessageCircle className="w-6 h-6" />
                {/* TODO: Add unread count badge here */}
              </Link>
            )}
            
            <NotificationCenter />
            <LanguageSwitcher />
            
            {/* Login/Profile Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={user.role === 'farmer' ? '/farmer-dashboard' : '/consumer-dashboard'}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <User className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-gray-700">{user.name}</span>
                  <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                    {user.role === 'farmer' ? '🌾' : '🛒'}
                  </span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200 shadow-md"
              >
                <LogIn className="w-5 h-5" />
                <span>{t('login') || 'Login'}</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

