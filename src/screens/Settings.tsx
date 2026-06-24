import React from 'react';
import { motion } from 'framer-motion';

export default function Settings() {
  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gold-400 rounded-full" />
            <h1 className="text-4xl font-bold text-white">Settings</h1>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800 border border-gold-400 rounded-lg p-12 text-center"
        >
          <p className="text-gray-400 text-xl">Settings Screen</p>
          <p className="text-gray-500 mt-4">Coming Soon</p>
        </motion.div>
      </div>
    </div>
  );
}
