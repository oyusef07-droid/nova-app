import { useState, useCallback, useRef, useEffect } from "react";
import { Music, UploadCloud, FileAudio, AlertTriangle, CheckCircle, Loader2, Download } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";
import { API_BASE_URL } from "../../config";

export default function ConverterPage() {
  const { t, lang, toggleLang, isRTL } = useLang();
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [downloadData, setDownloadData] = useState(null);
  const [isOnline, setIsOnline] = useState(true);
  const fileInputRef = useRef(null);

  const handleReset = useCallback(() => {
    if (downloadData?.id) {
      fetch(`/api/download-temp?id=${downloadData.id}`, { method: 'DELETE' }).catch(() => {});
    }
    setFile(null);
    setSuccess(false);
    setError(null);
    setDownloadData(null);
    setProgress(0);
  }, [downloadData]);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (downloadData?.id) {
        fetch(`${API_BASE_URL}/api/download-temp?id=${downloadData.id}`, { method: 'DELETE', keepalive: true }).catch(() => {});
      }
    };
  }, [downloadData]);

  const MAX_FILE_SIZE = 40 * 1024 * 1024; // 40MB

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (selectedFile) => {
    setError(null);
    setSuccess(false);
    
    if (!selectedFile) return false;
    
    if (!selectedFile.type.startsWith('video/')) {
      setError(lang === 'ar' ? 'يرجى اختيار ملف فيديو صالح.' : 'Please select a valid video file.');
      return false;
    }
    
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(lang === 'ar' ? 'حجم الملف يتجاوز الحد الأقصى (40 ميجابايت).' : 'File size exceeds maximum limit (40MB).');
      return false;
    }
    
    return true;
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  }, [lang]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    if (!isOnline) {
      setError(lang === 'ar' ? 'يرجى الاتصال بالإنترنت أولاً' : 'Please connect to the internet first');
      return;
    }
    
    setUploading(true);
    setIsConverting(true);
    setError(null);
    setSuccess(false);
    setProgress(10); // Start progress
    
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      // Simulate progress for UI feel
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10) + 5;
        });
      }, 800);

      const response = await fetch(`${API_BASE_URL}/api/convert`, {
        method: "POST",
        body: formData,
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || (lang === 'ar' ? 'فشل التحويل.' : 'Conversion failed.'));
      }
      
      const data = await response.json();
      
      setDownloadData({ 
        url: `${API_BASE_URL}/api/download-temp?id=${data.downloadId}&filename=${encodeURIComponent(data.filename)}`, 
        filename: data.filename,
        id: data.downloadId
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConverting(false);
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <div className="flex-grow pt-24 pb-12 sm:pt-32 sm:pb-20 relative z-10 px-4 sm:px-6 lg:px-8">
        
        {!isOnline && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 w-[90%] max-w-sm">
            <div className="bg-red-500/95 backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-[0_8px_30px_rgb(239,68,68,0.3)] flex items-center justify-between border border-red-400/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-white" />
                </div>
                <div>
                  <h4 className="font-bold text-base mb-0.5">{lang === 'ar' ? 'أنت غير متصل بالإنترنت!' : 'You are offline!'}</h4>
                  <p className="text-sm text-red-50 opacity-90">{lang === 'ar' ? 'يرجى الاتصال للتحويل' : 'Please connect to convert'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl w-full mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 justify-center mb-6">
              <Music size={24} />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
              {lang === 'ar' ? 'محول الفيديو إلى صوت (MP3)' : 'Video to MP3 Converter'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {lang === 'ar' ? 'ارفع أي فيديو من جهازك وسنقوم باستخراج الصوت منه بجودة عالية مجاناً.' : 'Upload any video from your device and we will extract the audio in high quality for free.'}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              
              {success && downloadData ? (
                <div className="flex flex-col items-center justify-center min-h-[250px] py-8">
                  <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center mb-6 shadow-sm border border-green-100 dark:border-green-900/50">
                    <CheckCircle size={40} />
                  </div>
                  
                  <div className="text-center mb-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      {lang === 'ar' ? 'تم استخراج الصوت بنجاح!' : 'Audio extracted successfully!'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {downloadData.filename}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors order-2 sm:order-1"
                    >
                      {lang === 'ar' ? 'تحويل ملف آخر' : 'Convert Another'}
                    </button>
                    <a
                      href={downloadData.url}
                      download={downloadData.filename}
                      className="flex-[2] py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 order-1 sm:order-2"
                    >
                      <Download size={18} />
                      {lang === 'ar' ? 'تحميل MP3' : 'Download MP3'}
                    </a>
                  </div>
                </div>
              ) : !file ? (
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[250px]
                    ${isDragging 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600 hover:bg-gray-50 dark:hover:bg-gray-900/50'
                    }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploading && fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    accept="video/*" 
                    className="hidden" 
                    disabled={uploading || !isOnline}
                  />
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-500 dark:text-gray-400">
                    <UploadCloud size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {lang === 'ar' ? 'اسحب وأفلت الفيديو هنا' : 'Drag & drop video here'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {lang === 'ar' ? 'أو اضغط لاختيار ملف من جهازك' : 'Or click to select a file from your device'}
                  </p>
                  
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full">
                    <AlertTriangle size={12} className="text-orange-500" />
                    <span>{lang === 'ar' ? 'الحد الأقصى: 40 ميجابايت' : 'Maximum size: 40MB'}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[250px] py-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center mb-6 shadow-sm border border-primary-100 dark:border-primary-900/50">
                    <FileAudio size={40} />
                  </div>
                  
                  <div className="max-w-xs w-full text-center mb-8">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate px-4" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  {isConverting ? (
                    <div className="w-full max-w-md">
                      <div className="flex justify-between text-sm mb-2 text-gray-700 dark:text-gray-300">
                        <span>{lang === 'ar' ? 'جاري استخراج الصوت...' : 'Extracting audio...'}</span>
                        <span className="font-medium">{progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="bg-primary-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4 animate-pulse">
                        {lang === 'ar' ? 'يرجى الانتظار، قد يستغرق هذا بضع ثوانٍ.' : 'Please wait, this might take a few seconds.'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-3 w-full max-w-sm">
                      <button
                        onClick={() => setFile(null)}
                        className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                      <button
                        onClick={handleConvert}
                        disabled={uploading || !isOnline}
                        className={`flex-[2] py-3 px-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-lg shadow-primary-600/20 transition-all flex items-center justify-center gap-2 ${(uploading || !isOnline) ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}`}
                      >
                        <Music size={18} />
                        {lang === 'ar' ? 'تحويل إلى MP3' : 'Convert to MP3'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Status Messages */}
              {error && (
                <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/50 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>

      <Footer t={t} />
    </>
  );
}
