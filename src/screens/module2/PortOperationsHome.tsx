import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, List, FileText, Send } from 'lucide-react';
import UploadFormScreen from './UploadFormScreen';
import FormsListScreen from './FormsListScreen';
import ReviewFormScreen from './ReviewFormScreen';
import DownloadFormScreen from './DownloadFormScreen';

type ScreenType = 'home' | 'upload' | 'list' | 'review' | 'download';

export default function PortOperations() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('home');
  const [selectedForm, setSelectedForm] = useState<any>(null);

  const handleSelectForm = (form: any) => {
    setSelectedForm(form);
    setCurrentScreen('review');
  };

  const handleBackToList = () => {
    setSelectedForm(null);
    setCurrentScreen('list');
  };

  const handleDownload = (form: any) => {
    setSelectedForm(form);
    setCurrentScreen('download');
  };

  // Route to appropriate screen
  if (currentScreen === 'upload') {
    return (
      <UploadFormScreen 
        onBack={() => setCurrentScreen('home')} 
        onSuccess={() => setCurrentScreen('list')}
      />
    );
  }

  if (currentScreen === 'list') {
    return (
      <FormsListScreen 
        onBack={() => setCurrentScreen('home')}
        onSelectForm={handleSelectForm}
      />
    );
  }

  if (currentScreen === 'review' && selectedForm) {
    return (
      <ReviewFormScreen 
        form={selectedForm}
        onBack={handleBackToList}
        onDownload={handleDownload}
      />
    );
  }

  if (currentScreen === 'download' && selectedForm) {
    return (
      <DownloadFormScreen 
        form={selectedForm}
        onBack={handleBackToList}
      />
    );
  }

  // Home screen
  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gold-400 rounded-full" />
            <h1 className="text-4xl md:text-5xl font-bold text-white">PORT OPERATIONS</h1>
          </div>
          <p className="text-gray-400 text-lg">Forms & Compliance</p>
        </motion.div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <QuickActionCard
            icon={<Upload size={32} className="text-gold-400" />}
            title="Upload Form"
            description="Submit a blank port form"
            onClick={() => setCurrentScreen('upload')}
            color="from-blue-500 to-blue-600"
          />
          <QuickActionCard
            icon={<List size={32} className="text-gold-400" />}
            title="My Forms"
            description="View all received forms"
            onClick={() => setCurrentScreen('list')}
            color="from-green-500 to-green-600"
          />
          <QuickActionCard
            icon={<FileText size={32} className="text-gold-400" />}
            title="Pending Review"
            description="Forms awaiting approval"
            onClick={() => setCurrentScreen('list')}
            color="from-orange-500 to-orange-600"
          />
          <QuickActionCard
            icon={<Send size={32} className="text-gold-400" />}
            title="Submissions"
            description="Completed & sent forms"
            onClick={() => setCurrentScreen('list')}
            color="from-purple-500 to-purple-600"
          />
        </div>

        {/* Information Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <InfoCard
            title="How It Works"
            items={[
              "1. Upload blank port form",
              "2. System auto-fills with vessel data",
              "3. Review and approve",
              "4. Download or email to agent",
              "5. Complete audit trail maintained"
            ]}
          />
          <InfoCard
            title="Key Features"
            items={[
              "✓ AI-powered form analysis",
              "✓ Auto-fill from certificate vault",
              "✓ Multi-language support",
              "✓ Agent email management",
              "✓ Complete compliance tracking"
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  color: string;
}

function QuickActionCard({ icon, title, description, onClick, color }: QuickActionCardProps) {
  return (
    <motion.button
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`bg-gradient-to-br ${color} opacity-10 hover:opacity-15 border border-gold-400 rounded-lg p-6 shadow-card hover:shadow-lg transition-all text-left`}
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.button>
  );
}

interface InfoCardProps {
  title: string;
  items: string[];
}

function InfoCard({ title, items }: InfoCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-navy-800 border border-gold-400 rounded-lg p-6 shadow-card"
    >
      <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="text-gray-300 text-sm flex items-start gap-3">
            <span className="text-gold-400 font-bold flex-shrink-0">{idx + 1}.</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
