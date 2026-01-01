import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { InstallPWA } from './components/InstallPWA';
import { HomePage } from './pages/HomePage';
import { CropDiseaseDetection } from './pages/CropDiseaseDetection';
import { SupplyChain } from './pages/SupplyChain';
import { GovtSchemes } from './pages/GovtSchemes';
import { Marketplace } from './pages/Marketplace';
import { Login } from './pages/Login';
import { FarmerDashboard } from './pages/FarmerDashboard';
import { ConsumerDashboard } from './pages/ConsumerDashboard';
import { Chat } from './pages/Chat';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <InstallPWA />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/crop-detection" element={<CropDiseaseDetection />} />
          <Route path="/supply-chain" element={<SupplyChain />} />
          <Route path="/govt-schemes" element={<GovtSchemes />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          <Route path="/consumer-dashboard" element={<ConsumerDashboard />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
