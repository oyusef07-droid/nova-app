import { useState, useEffect, useRef } from "react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useLang } from "../../utils/useLang";
import { MessageSquare, Plus, Clock, CheckCircle, Send, LogIn, Mail, RefreshCw, Mic, Image as ImageIcon, Trash2, StopCircle, Star, AlertTriangle } from "lucide-react";

export default function ContactUs() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [view, setView] = useState("list"); // 'list', 'new', 'chat'
  
  // Form states
  const [subject, setSubject] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Media & Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const recordingTimer = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Modals
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [ticketToRate, setTicketToRate] = useState(null);

  useEffect(() => {
    fetchSession();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTickets();
    }
  }, [session]);

  useEffect(() => {
    if (view === "chat" && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, view, activeTicket]);

  useEffect(() => {
    if (isRecording) {
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(recordingTimer.current);
    }
    return () => clearInterval(recordingTimer.current);
  }, [isRecording]);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        setSession(Object.keys(data).length > 0 ? data : null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
        setMessages(data.messages || []);
        
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          const ticketId = params.get("ticket_id");
          if (ticketId && data.tickets) {
            const ticketToOpen = data.tickets.find(t => t.id.toString() === ticketId);
            if (ticketToOpen) {
              setActiveTicket(ticketToOpen);
              setView("chat");
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  const handleNewTicketClick = () => {
    const hasOpenTicket = tickets.some(t => t.status === 'open' || t.status === 'answered');
    if (hasOpenTicket) {
      setShowReplaceModal(true);
    } else {
      setView("new");
    }
  };

  const confirmNewTicket = async () => {
    setShowReplaceModal(false);
    const openTicket = tickets.find(t => t.status === 'open' || t.status === 'answered');
    if (openTicket) {
      try {
        await fetch("/api/tickets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "close_ticket", ticket_id: openTicket.id })
        });
        await fetchTickets(); // Refresh
      } catch (e) {
        console.error(e);
      }
    }
    setView("new");
  };

  const submitNewTicket = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "new_ticket", subject, message: messageText })
      });
      if (res.ok) {
        const data = await res.json();
        setTickets([data.ticket, ...tickets]);
        setMessages([...messages, ...data.messages]);
        setActiveTicket(data.ticket);
        setView("chat");
        setMessageText("");
        setSubject("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      mediaRecorder.current = media;
      audioChunks.current = [];
      setRecordingTime(0);
      
      media.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      media.onstop = () => {
        const mime = mediaRecorder.current?.mimeType || 'audio/webm';
        const blob = new Blob(audioChunks.current, { type: mime });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      media.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied", err);
      alert(isRTL ? "يرجى السماح بالوصول للميكروفون" : "Please allow microphone access");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  };

  const uploadMedia = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("ticket_id", activeTicket.id);
    
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  };

  const submitReply = async (e, quickText = null) => {
    if (e) e.preventDefault();
    const textToSend = quickText || messageText;
    if (!textToSend.trim() && !audioBlob && !imageFile) return;
    
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      let mediaUrl = null;
      let mediaType = null;

      if (audioBlob) {
        const mime = audioBlob.type || 'audio/webm';
        const ext = mime.includes('mp4') ? 'mp4' : mime.includes('webm') ? 'webm' : 'mp3';
        const file = new File([audioBlob], `audio-${Date.now()}.${ext}`, { type: mime });
        mediaUrl = await uploadMedia(file);
        mediaType = 'audio';
      } else if (imageFile) {
        mediaUrl = await uploadMedia(imageFile);
        mediaType = 'image';
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reply", 
          ticket_id: activeTicket.id, 
          message: textToSend,
          media_url: mediaUrl,
          media_type: mediaType
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setMessageText("");
        setAudioBlob(null);
        setImageFile(null);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || (isRTL ? 'حدث خطأ' : 'An error occurred'));
      }
    } catch (e) {
      console.error(e);
      setErrorMsg(isRTL ? 'حدث خطأ في الإرسال' : 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert(isRTL ? "يرجى اختيار صورة فقط" : "Please select an image only");
        return;
      }
      setImageFile(file);
      setAudioBlob(null); // Clear audio if image selected
    }
  };

  const submitRating = async () => {
    if (rating === 0) return;
    try {
      await fetch("/api/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket_id: ticketToRate.id, rating, comment: ratingComment })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setShowRatingModal(false);
      setRating(0);
      setRatingComment("");
      setTicketToRate(null);
    }
  };

  const activeTicketMessages = messages.filter(m => m.ticket_id === activeTicket?.id);
  const last3 = activeTicketMessages.slice(-3);
  const userConsecutive = last3.filter(m => m.sender_type === 'user').length;
  const isLimitReached = last3.length === 3 && userConsecutive === 3;
  // Initially, there's 1 user msg and 1 admin bot msg, so length is 2.
  const isFirstMessage = activeTicketMessages.length === 2 && activeTicketMessages[1].sender_type === 'admin';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans relative">
      <Header t={t} lang={lang} toggleLang={toggleLang} />
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8 relative z-0">
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col">
          <div className="bg-primary-600 px-8 py-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">
              {isRTL ? 'الدعم الفني والتذاكر' : 'Support & Tickets'}
            </h1>
            <p className="text-primary-100 max-w-xl mx-auto">
              {isRTL 
                ? 'نحن هنا لمساعدتك. تتبع رسائلك وردود الإدارة بسهولة من مكان واحد.' 
                : 'We are here to help. Track your messages and our replies easily from one place.'}
            </p>
          </div>
          
          <div className="flex-1 p-4 sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : !session ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-20 h-20 bg-primary-50 rounded-full flex items-center justify-center mb-6">
                  <Mail className="w-10 h-10 text-primary-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  {isRTL ? 'قم بتسجيل الدخول للتواصل معنا' : 'Login to contact us'}
                </h2>
                <button onClick={handleLogin} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-medium transition-all">
                  <LogIn className="w-5 h-5" />
                  {isRTL ? 'تسجيل الدخول بحساب جوجل' : 'Login with Google'}
                </button>
              </div>
            ) : view === "list" ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isRTL ? 'تذاكري' : 'My Tickets'}
                  </h2>
                  <button onClick={handleNewTicketClick} className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-600 px-4 py-2 rounded-lg font-medium transition-all">
                    <Plus className="w-4 h-4" />
                    {isRTL ? 'تذكرة جديدة' : 'New Ticket'}
                  </button>
                </div>

                {tickets.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                    <p className="text-gray-500 dark:text-gray-400">{isRTL ? 'لا يوجد لديك تذاكر سابقة.' : 'You have no previous tickets.'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map(ticket => (
                      <div key={ticket.id} onClick={() => { setActiveTicket(ticket); setView("chat"); }} className="cursor-pointer border border-gray-100 dark:border-gray-800 hover:border-primary-200 hover:shadow-sm rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between transition-all gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{ticket.subject}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex justify-start">
                          {ticket.status === 'open' && <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">{isRTL ? 'قيد الانتظار' : 'Pending'}</span>}
                          {ticket.status === 'answered' && <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">{isRTL ? 'تم الرد' : 'Answered'}</span>}
                          {ticket.status === 'closed' && <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 text-xs font-medium rounded-full">{isRTL ? 'مغلقة' : 'Closed'}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : view === "new" ? (
              <form onSubmit={submitNewTicket} className="max-w-2xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <button type="button" onClick={() => setView("list")} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    {isRTL ? '← رجوع' : '← Back'}
                  </button>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{isRTL ? 'فتح تذكرة جديدة' : 'Open New Ticket'}</h2>
                </div>
                
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{isRTL ? 'عنوان المشكلة' : 'Subject'}</label>
                    <input type="text" required value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-transparent text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{isRTL ? 'نوع التذكرة (التفاصيل)' : 'Ticket Type (Details)'}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {['مراسلة الإدارة', 'مشكلة فنية', 'استفسار عام'].map(opt => (
                        <button 
                          key={opt}
                          type="button"
                          onClick={() => setMessageText(opt)}
                          className={`p-3 rounded-xl border text-sm font-bold transition-all flex items-center justify-center ${messageText === opt ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-sm dark:bg-primary-900/30 dark:border-primary-500 dark:text-primary-300' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-gray-800/50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                    {/* Hidden input to ensure required validation passes if using standard form submit */}
                    <input type="hidden" required value={messageText} onChange={() => {}} />
                  </div>
                  <button type="submit" disabled={isSubmitting || !messageText} className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-400 text-white py-3 rounded-xl font-medium transition-colors">
                    {isSubmitting ? (isRTL ? 'جاري الإرسال...' : 'Sending...') : (isRTL ? 'إرسال التذكرة' : 'Submit Ticket')}
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col h-full bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => {setView("list"); setActiveTicket(null);}} className="text-gray-500 hover:text-gray-900 dark:hover:text-white flex-shrink-0">
                      {isRTL ? '← عودة' : '← Back'}
                    </button>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">{activeTicket.subject}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchTickets} disabled={loading} className="text-gray-500 hover:text-primary-600 flex items-center gap-1.5 text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <RefreshCw className={`w-4 h-4 ${isSubmitting || loading ? 'animate-spin' : ''}`} />
                    </button>
                    {activeTicket.status === 'closed' ? (
                      <button onClick={() => {setTicketToRate(activeTicket); setShowRatingModal(true);}} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 hover:bg-yellow-100 hover:text-yellow-700 transition-colors">
                        <Star className="w-3 h-3" />
                        {isRTL ? 'تقييم الدعم' : 'Rate Support'}
                      </button>
                    ) : (
                      <button 
                        onClick={async () => {
                          try {
                            await fetch("/api/tickets", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "close_ticket", ticket_id: activeTicket.id })
                            });
                            setActiveTicket({...activeTicket, status: 'closed'});
                            setTickets(tickets.map(t => t.id === activeTicket.id ? {...t, status: 'closed'} : t));
                            setTicketToRate(activeTicket);
                            setShowRatingModal(true);
                          } catch (e) { console.error(e); }
                        }}
                        className="bg-red-50 text-red-600 text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1 hover:bg-red-100 transition-colors font-medium"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {isRTL ? 'إنهاء المحادثة' : 'End Chat'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 p-2 min-h-[400px]">
                  {activeTicketMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender_type === 'user' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                      <div className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${msg.sender_type === 'user' ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none'}`}>
                        {msg.media_type === 'image' && (
                          <img src={msg.media_url} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer" onClick={() => window.open(msg.media_url, '_blank')} />
                        )}
                        {msg.media_type === 'audio' && (
                          <audio controls src={msg.media_url} className="max-w-full h-10 mb-2"></audio>
                        )}
                        {msg.message && <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">{msg.message}</p>}
                        <p className={`text-[10px] mt-2 ${msg.sender_type === 'user' ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <div ref={messagesEndRef} />
                </div>

                {activeTicket.status !== 'closed' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {errorMsg && <p className="text-red-500 text-xs mb-2 text-center bg-red-50 py-1 rounded">{errorMsg}</p>}
                    
                    {/* Media Preview Area */}
                    {(imageFile || audioBlob || isRecording) && (
                      <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl flex items-center justify-between border border-gray-200 dark:border-gray-700">
                        {isRecording ? (
                          <div className="flex items-center gap-3 text-red-500 animate-pulse">
                            <Mic className="w-5 h-5" />
                            <span className="font-medium text-sm">{isRTL ? 'جاري التسجيل...' : 'Recording...'} (00:{recordingTime.toString().padStart(2, '0')})</span>
                          </div>
                        ) : imageFile ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <ImageIcon className="w-5 h-5 text-primary-500" />
                            <span className="truncate max-w-[150px]">{imageFile.name}</span>
                          </div>
                        ) : audioBlob ? (
                          <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                            <Mic className="w-5 h-5 text-primary-500" />
                            <span>{isRTL ? 'تسجيل صوتي جاهز' : 'Audio ready'}</span>
                            <audio controls src={URL.createObjectURL(audioBlob)} className="h-8 w-40 ml-2"></audio>
                          </div>
                        ) : null}
                        
                        <div className="flex gap-2">
                          {isRecording ? (
                            <button onClick={stopRecording} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                              <StopCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <>
                              <button onClick={() => { setImageFile(null); setAudioBlob(null); }} className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                                <Trash2 className="w-5 h-5" />
                              </button>
                              <button onClick={() => submitReply()} disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2">
                                {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:rotate-180" />}
                                {isRTL ? 'إرسال' : 'Send'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    <form onSubmit={(e) => submitReply(e)} className="flex gap-2 items-center relative">
                      <input 
                        type="text" 
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        disabled={isLimitReached || isSubmitting || isRecording}
                        placeholder={isLimitReached ? (isRTL ? 'يرجى انتظار رد الإدارة' : 'Please wait for reply') : (isRTL ? 'اكتب ردك هنا...' : 'Type your reply...')}
                        className={`flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-transparent text-gray-900 dark:text-white ${isLimitReached ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''}`}
                      />
                      
                      {!isLimitReached && !imageFile && !audioBlob && !isRecording && (
                        <div className="flex gap-1 absolute ltr:right-16 rtl:left-16">
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
                          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="صورة">
                            <ImageIcon className="w-5 h-5" />
                          </button>
                          <button type="button" onClick={startRecording} className="p-2 text-gray-400 hover:text-primary-500 transition-colors" title="تسجيل صوتي">
                            <Mic className="w-5 h-5" />
                          </button>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={isSubmitting || isLimitReached || isRecording || (!messageText.trim() && !audioBlob && !imageFile)}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:bg-gray-400 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Send className="w-5 h-5 rtl:rotate-180" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Warning Modal */}
      {showReplaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'تنبيه: إغلاق المحادثة الحالية' : 'Warning: Close Current Ticket'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isRTL 
                ? 'لديك محادثة مفتوحة حالياً. فتح محادثة جديدة سيؤدي إلى إغلاق المحادثة الحالية نهائياً ولن تتمكن من الرد فيها مجدداً. هل توافق؟' 
                : 'You have an open ticket. Opening a new one will permanently close the current one. Proceed?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowReplaceModal(false)} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {isRTL ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={confirmNewTicket} className="flex-1 py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors">
                {isRTL ? 'نعم، إغلاق وفتح جديد' : 'Yes, Close & Open New'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && ticketToRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-800 text-center animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'تقييم خدمة الدعم الفني' : 'Rate our Support'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {isRTL ? 'ما مدى رضاك عن مستوى الخدمة المقدمة في هذه التذكرة؟' : 'How satisfied are you with the support provided?'}
            </p>
            <div className="flex justify-center gap-2 mb-6 rtl:flex-row-reverse">
              {[5,4,3,2,1].map(star => (
                <button 
                  key={star} 
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star className={`w-10 h-10 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-700'} transition-colors`} />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <textarea 
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder={isRTL ? 'أضف تعليقاً (اختياري)...' : 'Add a comment (optional)...'}
                className="w-full px-4 py-3 mb-6 rounded-xl border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-transparent text-sm resize-none"
                rows="3"
              />
            )}
            <div className="flex gap-3">
              <button onClick={() => {setShowRatingModal(false); setRating(0);}} className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                {isRTL ? 'تخطي' : 'Skip'}
              </button>
              <button onClick={submitRating} disabled={rating === 0} className="flex-1 py-3 px-4 bg-yellow-500 disabled:opacity-50 text-white rounded-xl font-medium hover:bg-yellow-600 transition-colors">
                {isRTL ? 'إرسال التقييم' : 'Submit Rating'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer t={t} />
    </div>
  );
}
