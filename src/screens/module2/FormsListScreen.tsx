import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Filter } from 'lucide-react';
import { fetchFromAirtable, TABLES } from '../../api/airtable';

interface FormsListScreenProps {
  onBack: () => void;
  onSelectForm: (form: any) => void;
}

export default function FormsListScreen({ onBack, onSelectForm }: FormsListScreenProps) {
  const [forms, setForms] = useState<any[]>([]);
  const [filteredForms, setFilteredForms] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadForms = async () => {
      try {
        const data = await fetchFromAirtable(TABLES.FORMS_RECEIVED);
        setForms(data);
        filterForms(data, 'all');
      } catch (err) {
        setError('Failed to load forms');
      } finally {
        setLoading(false);
      }
    };
    loadForms();
  }, []);

  const filterForms = (formsData: any[], filterType: string) => {
    let filtered = formsData;

    if (filterType === 'pending') {
      filtered = formsData.filter(f => f.fields['Processing Status'] === 'Received');
    } else if (filterType === 'processing') {
      filtered = formsData.filter(f => f.fields['Processing Status'] === 'Processing');
    } else if (filterType === 'completed') {
      filtered = formsData.filter(f => f.fields['Processing Status'] === 'Completed');
    }

    setFilteredForms(filtered);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    filterForms(forms, newFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Received': return 'bg-blue-500/20 text-blue-400';
      case 'Processing': return 'bg-yellow-500/20 text-yellow-400';
      case 'Completed': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="pt-24 pb-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.button
          whileHover={{ x: -5 }}
          onClick={onBack}
          className="flex items-center gap-2 text-gold-400 hover:text-gold-300 mb-8"
        >
          <ArrowLeft size={20} />
          Back to Port Operations
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-1 w-12 bg-gold-400 rounded-full" />
            <h1 className="text-4xl font-bold text-white">Your Forms</h1>
          </div>
          <p className="text-gray-400">Total forms: {forms.length}</p>
        </motion.div>

        {/* Filter Tabs */}
        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending Review' },
            { value: 'processing', label: 'Processing' },
            { value: 'completed', label: 'Completed' },
          ].map(({ value, label }) => (
            <motion.button
              key={value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleFilterChange(value)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                filter === value
                  ? 'bg-gold-400 text-navy-900 shadow-gold'
                  : 'bg-navy-800 text-gold-400 border border-gold-400 hover:bg-navy-700'
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block"
            >
              <div className="w-8 h-8 border-4 border-gold-400 border-t-transparent rounded-full" />
            </motion.div>
            <p className="text-gray-400 mt-4">Loading forms...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-maritime-red/20 border border-maritime-red rounded-lg p-4 text-maritime-red mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Forms List */}
        {!loading && filteredForms.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-navy-800 border border-gold-400 rounded-lg p-12 text-center"
          >
            <p className="text-gray-400 text-lg mb-4">No forms found</p>
            <p className="text-gray-500">Upload a form to get started</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredForms.map((form, idx) => (
              <motion.div
                key={form.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)' }}
                onClick={() => onSelectForm(form)}
                className="bg-navy-800 border border-gold-400 rounded-lg p-6 shadow-card hover:shadow-lg cursor-pointer transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg mb-2">
                      {form.fields['Form Name']}
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                      <span>📍 {form.fields['Country']}</span>
                      <span>🚢 {form.fields['Vessel Name']?.join(', ')}</span>
                      <span>👤 {form.fields['Agent Name']}</span>
                      <span>📅 {new Date(form.fields['Received Date']).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-4 py-2 rounded-lg text-sm font-semibold ${getStatusColor(form.fields['Processing Status'])}`}>
                      {form.fields['Processing Status']}
                    </span>
                    <motion.div
                      whileHover={{ x: 5 }}
                      className="text-gold-400"
                    >
                      →
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
