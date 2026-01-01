import { useState, useRef } from 'react';
import { Upload, Camera, AlertCircle, CheckCircle, Loader, Download, Share2, X, Mail, MessageCircle as WhatsApp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';

interface DetectionResult {
  disease: string;
  confidence: number;
  treatment: string;
  prevention: string;
}

interface DiseaseInfo {
  name: string;
  image: string;
  description: string;
  symptoms: string[];
  causes: string[];
}

// Disease translation dictionary
const diseaseTranslations: Record<string, {
  name: string;
  treatment: string;
  prevention: string;
  description: string;
  symptoms: string[];
  causes: string[];
}> = {
  'Late Blight': {
    name: 'पछेती अंगमारी',
    treatment: 'तांबा आधारित कवकनाशी (बोर्डो मिश्रण) तुरंत लगाएं। संक्रमित पत्तियों को हटाएं और नष्ट करें। नम मौसम में हर 7-10 दिन में छिड़काव करें।',
    prevention: 'अच्छा वायु संचार सुनिश्चित करें, ऊपर से पानी देने से बचें, और नम मौसम में निवारक कवकनाशी स्प्रे करें। प्रतिरोधी किस्में लगाएं।',
    description: 'पछेती अंगमारी फाइटोफ्थोरा इन्फेस्टन्स रोगजनक के कारण होने वाली एक विनाशकारी बीमारी है।',
    symptoms: ['पत्तियों पर गहरे भूरे धब्बे', 'निचली सतह पर सफेद फफूंद', 'पत्तियों की तेजी से मृत्यु', 'कंद सड़न'],
    causes: ['नम मौसम', 'ठंडा तापमान (15-20°C)', 'ऊपर से सिंचाई', 'खराब वायु संचार'],
  },
  'Powdery Mildew': {
    name: 'पाउडरी मिल्ड्यू (चूर्णिल आसिता)',
    treatment: 'सल्फर या पोटेशियम बाइकार्बोनेट घोल से स्प्रे करें। 1 गैलन पानी में 1 चम्मच बेकिंग सोडा + 1 चम्मच वनस्पति तेल मिलाएं। साप्ताहिक रूप से लगाएं।',
    prevention: 'प्रतिरोधी किस्में लगाएं, उचित दूरी (18-24 इंच) बनाए रखें, अधिक नाइट्रोजन उर्वरक से बचें, और मिट्टी के स्तर पर पानी दें।',
    description: 'एक कवक रोग जो पत्तियों और तनों पर सफेद पाउडर जैसे धब्बों के रूप में दिखाई देता है।',
    symptoms: ['सफेद पाउडर जैसी परत', 'पीली पत्तियां', 'बाधित वृद्धि', 'पत्तियों का मुड़ना'],
    causes: ['उच्च आर्द्रता', 'खराब वायु संचार', 'भीड़भाड़', 'छायादार क्षेत्र'],
  },
  'Leaf Spot': {
    name: 'पत्ती धब्बा रोग',
    treatment: 'कॉपर ऑक्सीक्लोराइड या मैन्कोज़ेब स्प्रे करें। संक्रमित पत्तियों को हटाएं और जलाएं। हर 10-14 दिन में छिड़काव दोहराएं।',
    prevention: 'पौधों को सूखा रखें, संक्रमित मलबे को साफ करें, उचित जल निकासी सुनिश्चित करें, और उपकरणों को कीटाणुरहित करें।',
    description: 'पत्तियों पर गोलाकार धब्बे पैदा करने वाला कवक या जीवाणु संक्रमण।',
    symptoms: ['गोलाकार भूरे/काले धब्बे', 'धब्बों के चारों ओर पीले हेलो', 'पत्तियों का झड़ना', 'उपज में कमी'],
    causes: ['गीली पत्तियां', 'दूषित उपकरण', 'संक्रमित पौधे का मलबा', 'खराब जल निकासी'],
  },
  'Rust Disease': {
    name: 'रस्ट रोग (गेरूई)',
    treatment: 'मैन्कोज़ेब या प्रोपिकोनाज़ोल स्प्रे करें। संक्रमित भागों को हटा दें। 2-3 सप्ताह तक साप्ताहिक छिड़काव करें।',
    prevention: 'उचित पौधों की दूरी बनाए रखें, अधिक नमी से बचें, संक्रमित पौधों के मलबे को हटाएं, और प्रतिरोधी किस्में लगाएं।',
    description: 'पौधों के ऊतकों पर जंग के रंग के पुस्ट्यूल की विशेषता वाला कवक रोग।',
    symptoms: ['नारंगी/भूरे पुस्ट्यूल', 'पीली पत्तियां', 'समय से पहले पत्तियों का झड़ना', 'कमजोर पौधे'],
    causes: ['उच्च आर्द्रता', 'मध्यम तापमान', 'हवा से बीजाणु फैलना', 'घना रोपण'],
  },
  'Healthy Crop': {
    name: 'स्वस्थ फसल',
    treatment: 'कोई उपचार की आवश्यकता नहीं। वर्तमान देखभाल दिनचर्या जारी रखें। किसी भी परिवर्तन के लिए नियमित निगरानी करें।',
    prevention: 'नियमित निगरानी, उचित पानी देने का कार्यक्रम, संतुलित उर्वरक (NPK 10-10-10), और अच्छी खेत स्वच्छता बनाए रखें।',
    description: 'आपकी फसल स्वस्थ है और अच्छी स्थिति में बढ़ रही है।',
    symptoms: ['कोई लक्षण नहीं', 'स्वस्थ हरी पत्तियां', 'सामान्य वृद्धि', 'कोई दृश्य क्षति नहीं'],
    causes: [],
  },
  'Bacterial Wilt': {
    name: 'जीवाणु मुरझान',
    treatment: 'संक्रमित पौधों को तुरंत हटाएं और नष्ट करें। कॉपर आधारित कीटाणुनाशक का उपयोग करें। मिट्टी को सूरज की रोशनी में सुखाएं।',
    prevention: 'प्रतिरोधी किस्मों का उपयोग करें, फसल चक्र अपनाएं, उचित जल निकासी सुनिश्चित करें, और कीट नियंत्रण बनाए रखें।',
    description: 'जीवाणु संक्रमण जो पौधों की जल-वाहक प्रणाली को अवरुद्ध करता है।',
    symptoms: ['अचानक मुरझाना', 'पीली पत्तियां', 'भूरा संवहनी ऊतक', 'पौधे की मृत्यु'],
    causes: ['मिट्टी जनित जीवाणु', 'कीट वाहक', 'दूषित उपकरण', 'अत्यधिक नमी'],
  },
};

export const CropDiseaseDetection = () => {
  const { t, i18n } = useTranslation();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDiseaseModal, setShowDiseaseModal] = useState(false);
  const [selectedDisease, setSelectedDisease] = useState<DiseaseInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Helper function to translate disease info
  const getTranslatedDisease = (diseaseName: string) => {
    const isHindi = i18n.language === 'hi';
    const translation = diseaseTranslations[diseaseName];
    
    if (!translation || !isHindi) {
      return diseaseName;
    }
    
    return translation.name;
  };

  const getTranslatedTreatment = (diseaseName: string, originalTreatment: string) => {
    const isHindi = i18n.language === 'hi';
    const translation = diseaseTranslations[diseaseName];
    
    if (!translation || !isHindi) {
      return originalTreatment;
    }
    
    return translation.treatment;
  };

  const getTranslatedPrevention = (diseaseName: string, originalPrevention: string) => {
    const isHindi = i18n.language === 'hi';
    const translation = diseaseTranslations[diseaseName];
    
    if (!translation || !isHindi) {
      return originalPrevention;
    }
    
    return translation.prevention;
  };

  const getTranslatedDiseaseInfo = (diseaseInfo: DiseaseInfo): DiseaseInfo => {
    const isHindi = i18n.language === 'hi';
    const translation = diseaseTranslations[diseaseInfo.name];
    
    if (!translation || !isHindi) {
      return diseaseInfo;
    }
    
    return {
      ...diseaseInfo,
      name: translation.name,
      description: translation.description,
      symptoms: translation.symptoms,
      causes: translation.causes,
    };
  };

  const diseaseDatabase: DiseaseInfo[] = [
    {
      name: 'Late Blight',
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400',
      description: 'Late blight is a devastating disease caused by the pathogen Phytophthora infestans.',
      symptoms: ['Dark brown spots on leaves', 'White mold on undersides', 'Rapid leaf death', 'Tuber rot'],
      causes: ['Humid weather', 'Cool temperatures (15-20°C)', 'Overhead irrigation', 'Poor air circulation'],
    },
    {
      name: 'Powdery Mildew',
      image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400',
      description: 'A fungal disease that appears as white powdery spots on leaves and stems.',
      symptoms: ['White powdery coating', 'Yellowing leaves', 'Stunted growth', 'Leaf curling'],
      causes: ['High humidity', 'Poor air circulation', 'Overcrowding', 'Shaded areas'],
    },
    {
      name: 'Leaf Spot',
      image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
      description: 'Fungal or bacterial infection causing circular spots on leaves.',
      symptoms: ['Circular brown/black spots', 'Yellow halos around spots', 'Leaf dropping', 'Reduced yield'],
      causes: ['Wet foliage', 'Contaminated tools', 'Infected plant debris', 'Poor drainage'],
    },
    {
      name: 'Rust Disease',
      image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=400',
      description: 'Fungal disease characterized by rust-colored pustules on plant tissues.',
      symptoms: ['Orange/brown pustules', 'Yellowing leaves', 'Premature leaf drop', 'Weakened plants'],
      causes: ['High humidity', 'Moderate temperatures', 'Wind spread spores', 'Dense planting'],
    },
  ];

  const mockDiseases: DetectionResult[] = [
    {
      disease: 'Late Blight',
      confidence: 94.5,
      treatment: 'Apply copper-based fungicide (Bordeaux mixture) immediately. Remove and destroy infected leaves. Spray every 7-10 days during wet weather.',
      prevention: 'Ensure good air circulation, avoid overhead watering, and apply preventive fungicide sprays during humid weather. Plant resistant varieties.',
    },
    {
      disease: 'Powdery Mildew',
      confidence: 89.2,
      treatment: 'Spray with sulfur or potassium bicarbonate solution. Mix 1 tablespoon baking soda + 1 tablespoon vegetable oil in 1 gallon water. Apply weekly.',
      prevention: 'Plant resistant varieties, maintain proper spacing (18-24 inches), avoid excess nitrogen fertilizer, and water at soil level.',
    },
    {
      disease: 'Healthy Crop',
      confidence: 96.8,
      treatment: 'No treatment needed. Continue current care routine. Monitor regularly for any changes.',
      prevention: 'Maintain regular monitoring, proper watering schedule, balanced fertilization (NPK 10-10-10), and good field sanitation.',
    },
    {
      disease: 'Leaf Spot',
      confidence: 91.3,
      treatment: 'Remove infected leaves immediately. Apply copper fungicide or neem oil spray. Improve drainage if soil is waterlogged. Apply every 10-14 days.',
      prevention: 'Water at soil level, avoid wetting foliage, ensure adequate plant spacing, remove plant debris, and rotate crops annually.',
    },
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size should be less than 10MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    
    try {
      // Get the file from the input
      const fileInput = fileInputRef.current;
      if (!fileInput || !fileInput.files || !fileInput.files[0]) {
        throw new Error('No file selected');
      }
      
      const file = fileInput.files[0];
      
      // Create FormData to send to backend
      const formData = new FormData();
      formData.append('file', file);
      
      // Call the backend API
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }
      
      const data = await response.json();
      
      // Set the result from backend
      setResult({
        disease: data.disease,
        confidence: data.confidence,
        treatment: data.treatment,
        prevention: data.prevention,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Failed to analyze image. Make sure the backend server is running on http://localhost:8000');
      
      // Fallback to mock data if backend is not available
      const randomResult = mockDiseases[Math.floor(Math.random() * mockDiseases.length)];
      setResult(randomResult);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveReportAsPDF = () => {
    if (!result) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    let yPos = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setTextColor(22, 163, 74); // Green
    pdf.text('AgriChain - Crop Disease Report', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 15;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Report Date: ${new Date().toLocaleDateString()}`, 20, yPos);
    
    yPos += 10;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(20, yPos, pageWidth - 20, yPos);
    
    // Disease Information
    yPos += 15;
    pdf.setFontSize(16);
    pdf.setTextColor(220, 38, 38);
    pdf.text(`Detected Disease: ${getTranslatedDisease(result.disease)}`, 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setTextColor(0, 0, 0);
    pdf.text(`Confidence Level: ${result.confidence}%`, 20, yPos);
    
    // Treatment
    yPos += 15;
    pdf.setFontSize(14);
    pdf.setTextColor(37, 99, 235);
    pdf.text('Treatment:', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const treatmentLines = pdf.splitTextToSize(getTranslatedTreatment(result.disease, result.treatment), pageWidth - 40);
    pdf.text(treatmentLines, 20, yPos);
    yPos += treatmentLines.length * 7;
    
    // Prevention
    yPos += 10;
    pdf.setFontSize(14);
    pdf.setTextColor(147, 51, 234);
    pdf.text('Prevention:', 20, yPos);
    
    yPos += 10;
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    const preventionLines = pdf.splitTextToSize(getTranslatedPrevention(result.disease, result.prevention), pageWidth - 40);
    pdf.text(preventionLines, 20, yPos);
    
    // Footer
    yPos = pdf.internal.pageSize.getHeight() - 20;
    pdf.setFontSize(10);
    pdf.setTextColor(128, 128, 128);
    pdf.text('Generated by AgriChain - Empowering Farmers with AI', pageWidth / 2, yPos, { align: 'center' });
    
    // Save the PDF
    pdf.save(`crop-disease-report-${Date.now()}.pdf`);
    
    alert('Report saved successfully!');
  };

  const shareViaEmail = () => {
    if (!result) return;
    
    const subject = encodeURIComponent(`Crop Disease Report - ${getTranslatedDisease(result.disease)}`);
    const body = encodeURIComponent(
      `Disease Detected: ${getTranslatedDisease(result.disease)}\n` +
      `Confidence: ${result.confidence}%\n\n` +
      `Treatment:\n${getTranslatedTreatment(result.disease, result.treatment)}\n\n` +
      `Prevention:\n${getTranslatedPrevention(result.disease, result.prevention)}\n\n` +
      `Generated by AgriChain`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    setShowShareModal(false);
  };

  const shareViaWhatsApp = () => {
    if (!result) return;
    
    const message = encodeURIComponent(
      `🌾 *Crop Disease Report*\n\n` +
      `Disease: *${getTranslatedDisease(result.disease)}*\n` +
      `Confidence: ${result.confidence}%\n\n` +
      `💊 *Treatment:*\n${getTranslatedTreatment(result.disease, result.treatment)}\n\n` +
      `🛡️ *Prevention:*\n${getTranslatedPrevention(result.disease, result.prevention)}\n\n` +
      `Generated by AgriChain`
    );
    
    window.open(`https://wa.me/?text=${message}`, '_blank');
    setShowShareModal(false);
  };

  const openDiseaseInfo = (disease: DiseaseInfo) => {
    const translatedDisease = getTranslatedDiseaseInfo(disease);
    setSelectedDisease(translatedDisease);
    setShowDiseaseModal(true);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {t('cropDetectionTitle')}
          </h1>
          <p className="text-xl text-gray-600">
            {t('cropDetectionDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('uploadImage')}</h2>
            
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-4 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-green-500 transition-colors bg-gray-50 hover:bg-green-50"
              >
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-lg text-gray-600 mb-2">{t('clickToUpload')}</p>
                <p className="text-sm text-gray-400">{t('supportFormat')}</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={selectedImage}
                    alt="Uploaded crop"
                    className="w-full h-auto object-cover"
                  />
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setResult(null);
                    }}
                    className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {t('remove')}
                  </button>
                </div>

                <button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-6 h-6 animate-spin" />
                      <span>{t('analyzing')}</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-6 h-6" />
                      <span>{t('analyzeCrop')}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* How it works */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
                {t('howItWorks')}
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• {t('uploadClear')}</li>
                <li>• {t('aiAnalyzes')}</li>
                <li>• {t('instantDiagnosis')}</li>
                <li>• {t('receiveRecommendations')}</li>
                <li>• {t('savePdfShare')}</li>
              </ul>
            </div>
          </div>

          {/* Results Section */}
          <div className="bg-white rounded-2xl shadow-xl p-8" ref={resultRef}>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('analysisResults')}</h2>

            {!result && !isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <Camera className="w-24 h-24 mb-4" />
                <p className="text-lg">{t('uploadAnalyze')}</p>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex flex-col items-center justify-center h-96">
                <Loader className="w-16 h-16 text-green-600 animate-spin mb-4" />
                <p className="text-lg text-gray-600">Analyzing your crop image...</p>
                <p className="text-sm text-gray-400 mt-2">This may take a few seconds</p>
              </div>
            )}

            {result && !isAnalyzing && (
              <div className="space-y-6">
                {/* Disease Name */}
                <div className={`p-6 rounded-xl ${
                  result.disease === 'Healthy Crop' 
                    ? 'bg-green-50 border-2 border-green-500' 
                    : 'bg-red-50 border-2 border-red-500'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-800">{getTranslatedDisease(result.disease)}</h3>
                    {result.disease === 'Healthy Crop' ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600">{t('confidence')}:</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          result.disease === 'Healthy Crop' ? 'bg-green-600' : 'bg-red-600'
                        }`}
                        style={{ width: `${result.confidence}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-800">{result.confidence}%</span>
                  </div>
                </div>

                {/* Treatment */}
                <div className="p-6 bg-blue-50 rounded-xl">
                  <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {t('treatment')}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{getTranslatedTreatment(result.disease, result.treatment)}</p>
                </div>

                {/* Prevention */}
                <div className="p-6 bg-purple-50 rounded-xl">
                  <h4 className="font-bold text-lg text-gray-800 mb-3 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    {t('prevention')}
                  </h4>
                  <p className="text-gray-700 leading-relaxed">{getTranslatedPrevention(result.disease, result.prevention)}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <button 
                    onClick={saveReportAsPDF}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>{t('saveReport')}</span>
                  </button>
                  <button 
                    onClick={() => setShowShareModal(true)}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>{t('shareExpert')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Common Diseases Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('commonDiseases')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {diseaseDatabase.map((disease, index) => (
              <div 
                key={index} 
                onClick={() => openDiseaseInfo(disease)}
                className="group cursor-pointer rounded-xl overflow-hidden border-2 border-gray-200 hover:border-green-500 transition-all hover:shadow-lg"
              >
                <div className="h-40 overflow-hidden bg-gray-100">
                  <img 
                    src={disease.image} 
                    alt={disease.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%2310b981" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" text-anchor="middle" fill="white"%3E' + disease.name + '%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-800 group-hover:text-green-600 transition-colors">{disease.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t('clickLearnMore')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Share Report with Expert</h3>
            
            <div className="space-y-4">
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Mail className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Share via Email</p>
                  <p className="text-sm text-gray-500">Send report to agricultural expert</p>
                </div>
              </button>
              
              <button
                onClick={shareViaWhatsApp}
                className="w-full flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-colors"
              >
                <WhatsApp className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <p className="font-semibold text-gray-800">Share via WhatsApp</p>
                  <p className="text-sm text-gray-500">Send to expert or farming group</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Disease Info Modal */}
      {showDiseaseModal && selectedDisease && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative my-8">
            <button
              onClick={() => setShowDiseaseModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-4">{selectedDisease.name}</h3>
            
            <img 
              src={selectedDisease.image} 
              alt={selectedDisease.name}
              className="w-full h-64 object-cover rounded-xl mb-6"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="800" height="400"%3E%3Crect fill="%2310b981" width="800" height="400"/%3E%3Ctext x="50%25" y="50%25" font-size="40" text-anchor="middle" fill="white"%3E' + selectedDisease.name + '%3C/text%3E%3C/svg%3E';
              }}
            />
            
            <p className="text-gray-700 mb-6 leading-relaxed">{selectedDisease.description}</p>
            
            <div className="mb-6">
              <h4 className="text-xl font-bold text-gray-800 mb-3">Symptoms</h4>
              <ul className="space-y-2">
                {selectedDisease.symptoms.map((symptom, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-red-500 mr-2">•</span>
                    <span className="text-gray-700">{symptom}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-3">Causes</h4>
              <ul className="space-y-2">
                {selectedDisease.causes.map((cause, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    <span className="text-gray-700">{cause}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => setShowDiseaseModal(false)}
              className="mt-6 w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
