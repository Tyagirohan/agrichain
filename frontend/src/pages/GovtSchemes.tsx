import { useState, useEffect } from 'react';
import { FileText, Search, ExternalLink, Bell, CheckCircle, Calendar, DollarSign, Users, X, Calculator } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getApiEndpoint } from '../config/api';

interface Scheme {
  id: string;
  name: string;
  category: string;
  description: string;
  eligibility: string[];
  benefits: string;
  deadline: string;
  status: 'active' | 'upcoming' | 'expiring-soon';
  link: string;
  organization: string;
  minLandSize?: number; // in hectares
  maxIncome?: number; // annual income limit
  // Hindi translations (from backend)
  name_hi?: string;
  category_hi?: string;
  description_hi?: string;
  eligibility_hi?: string[];
  benefits_hi?: string;
  deadline_hi?: string;
}

interface EligibilityForm {
  landSize: string;
  annualIncome: string;
  farmerType: string;
  cropType: string;
}

// Scheme translations dictionary
const schemeTranslations: Record<string, {
  name: string;
  description: string;
  eligibility: string[];
  benefits: string;
  category: string;
}> = {
  'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)': {
    name: 'PM-KISAN (प्रधानमंत्री किसान सम्मान निधि)',
    description: 'सभी भूमिधारक किसानों के परिवारों को प्रत्यक्ष आय सहायता। रु.6,000 प्रति वर्ष तीन समान किस्तों में रु.2,000 प्रत्येक।',
    eligibility: ['लघु और सीमांत किसान', 'भूमिधारक किसान', 'सभी खेती योग्य भूमिधारक'],
    benefits: 'रु.6,000 प्रति वर्ष (रु.2,000 प्रति किस्त)',
    category: 'वित्तीय सहायता',
  },
  'PMFBY (Pradhan Mantri Fasal Bima Yojana)': {
    name: 'PMFBY (प्रधानमंत्री फसल बीमा योजना)',
    description: 'प्राकृतिक आपदाओं, कीटों और बीमारियों के कारण फसल विफलता की स्थिति में वित्तीय सहायता प्रदान करने वाली फसल बीमा योजना।',
    eligibility: ['अधिसूचित फसलें उगाने वाले सभी किसान', 'बटाईदार और किरायेदार किसान', 'भूमि मालिक भी नामांकन कर सकते हैं'],
    benefits: 'बीमा पर 90% तक प्रीमियम सब्सिडी',
    category: 'बीमा',
  },
  'Soil Health Card Scheme': {
    name: 'मृदा स्वास्थ्य कार्ड योजना',
    description: 'मिट्टी के स्वास्थ्य और उत्पादकता में सुधार के लिए निःशुल्क मिट्टी परीक्षण और पोषक तत्व आधारित सिफारिशें।',
    eligibility: ['सभी किसान', 'भूमि आकार पर कोई प्रतिबंध नहीं', 'सभी राज्यों में उपलब्ध'],
    benefits: 'निःशुल्क मिट्टी परीक्षण + व्यक्तिगत उर्वरक सिफारिशें',
    category: 'कृषि सेवाएं',
  },
  'Kisan Credit Card (KCC)': {
    name: 'किसान क्रेडिट कार्ड (KCC)',
    description: 'कृषि और संबद्ध गतिविधियों के लिए रियायती ब्याज दरों पर किसानों को ऋण की आसान पहुंच।',
    eligibility: ['सभी किसान (मालिक/किरायेदार)', 'बटाईदार', 'स्वयं सहायता समूह'],
    benefits: '2% तक ब्याज छूट, रु.3 लाख तक की ऋण सीमा',
    category: 'ऋण/कर्ज',
  },
  'PKVY (Paramparagat Krishi Vikas Yojana)': {
    name: 'PKVY (परम्परागत कृषि विकास योजना)',
    description: 'क्लस्टर दृष्टिकोण और PGS प्रमाणन के माध्यम से जैविक खेती को बढ़ावा देना।',
    eligibility: ['जैविक खेती में रुचि रखने वाले किसान', '50 या अधिक के समूह बनाने चाहिए', 'सभी फसलें पात्र'],
    benefits: '3 वर्षों के लिए रु.50,000 प्रति हेक्टेयर + प्रमाणन सहायता',
    category: 'जैविक खेती',
  },
  'National Agriculture Market (e-NAM)': {
    name: 'राष्ट्रीय कृषि बाजार (e-NAM)',
    description: 'कृषि वस्तुओं के लिए पैन-इंडिया इलेक्ट्रॉनिक ट्रेडिंग पोर्टल जो पारदर्शी मूल्य खोज सुनिश्चित करता है।',
    eligibility: ['सभी पंजीकृत किसान', 'वैध पहचान पत्र होना चाहिए', 'बैंक खाता आवश्यक'],
    benefits: 'प्रत्यक्ष बाजार पहुंच + पारदर्शी मूल्य निर्धारण + ऑनलाइन भुगतान',
    category: 'विपणन',
  },
  'PM Kusum (Solar Pump Subsidy)': {
    name: 'PM कुसुम (सोलर पंप सब्सिडी)',
    description: 'सोलर पंप स्थापना और ग्रिड से जुड़े कृषि पंपों के सोलराइजेशन के लिए वित्तीय सहायता।',
    eligibility: ['सभी किसान', 'किसान समूह', 'सहकारी समितियां'],
    benefits: 'सोलर पंप स्थापना पर 60% तक सब्सिडी',
    category: 'ऊर्जा/बुनियादी ढांचा',
  },
  'Micro Irrigation Fund': {
    name: 'सूक्ष्म सिंचाई कोष',
    description: 'PMKSY के तहत ड्रिप और स्प्रिंकलर सिंचाई प्रणाली स्थापित करने के लिए सहायता।',
    eligibility: ['सभी किसान', 'किसान उत्पादक संगठन', 'राज्य सरकारें आवेदन कर सकती हैं'],
    benefits: 'किसान श्रेणी के आधार पर 50-90% सब्सिडी',
    category: 'जल संरक्षण',
  },
};

export const GovtSchemes = () => {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showEligibilityModal, setShowEligibilityModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribePhone, setSubscribePhone] = useState('');
  const [eligibilityForm, setEligibilityForm] = useState<EligibilityForm>({
    landSize: '',
    annualIncome: '',
    farmerType: 'owner',
    cropType: 'all',
  });
  const [eligibilityResults, setEligibilityResults] = useState<Scheme[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [schemes, setSchemes] = useState<Scheme[]>([]);

  // Helper function to translate scheme
  const translateScheme = (scheme: Scheme): Scheme => {
    const isHindi = i18n.language === 'hi';
    
    if (!isHindi) {
      return scheme;
    }
    
    // Use backend-provided Hindi translations (with _hi suffix fields)
    // If those are present, they take priority over manual dictionary
    if (scheme.name_hi) {
      return {
        ...scheme,
        name: scheme.name_hi,
        description: scheme.description_hi || scheme.description,
        eligibility: scheme.eligibility_hi || scheme.eligibility,
        benefits: scheme.benefits_hi || scheme.benefits,
        category: scheme.category_hi || scheme.category,
        deadline: scheme.deadline_hi || scheme.deadline,
      };
    }
    
    // Fallback to manual translation dictionary if backend doesn't provide
    const translation = schemeTranslations[scheme.name];
    if (translation) {
      return {
        ...scheme,
        name: translation.name,
        description: translation.description,
        eligibility: translation.eligibility,
        benefits: translation.benefits,
        category: translation.category,
      };
    }
    
    return scheme;
  };

  // Fetch schemes from backend
  useEffect(() => {
    fetchSchemes();
  }, [i18n.language]); // Refetch when language changes

  const fetchSchemes = async () => {
    try {
      const currentLang = i18n.language; // 'en' or 'hi'
      const response = await fetch(getApiEndpoint(`/schemes?language=${currentLang}`));
      if (!response.ok) {
        throw new Error('Failed to fetch schemes');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.schemes)) {
        setSchemes(data.schemes);
        console.log(`✅ Loaded ${data.schemes.length} schemes in ${currentLang.toUpperCase()}`);
      } else {
        // Fallback to mock data
        setSchemes(mockSchemes);
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
      // Fallback to mock data if API fails
      setSchemes(mockSchemes);
    }
  };

  const mockSchemes: Scheme[] = [
    {
      id: '1',
      name: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      category: 'Financial Support',
      description: 'Direct income support to all landholding farmers\' families. ₹6,000 per year in three equal installments.',
      eligibility: [
        'Small and marginal farmers',
        'Landholding farmers',
        'All cultivable landholders',
      ],
      benefits: '₹6,000 per year (₹2,000 per installment)',
      deadline: 'Ongoing - Register anytime',
      status: 'active',
      link: 'https://pmkisan.gov.in',
      organization: 'Ministry of Agriculture',
      minLandSize: 0,
      maxIncome: 200000,
    },
    {
      id: '2',
      name: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
      category: 'Insurance',
      description: 'Crop insurance scheme providing financial support in case of crop failure due to natural calamities.',
      eligibility: [
        'All farmers growing notified crops',
        'Sharecroppers and tenant farmers',
        'Land owners can also enroll',
      ],
      benefits: 'Up to 90% premium subsidy on insurance',
      deadline: 'Before Kharif season - June 2025',
      status: 'expiring-soon',
      link: 'https://pmfby.gov.in',
      organization: 'Ministry of Agriculture',
      minLandSize: 0,
    },
    {
      id: '3',
      name: 'Soil Health Card Scheme',
      category: 'Agricultural Services',
      description: 'Free soil testing and nutrient recommendations to improve soil health and productivity.',
      eligibility: [
        'All farmers',
        'No land size restriction',
        'Available across all states',
      ],
      benefits: 'Free soil testing + personalized fertilizer recommendations',
      deadline: 'Ongoing',
      status: 'active',
      link: 'https://soilhealth.dac.gov.in',
      organization: 'Department of Agriculture',
      minLandSize: 0,
    },
    {
      id: '4',
      name: 'Kisan Credit Card (KCC)',
      category: 'Credit/Loans',
      description: 'Easy access to credit for farmers at subsidized interest rates for agricultural needs.',
      eligibility: [
        'All farmers (owner/tenant)',
        'Sharecroppers',
        'Self-help groups',
      ],
      benefits: 'Interest subvention up to 2%, credit limit up to ₹3 lakh',
      deadline: 'Ongoing',
      status: 'active',
      link: 'https://www.india.gov.in/spotlight/kisan-credit-card-scheme',
      organization: 'NABARD',
      minLandSize: 0.1,
    },
    {
      id: '5',
      name: 'PKVY (Paramparagat Krishi Vikas Yojana)',
      category: 'Organic Farming',
      description: 'Promotion of organic farming through cluster approach and certification support.',
      eligibility: [
        'Farmers interested in organic farming',
        'Must form groups of 50 or more',
        'All crops eligible',
      ],
      benefits: '₹50,000 per hectare for 3 years + certification support',
      deadline: 'Application open - March 2025',
      status: 'active',
      link: 'https://pgsindia-ncof.gov.in',
      organization: 'Ministry of Agriculture',
      minLandSize: 1,
    },
    {
      id: '6',
      name: 'National Agriculture Market (e-NAM)',
      category: 'Marketing',
      description: 'Online trading platform for agricultural commodities ensuring better price discovery.',
      eligibility: [
        'All registered farmers',
        'Must have valid ID proof',
        'Bank account required',
      ],
      benefits: 'Direct market access + transparent pricing + online payment',
      deadline: 'Ongoing - Register anytime',
      status: 'active',
      link: 'https://www.enam.gov.in',
      organization: 'Small Farmers Agribusiness Consortium',
      minLandSize: 0,
    },
    {
      id: '7',
      name: 'PM Kusum (Solar Pump Subsidy)',
      category: 'Energy/Infrastructure',
      description: 'Subsidy for installing solar pumps and solarizing grid-connected agricultural pumps.',
      eligibility: [
        'All farmers',
        'Farmer groups',
        'Cooperatives',
      ],
      benefits: 'Up to 60% subsidy on solar pump installation',
      deadline: 'Phase 2 - Applications till May 2025',
      status: 'active',
      link: 'https://www.india.gov.in/spotlight/pm-kusum',
      organization: 'Ministry of New and Renewable Energy',
      minLandSize: 0.5,
      maxIncome: 300000,
    },
    {
      id: '8',
      name: 'Micro Irrigation Fund',
      category: 'Water Conservation',
      description: 'Support for installing drip and sprinkler irrigation systems to conserve water.',
      eligibility: [
        'All farmers',
        'Farmer producer organizations',
        'State governments can apply',
      ],
      benefits: '50-90% subsidy based on farmer category',
      deadline: 'Ongoing',
      status: 'active',
      link: 'https://pmksy.gov.in',
      organization: 'NABARD',
      minLandSize: 0.2,
    },
  ];

  const categories = ['all', 'Financial Support', 'Insurance', 'Agricultural Services', 'Credit/Loans', 'Organic Farming', 'Marketing', 'Energy/Infrastructure', 'Water Conservation'];

  const filteredSchemes = schemes.filter(scheme => {
    const matchesSearch = scheme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          scheme.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).map(scheme => translateScheme(scheme)); // Apply translation to filtered schemes

  const stats = [
    { icon: FileText, label: t('activeSchemes'), value: schemes.filter(s => s.status === 'active').length.toString() },
    { icon: Users, label: t('farmersBenefited'), value: '10 Cr+' },
    { icon: DollarSign, label: t('totalDisbursed'), value: '₹2.5 Lakh Cr' },
  ];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subscribeEmail && !subscribePhone) {
      alert('Please provide either email or phone number');
      return;
    }
    
    alert(
      `Successfully Subscribed! 🎉\n\n` +
      `You'll receive notifications about:\n` +
      `• New schemes and programs\n` +
      `• Deadline reminders\n` +
      `• Policy updates\n` +
      `• Application status\n\n` +
      (subscribeEmail ? `Email: ${subscribeEmail}\n` : '') +
      (subscribePhone ? `Phone: ${subscribePhone}` : '')
    );
    
    setSubscribeEmail('');
    setSubscribePhone('');
    setShowSubscribeModal(false);
  };

  const checkEligibility = (e: React.FormEvent) => {
    e.preventDefault();
    
    const landSize = parseFloat(eligibilityForm.landSize);
    const income = parseFloat(eligibilityForm.annualIncome);
    
    const eligible = schemes.filter(scheme => {
      // Check land size requirement
      if (scheme.minLandSize !== undefined && landSize < scheme.minLandSize) {
        return false;
      }
      
      // Check income limit
      if (scheme.maxIncome !== undefined && income > scheme.maxIncome) {
        return false;
      }
      
      return true;
    });
    
    setEligibilityResults(eligible.map(scheme => translateScheme(scheme))); // Apply translation
    setShowResults(true);
  };

  const openEligibilityChecker = (scheme: Scheme) => {
    setSelectedScheme(translateScheme(scheme)); // Apply translation
    setShowEligibilityModal(true);
    setShowResults(false);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t('govtSchemesTitle')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('govtSchemesDesc')}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4">
                <div className="p-4 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl">
                  <Icon className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchSchemes')}
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
                  {category === 'all' ? t('allCategories') : category}
                </option>
              ))}
            </select>
            <button
              onClick={() => { setShowEligibilityModal(true); setShowResults(false); }}
              className="px-6 py-4 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Calculator className="w-5 h-5" />
              <span>{t('checkEligibility')}</span>
            </button>
          </div>
        </div>

        {/* Alert Banner */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-xl mb-8 flex items-start space-x-4">
          <Bell className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="font-bold text-gray-800 mb-2">Important Notice</h3>
            <p className="text-gray-700 text-sm">
              PMFBY (Crop Insurance) deadline approaching! Register before June 2025. 
              Last date for Kharif season enrollment. Don't miss out on crop protection.
            </p>
          </div>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-semibold hover:bg-yellow-600 transition-colors whitespace-nowrap"
          >
            {t('getAlerts')}
          </button>
        </div>

        {/* Schemes Grid */}
        <div className="space-y-6">
          {filteredSchemes.map(scheme => (
            <div key={scheme.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
              {/* Status Bar */}
              <div className={`h-2 ${
                scheme.status === 'active' 
                  ? 'bg-green-500' 
                  : scheme.status === 'upcoming' 
                  ? 'bg-blue-500' 
                  : 'bg-orange-500'
              }`}></div>

              <div className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-2xl font-bold text-gray-800 mr-4">{scheme.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        scheme.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : scheme.status === 'upcoming' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {scheme.status === 'expiring-soon' ? 'EXPIRING SOON' : scheme.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        {scheme.category}
                      </span>
                      <span>{scheme.organization}</span>
                    </div>
                    <p className="text-gray-700 leading-relaxed mb-4">{scheme.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* Eligibility */}
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                      {t('eligibility')}
                    </h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {scheme.eligibility.map((item, index) => (
                        <li key={index} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Benefits */}
                  <div className="p-4 bg-green-50 rounded-xl">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2 text-green-600" />
                      {t('benefits')}
                    </h3>
                    <p className="text-sm text-gray-700">{scheme.benefits}</p>
                  </div>

                  {/* Deadline */}
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h3 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Calendar className="w-5 h-5 mr-2 text-purple-600" />
                      {t('deadline')}
                    </h3>
                    <p className="text-sm text-gray-700">{scheme.deadline}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={scheme.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                  >
                    <span>{t('applyNow')}</span>
                    <ExternalLink className="w-5 h-5" />
                  </a>
                  <button 
                    onClick={() => openEligibilityChecker(scheme)}
                    className="px-6 py-3 border-2 border-green-600 text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-colors"
                  >
                    Check Eligibility
                  </button>
                  <button 
                    onClick={() => alert(`More details about ${scheme.name}:\n\n${scheme.description}\n\nFor complete information, visit: ${scheme.link}`)}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                  >
                    {t('moreDetails')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredSchemes.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No schemes found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Notification Signup CTA */}
        <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-12 text-center text-white">
          <Bell className="w-16 h-16 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Get Scheme Alerts</h2>
          <p className="text-xl mb-6 text-purple-50">
            Subscribe to receive real-time notifications about new schemes and deadlines
          </p>
          <button
            onClick={() => setShowSubscribeModal(true)}
            className="px-10 py-4 bg-white text-purple-600 rounded-xl font-semibold text-lg hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
          >
            Subscribe Now
          </button>
        </div>
      </div>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Bell className="w-8 h-8 mr-3 text-purple-600" />
              Subscribe to Alerts
            </h3>
            
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={subscribeEmail}
                  onChange={(e) => setSubscribeEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div className="text-center text-gray-500 text-sm">OR</div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number (WhatsApp)</label>
                <input
                  type="tel"
                  value={subscribePhone}
                  onChange={(e) => setSubscribePhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                />
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  You'll receive notifications about:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• New agricultural schemes</li>
                  <li>• Application deadline reminders</li>
                  <li>• Policy updates and changes</li>
                  <li>• Scheme-specific alerts</li>
                </ul>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Eligibility Checker Modal */}
      {showEligibilityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={() => {setShowEligibilityModal(false); setShowResults(false);}}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
              <Calculator className="w-8 h-8 mr-3 text-green-600" />
              Eligibility Calculator
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedScheme 
                ? `Check if you're eligible for ${selectedScheme.name}` 
                : 'Find out which schemes you qualify for'}
            </p>
            
            {!showResults ? (
              <form onSubmit={checkEligibility} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Land Size (Hectares) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={eligibilityForm.landSize}
                      onChange={(e) => setEligibilityForm({...eligibilityForm, landSize: e.target.value})}
                      required
                      placeholder="e.g., 2.5"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income (₹) *</label>
                    <input
                      type="number"
                      value={eligibilityForm.annualIncome}
                      onChange={(e) => setEligibilityForm({...eligibilityForm, annualIncome: e.target.value})}
                      required
                      placeholder="e.g., 150000"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Farmer Type *</label>
                    <select
                      value={eligibilityForm.farmerType}
                      onChange={(e) => setEligibilityForm({...eligibilityForm, farmerType: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    >
                      <option value="owner">Land Owner</option>
                      <option value="tenant">Tenant Farmer</option>
                      <option value="sharecropper">Sharecropper</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Crop *</label>
                    <select
                      value={eligibilityForm.cropType}
                      onChange={(e) => setEligibilityForm({...eligibilityForm, cropType: e.target.value})}
                      required
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:outline-none"
                    >
                      <option value="all">All Crops</option>
                      <option value="rice">Rice</option>
                      <option value="wheat">Wheat</option>
                      <option value="cotton">Cotton</option>
                      <option value="sugarcane">Sugarcane</option>
                      <option value="vegetables">Vegetables</option>
                    </select>
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200"
                >
                  Check Eligibility
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-6 bg-green-50 border-2 border-green-500 rounded-xl mb-6">
                  <h4 className="text-xl font-bold text-green-800 mb-2">
                    ✅ You're eligible for {eligibilityResults.length} scheme{eligibilityResults.length !== 1 ? 's' : ''}!
                  </h4>
                  <p className="text-green-700">
                    Based on your information (Land: {eligibilityForm.landSize}ha, Income: ₹{eligibilityForm.annualIncome})
                  </p>
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {eligibilityResults.map(scheme => (
                    <div key={scheme.id} className="p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 transition-colors">
                      <h5 className="font-bold text-gray-800 mb-1">{scheme.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{scheme.benefits}</p>
                      <div className="flex space-x-2">
                        <a
                          href={scheme.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors text-center"
                        >
                          Apply Now
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={() => setShowResults(false)}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Check Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
