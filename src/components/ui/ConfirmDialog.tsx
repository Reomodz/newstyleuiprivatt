import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  icon?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  description,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBox: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          confirmBtn: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30',
          defaultIcon: <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />,
        };
      case 'info':
        return {
          iconBox: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
          confirmBtn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30',
          defaultIcon: <Info className="w-4 h-4 sm:w-5 sm:h-5" />,
        };
      case 'danger':
      default:
        return {
          iconBox: 'bg-red-500/10 border-red-500/20 text-red-400',
          confirmBtn: 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30',
          defaultIcon: <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />,
        };
    }
  };

  const { iconBox, confirmBtn, defaultIcon } = getVariantStyles();

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm p-3 sm:p-4 flex justify-center items-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#1E1E20] border border-[#3A3A3E] rounded-2xl sm:rounded-3xl p-4 sm:p-6 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 sm:gap-4 animate-in zoom-in-95 duration-200 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`p-2 sm:p-2.5 border rounded-xl sm:rounded-2xl shrink-0 ${iconBox}`}>
              {icon || defaultIcon}
            </div>
            <div className="flex flex-col min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-[#E2E2E4] truncate">{title}</h3>
              {subtitle && (
                <p className="text-[10px] sm:text-xs text-[#8E8E93] truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#8E8E93] hover:text-white rounded-lg hover:bg-[#2A2A2E] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[11px] sm:text-xs text-[#A0A0A5] leading-relaxed bg-[#141416] p-2.5 sm:p-3 rounded-xl border border-[#2D2D30]">
          {description}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 sm:py-2 text-xs font-semibold text-[#8E8E93] hover:text-white bg-[#262629] hover:bg-[#323236] rounded-xl transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-1.5 sm:py-2 text-xs font-bold rounded-xl shadow-md transition-colors ${confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
