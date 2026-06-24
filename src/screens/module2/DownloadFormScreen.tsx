import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Mail } from 'lucide-react';

interface DownloadFormScreenProps {
  form: any;
  onBack: () => void;
}

export default function DownloadFormScreen({ form, onBack }: DownloadFormScreenProps) {
  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-8"
        >
          <ArrowLeft size={20} />
          Back
        </motion.button>

        <div className="bg-navy-800 border border-gold-400 rounded-lg p-8">
          <h1 className="text-3xl font-bold text-white mb-6">{form.fields['Form Name']}</h1>
          
          <div className="space-y-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-gold-400 text-navy-900 font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:shadow-gold"
            >
              <Download size={20} />
              Download PDF
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-blue-500/20 text-blue-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-blue-500/50"
            >
              <Mail size={20} />
              Email to Agent
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-purple-500/20 text-purple-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2 border border-purple-500/50"
            >
              <Mail size={20} />
              Email to Master
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="w-full border-2 border-gold-400 text-gold-400 font-bold py-3 rounded-lg"
          >
            Back
          </motion.button>
        </div>
      </div>
    </div>
  );
}
