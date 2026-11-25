'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  headerIcon?: React.ReactNode;
  hideHeader?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  headerIcon,
  hideHeader = false,
}) => {
  const [mounted, setMounted] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync open/close states and lock body scroll smoothly
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      setIsClosing(false);
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    } else if (shouldRender) {
      setIsClosing(true);
      const timer = setTimeout(() => {
        setShouldRender(false);
        setIsClosing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, shouldRender]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isClosing, onClose]);

  if (!mounted || !shouldRender) return null;

  const modalContent = (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center p-4 transition-all',
        isClosing ? 'pointer-events-none' : 'pointer-events-auto'
      )}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop with pure GPU-accelerated opacity (Zero flicker) */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-xs transform-gpu transition-opacity duration-150 ease-out',
          isClosing ? 'opacity-0' : 'opacity-100 animate-in fade-in'
        )}
      />

      {/* Dialog Container with pure GPU hardware acceleration */}
      <div
        className={cn(
          'relative w-full max-w-lg max-h-[90vh] overflow-y-auto card-elevated p-6 shadow-2xl z-10 transform-gpu transition-all duration-150 ease-out bg-surface-elevated/95',
          isClosing
            ? 'opacity-0 scale-95 translate-y-2'
            : 'opacity-100 scale-100 translate-y-0 animate-in fade-in zoom-in-95 duration-150',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!hideHeader && (title || description || headerIcon) && (
          <div className="flex items-start justify-between mb-3.5 gap-2.5">
            <div className="flex items-start gap-2.5 min-w-0">
              {headerIcon && (
                <div className="p-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent shrink-0 mt-0.5">
                  {headerIcon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="text-base font-semibold text-foreground tracking-tight truncate">{title}</h3>
                )}
                {description && (
                  <p className="text-[11px] text-foreground-secondary mt-0.5 truncate">{description}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-foreground-muted hover:text-foreground hover:bg-surface-subtle p-1 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
