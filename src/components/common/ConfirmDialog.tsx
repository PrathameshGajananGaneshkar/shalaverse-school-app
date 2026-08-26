import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from './Modal';
import { useLanguage } from '../../context/LanguageContext';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  isDestructive = true,
  isLoading = false
}: ConfirmDialogProps) {
  const { t } = useLanguage();

  const finalTitle = title || t('areYouSure');
  const finalMessage = message || t('deleteWarning');
  const finalConfirmLabel = confirmLabel || (isDestructive ? t('delete') : t('confirm'));
  const finalCancelLabel = cancelLabel || t('cancel');

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={finalTitle} maxWidth="md">
      <div className="flex flex-col items-center text-center p-2">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isDestructive ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
          {isDestructive ? <AlertTriangle className="w-8 h-8" /> : <Trash2 className="w-8 h-8" />}
        </div>
        
        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
          {finalMessage}
        </p>

        <div className="flex items-center gap-3 w-full justify-end pt-4 border-t border-slate-100">
          <button
            type="button"
            id="btn-confirm-cancel"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition"
          >
            {finalCancelLabel}
          </button>
          <button
            type="button"
            id="btn-confirm-proceed"
            onClick={() => {
              onConfirm();
            }}
            disabled={isLoading}
            className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium text-sm transition flex items-center justify-center gap-2 ${
              isDestructive 
                ? 'bg-red-600 hover:bg-red-700 shadow-xs' 
                : 'bg-blue-700 hover:bg-blue-800 shadow-xs'
            } disabled:opacity-50`}
          >
            {isLoading ? 'Processing...' : finalConfirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
