import React from 'react';
import { motion } from 'framer-motion';

export default function DecisionSupport() {
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
            <h1 className="text-4xl md:text-5xl font-bold text-white">DECISION SUPPORT</h1>
          </div>
          <p className="text-gray-400 text-lg">Risk Assessment & Guidance</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-navy-800 border border-gold-400 rounded-lg p-12 text-center"
        >
          <p className="text-gray-400 text-xl">Module 3: Operational Decision Support Intelligence</p>
          <p className="text-gray-500 mt-4">Coming Soon - Full implementation in progress</p>
        </motion.div>
      </div>
    </div>
  );
}
