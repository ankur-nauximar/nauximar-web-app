import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, AlertCircle, Zap, Users } from 'lucide-react';
import { fetchFromAirtable } from '../api/airtable';

export default function HomePage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    formsProcessed: 0,
    decisionsLogged: 0,
    activeAlerts: 0,
    vesselsRegistered: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Fetch data from Airtable tables
        const vessels = await fetchFromAirtable('VESSELS');
        const forms = await fetchFromAirtable('FORMS_COMPLETED');
        const alerts = await fetchFromAirtable('ALERTS');

        setStats({
          formsProcessed: forms.length,
          decisionsLogged: forms.filter((f: any) => f.fields['Officer Review Status'] === 'Approved').length,
          activeAlerts: alerts.filter((a: any) => a.fields['Status'] === 'Unread').length,
          vesselsRegistered: vessels.length,
        });
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

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
            <h1 className="text-4xl md:text-5xl font-bold text-white">Home Dashboard</h1>
          </div>
          <p className="text-gray-400 text-lg">Welcome back, Chief Officer</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <StatCard
            icon={<TrendingUp className="text-gold-400" size={24} />}
            label="Forms Processed"
            value={stats.formsProcessed}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={<Zap className="text-gold-400" size={24} />}
            label="Decisions Logged"
            value={stats.decisionsLogged}
            color="from-green-500 to-green-600"
          />
          <StatCard
            icon={<AlertCircle className="text-gold-400" size={24} />}
            label="Active Alerts"
            value={stats.activeAlerts}
            color="from-orange-500 to-orange-600"
          />
          <StatCard
            icon={<Users className="text-gold-400" size={24} />}
            label="Vessels Registered"
            value={stats.vesselsRegistered}
            color="from-purple-500 to-purple-600"
          />
        </motion.div>

        {/* Module Cards */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Available Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ModuleCard
              icon="🔧"
              title="SPARE PARTS FINDER"
              description="Identify & Source Equipment"
              features={[
                "Photo recognition",
                "Manual search",
                "Global suppliers",
                "Confidence scoring"
              ]}
              onClick={() => navigate('/spare-parts')}
            />
            <ModuleCard
              icon="📋"
              title="PORT OPERATIONS"
              description="Forms & Compliance"
              features={[
                "Auto-fill forms",
                "Agent management",
                "Document tracking",
                "Compliance audit"
              ]}
              onClick={() => navigate('/port-operations')}
            />
            <ModuleCard
              icon="⚙️"
              title="DECISION SUPPORT"
              description="Risk Assessment & Guidance"
              features={[
                "Operational intelligence",
                "Regulatory guidance",
                "Approval hierarchy",
                "Audit trails"
              ]}
              onClick={() => navigate('/decision-support')}
            />
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          variants={item}
          className="bg-navy-800 border border-gold-400 rounded-lg p-6 shadow-card"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          <div className="space-y-4">
            <ActivityItem
              timestamp="2 hours ago"
              title="Port Documentation Completed"
              description="Singapore port form filled and approved"
              status="completed"
            />
            <ActivityItem
              timestamp="1 day ago"
              title="Spare Parts Identified"
              description="Pump mechanical seal sourced from 3 suppliers"
              status="success"
            />
            <ActivityItem
              timestamp="2 days ago"
              title="Decision Logged"
              description="Cargo discharge assessment with Master approval"
              status="approved"
            />
          </div>
          <button className="text-gold-400 hover:text-gold-300 mt-6 font-semibold">
            View All Activity →
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(0, 0, 0, 0.4)' }}
      className={`bg-gradient-to-br ${color} opacity-10 hover:opacity-15 border border-gold-400 rounded-lg p-6 transition-all cursor-pointer`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="text-3xl font-bold text-white">{value}</div>
        {icon}
      </div>
      <p className="text-gray-400 text-sm font-semibold">{label}</p>
    </motion.div>
  );
}

interface ModuleCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  onClick: () => void;
}

function ModuleCard({ icon, title, description, features, onClick }: ModuleCardProps) {
  return (
    <motion.div
      whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(255, 215, 0, 0.2)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-navy-800 border-l-4 border-gold-400 rounded-lg p-6 shadow-card hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gold-400 text-sm font-semibold mb-4">{description}</p>
      
      <ul className="space-y-2 mb-6">
        {features.map((feature, idx) => (
          <li key={idx} className="text-gray-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-gold-400 rounded-full" />
            {feature}
          </li>
        ))}
      </ul>

      <motion.button
        whileHover={{ color: '#FFD700' }}
        className="text-white font-semibold text-sm hover:text-gold-400 transition-colors"
      >
        Enter Module →
      </motion.button>
    </motion.div>
  );
}

interface ActivityItemProps {
  timestamp: string;
  title: string;
  description: string;
  status: 'completed' | 'success' | 'approved';
}

function ActivityItem({ timestamp, title, description, status }: ActivityItemProps) {
  const statusColors = {
    completed: 'bg-blue-500/20 text-blue-400',
    success: 'bg-green-500/20 text-green-400',
    approved: 'bg-gold-400/20 text-gold-400',
  };

  return (
    <motion.div
      whileHover={{ x: 5 }}
      className="flex items-start gap-4 p-4 bg-navy-700 rounded-lg hover:bg-navy-600 transition-colors border border-navy-600 hover:border-gold-400"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h4 className="font-semibold text-white">{title}</h4>
          <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-2">{description}</p>
        <p className="text-gray-500 text-xs">{timestamp}</p>
      </div>
    </motion.div>
  );
}
