import { useState, useEffect } from 'react';
import { CloudOff, ExternalLink, X, RefreshCw, Database } from 'lucide-react';
import { 
  isFirestoreQuotaExceeded, 
  resetQuotaExceeded, 
  getFirestoreUpgradeUrl 
} from '../../utils/firestoreQuota';
import { useLanguage } from '../../context/LanguageContext';

export function FirestoreQuotaBanner() {
  const { language } = useLanguage();
  const [isExceeded, setIsExceeded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    setIsExceeded(isFirestoreQuotaExceeded());

    const handleQuotaEvent = (e: any) => {
      setIsExceeded(Boolean(e.detail?.exceeded));
      if (e.detail?.exceeded) {
        setIsDismissed(false);
      }
    };

    window.addEventListener('shalaverse-quota-changed', handleQuotaEvent);
    return () => window.removeEventListener('shalaverse-quota-changed', handleQuotaEvent);
  }, []);

  if (!isExceeded || isDismissed) {
    return null;
  }

  const handleRetry = async () => {
    setIsChecking(true);
    resetQuotaExceeded();
    setTimeout(() => {
      setIsChecking(false);
      setIsExceeded(isFirestoreQuotaExceeded());
    }, 800);
  };

  const upgradeUrl = getFirestoreUpgradeUrl();

  return (
    <div 
      id="firestore-quota-alert" 
      className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-amber-900 text-xs sm:text-sm font-medium transition-all"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-2.5 flex-1">
          <div className="p-1 bg-amber-100 text-amber-700 rounded shrink-0 mt-0.5 sm:mt-0">
            <CloudOff className="w-4 h-4" />
          </div>
          <div className="leading-snug">
            {language === 'mr' ? (
              <>
                <strong className="font-semibold text-amber-950">क्लाउड मोफत कोटा मर्यादा (Daily Limit Reached):</strong>{' '}
                आजचा मोफत क्लाउड कोटा संपला आहे. तुमचा ॲप सुरक्षितपणे <strong>स्थानिक मेमरी (Local IndexedDB)</strong> मध्ये सुरू आहे. 
                विद्यार्थी नोंदणी, बदल, डिलीट, सर्च आणि प्रिंट पूर्णपणे चालू आहेत.
              </>
            ) : (
              <>
                <strong className="font-semibold text-amber-950">Cloud Daily Free Quota Reached:</strong>{' '}
                Free cloud write units for today are exhausted. The application is running seamlessly in <strong>Local Storage (IndexedDB)</strong> mode.
                All student registrations, editing, search, and printing continue to work normally.
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <a
            id="btn-upgrade-firestore"
            href={upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded font-semibold text-xs shadow-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {language === 'mr' ? 'कोटा वाढवा (Upgrade)' : 'Upgrade Quota'}
          </a>

          <button
            type="button"
            id="btn-retry-quota"
            onClick={handleRetry}
            disabled={isChecking}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-semibold transition"
            title="पुन्हा तपासा"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {language === 'mr' ? 'तपासा' : 'Retry'}
          </button>

          <button
            type="button"
            id="btn-dismiss-quota"
            onClick={() => setIsDismissed(true)}
            className="p-1 hover:bg-amber-200/60 rounded text-amber-800 transition"
            title="बंद करा"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
