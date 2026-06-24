import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface ReviewFormScreenProps {
  form: any;
  onBack: () => void;
  onDownload: (form: any) => void;
}

export default function ReviewFormScreen({ form, onBack, onDownload }: ReviewFormScreenProps) {
  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Forms
        </motion.button>

        <div className="bg-navy-800 border border-gold-400 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-6">{form.fields['Form Name']}</h1>
          <p className="text-gray-400">Review form content here</p>
          
          <div className="mt-8 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onDownload(form)}
              className="bg-gold-400 text-navy-900 font-bold px-6 py-3 rounded-lg"
            >
              Proceed to Download
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBack}
              className="border-2 border-gold-400 text-gold-400 font-bold px-6 py-3 rounded-lg"
            >
              Back
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
