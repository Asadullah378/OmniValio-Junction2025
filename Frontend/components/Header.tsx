'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bell, Calendar, Globe } from 'lucide-react';
import { motion } from 'framer-motion';

export function Header() {
  const [language, setLanguage] = useState('EN');
  const [hasNotifications] = useState(true);

  const languages = ['FI', 'SV', 'EN'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-glacier-200 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              className="w-12 h-12 bg-gradient-to-br from-valio-500 to-valio-700 rounded-soft-lg flex items-center justify-center text-white font-bold text-xl shadow-soft"
              whileHover={{
                scale: 1.05,
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.2)',
              }}
              whileTap={{ scale: 0.95 }}
            >
              OV
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-glacier-900">
                Omni-Valio
              </h1>
              <p className="text-caption text-glacier-500">
                Intelligent Food Service
              </p>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/" label="Dashboard" />
            <NavLink href="/order" label="Order" />
            <NavLink href="/alerts" label="Alerts" />
            <NavLink href="/claims" label="Claims" />
            <NavLink href="/settings" label="Settings" />
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Delivery Date Selector */}
            <button className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-soft hover:bg-glacier-100 transition-colors">
              <Calendar className="w-4 h-4 text-glacier-600" />
              <span className="text-body-sm text-glacier-700">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 rounded-soft hover:bg-glacier-100 transition-colors">
              <Bell className="w-5 h-5 text-glacier-600" />
              {hasNotifications && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </button>

            {/* Language Toggle */}
            <div className="flex items-center gap-1 px-2 py-1 bg-glacier-100 rounded-soft">
              <Globe className="w-4 h-4 text-glacier-500" />
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-1 rounded text-label font-medium transition-all ${
                    language === lang
                      ? 'bg-white text-valio-700 shadow-sm'
                      : 'text-glacier-600 hover:text-glacier-900'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-body-sm font-medium text-glacier-700 hover:text-valio-700 hover:bg-glacier-50 rounded-soft transition-all"
    >
      {label}
    </Link>
  );
}
