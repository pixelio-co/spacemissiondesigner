'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from '@/components/ui/AppLogo';
import { Menu, X, Rocket, BookOpen, Satellite, Info } from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


const navItems = [
  { label: 'Home', href: '/', icon: Rocket },
  { label: 'Mission Designer', href: '/mission-designer', icon: Satellite },
  { label: 'Learn', href: '/learn', icon: BookOpen },
  { label: 'About', href: '/about', icon: Info },
];

export default function AppNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-card/95 backdrop-blur-md border-b border-border shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <AppLogo size={32} />
              <span className="font-sans font-bold text-sm tracking-wider text-foreground hidden sm:block">
                ꜱᴘᴀᴄᴇ ᴍɪꜱꜱɪᴏɴ ᴅᴇꜱɪɢɴᴇʀ
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={`nav-${item.label}`}
                  href={item.href}
                  className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* CTA + mobile toggle */}
            <div className="flex items-center gap-3">
              <Link
                href="/mission-designer"
                className="btn-primary hidden sm:inline-flex text-xs px-3 py-2"
              >
                <Rocket size={14} />
                Start Mission
              </Link>
              <button
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute top-16 left-0 right-0 bg-card border-b border-border p-4 space-y-1 animate-slideUp">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={`mobile-nav-${item.label}`}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary' :'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-border">
              <Link
                href="/mission-designer"
                className="btn-primary w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                <Rocket size={16} />
                Start New Mission
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}