import { Link } from 'react-router-dom';
import { Microscope, Package, FileText, ShoppingCart, TrendingUp, Shield, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const HomePage = () => {
  const { t } = useTranslation();
  
  const features = [
    {
      icon: Microscope,
      title: t('aiCropDisease'),
      description: t('aiCropDiseaseDesc'),
      link: '/crop-detection',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Package,
      title: t('blockchainSupplyChain'),
      description: t('blockchainSupplyChainDesc'),
      link: '/supply-chain',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      icon: FileText,
      title: t('governmentSchemes'),
      description: t('governmentSchemesDesc'),
      link: '/govt-schemes',
      color: 'from-purple-500 to-pink-600',
    },
    {
      icon: ShoppingCart,
      title: t('farmerMarketplace'),
      description: t('farmerMarketplaceDesc'),
      link: '/marketplace',
      color: 'from-orange-500 to-red-600',
    },
  ];

  const stats = [
    { icon: Users, label: t('farmersHelped'), value: '10,000+' },
    { icon: TrendingUp, label: t('cropsAnalyzed'), value: '50,000+' },
    { icon: Shield, label: t('blockchainVerified'), value: '100%' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-500 to-blue-600 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
              {t('heroTitle')}
              <span className="block mt-2 bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('heroSubtitle')}
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-green-50">
              {t('heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/crop-detection"
                className="px-8 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-xl"
              >
                {t('startDetection')}
              </Link>
              <Link
                to="/marketplace"
                className="px-8 py-4 bg-green-800 text-white rounded-lg font-semibold text-lg hover:bg-green-900 transform hover:scale-105 transition-all duration-200 shadow-xl"
              >
                {t('exploreMarket')}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-green-50"></div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center justify-center space-x-4 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl">
                  <Icon className="w-12 h-12 text-green-600" />
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                    <p className="text-gray-600">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {t('completeEcosystem')}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('ecosystemDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Link
                  key={index}
                  to={feature.link}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-2"
                >
                  <div className={`h-2 bg-gradient-to-r ${feature.color}`}></div>
                  <div className="p-8">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-r ${feature.color} mb-4`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-4 flex items-center text-green-600 font-semibold group-hover:translate-x-2 transition-transform">
                      {t('learnMore')}
                      <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              {t('howAgriChainWorks')}
            </h2>
            <p className="text-xl text-gray-600">{t('simplePowerful')}</p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              {[
                { step: '1', title: t('monitorCropHealth'), desc: t('monitorCropHealthDesc') },
                { step: '2', title: t('trackSupplyChainStep'), desc: t('trackSupplyChainStepDesc') },
                { step: '3', title: t('accessSchemes'), desc: t('accessSchemesDesc') },
                { step: '4', title: t('sellDirect'), desc: t('sellDirectDesc') },
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-600 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-lg">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {t('readyToTransform')}
          </h2>
          <p className="text-xl mb-8 text-green-50 max-w-2xl mx-auto">
            {t('joinThousands')}
          </p>
          <Link
            to="/crop-detection"
            className="inline-block px-10 py-4 bg-white text-green-600 rounded-lg font-semibold text-lg hover:bg-green-50 transform hover:scale-105 transition-all duration-200 shadow-xl"
          >
            {t('getStartedNow')}
          </Link>
        </div>
      </section>
    </div>
  );
};

