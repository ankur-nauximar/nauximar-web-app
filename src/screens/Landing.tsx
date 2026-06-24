import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Three.js Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x001f3f, 0.1);
    mountRef.current.appendChild(renderer.domElement);

    camera.position.z = 5;

    // Create animated particles (wave effect)
    const particlesGeometry = new THREE.BufferGeometry();
    const particleCount = 500;
    const posArray = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 10;
      posArray[i + 1] = (Math.random() - 0.5) * 10;
      posArray[i + 2] = (Math.random() - 0.5) * 10;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.05,
      color: 0xffd700,
      transparent: true,
      opacity: 0.5,
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      particles.rotation.x += 0.0001;
      particles.rotation.y += 0.0002;

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gradient-navy">
      {/* Three.js Background */}
      <div ref={mountRef} className="absolute inset-0" />

      {/* Content Overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Logo */}
          <motion.div
            className="flex justify-center mb-8"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-24 h-24 bg-gradient-gold rounded-2xl flex items-center justify-center shadow-gold">
              <span className="text-navy-900 font-bold text-5xl">⚓</span>
            </div>
          </motion.div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4">
            NAUXIMAR
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-gold-400 mb-2">
            Maritime Intelligence. AI Engineered.
          </p>

          <div className="w-24 h-1 bg-gradient-gold mx-auto mb-8 rounded-full" />

          {/* Description */}
          <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Empower your crew with AI-driven operational intelligence. Transform shipboard decision-making with global maritime knowledge, real-time risk assessment, and complete audit trails.
          </p>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
            <FeatureCard
              icon="🔧"
              title="Spare Parts Intelligence"
              description="Identify and source equipment instantly"
            />
            <FeatureCard
              icon="📋"
              title="Port Automation"
              description="Auto-fill documentation forms"
            />
            <FeatureCard
              icon="⚙️"
              title="Decision Support"
              description="Operational guidance with audit trails"
            />
          </div>

          {/* CTA Button */}
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={onEnter}
            className="px-12 py-4 bg-gradient-gold text-navy-900 font-bold text-lg rounded-lg shadow-lg hover:shadow-gold transition-all"
          >
            Enter Platform
          </motion.button>

          {/* Attribution */}
          <div className="mt-16 text-sm text-gray-400">
            <p>Powered by Claude · Anthropic</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom accent line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold-400 to-transparent"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-6 bg-navy-800 border border-gold-400 rounded-lg backdrop-blur-xs hover:shadow-gold transition-all"
    >
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-white font-bold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </motion.div>
  );
}
