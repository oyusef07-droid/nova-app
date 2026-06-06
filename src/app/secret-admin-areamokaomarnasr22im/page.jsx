import { useState, useEffect } from "react";
import { useLang } from "../../utils/useLang";
import { Shield, Send, Clock, Search, LogOut, Menu, Trash2, RotateCcw, Ban, CheckCircle, X, Inbox, MessageSquareText, ArchiveX, RefreshCw, Star, Moon, Sun, Globe, Eye, EyeOff, BarChart3, Users, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

export default function RealAdminTickets() {
  const { t, isRTL, lang, toggleLang } = useLang();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("light");
  
  const [tickets, setTickets] = useState([]);
  const [messages, setMessages] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalVisits: 0, todayVisits: 0, monthVisits: 0, activeUsers: 0 });
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);
  
  // Main tabs: 'messages', 'ratings', 'visits'
  const [mainTab, setMainTab] = useState('messages');
  // Sub-tabs for messages: 'open', 'answered', 'closed'
  const [ticketSubTab, setTicketSubTab] = useState('open');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("app-theme") || "light";
      setTheme(savedTheme);
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("app-theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const fetchTicketsAndRatings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        headers: { "Authorization": `Bearer ${password}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets);
        setMessages(data.messages);
        setIsAuthenticated(true);
      } else if (res.status === 401) {
        if (!isAuthenticated) alert(isRTL ? "كلمة المرور غير صحيحة" : "Incorrect password");
        setLoading(false);
        return;
      }

      const resRatings = await fetch("/api/ratings", {
        headers: { "Authorization": `Bearer ${password}` }
      });
      if (resRatings.ok) {
        const rData = await resRatings.json();
        setRatings(rData.ratings || []);
      }

      const resStats = await fetch("/api/admin/stats", {
        headers: { "Authorization": `Bearer ${password}` }
      });
      if (resStats.ok) {
        const sData = await resStats.json();
        setStats(sData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const login = async (e) => {
    if (e) e.preventDefault();
    await fetchTicketsAndRatings();
  };

  const deleteRating = async (id = null) => {
    if (!confirm(isRTL ? "هل أنت متأكد من حذف التقييم؟" : "Delete rating?")) return;
    try {
      const res = await fetch("/api/ratings", {
        method: "DELETE",
        headers: { 
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(id ? { id } : { action: "delete_all" })
      });
      if (res.ok) {
        if (id) {
          setRatings(ratings.filter(r => r.id !== id));
        } else {
          setRatings([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const resetAllData = async () => {
    const confirm1 = confirm(isRTL ? "هل أنت متأكد من تصفير كافة بيانات الموقع؟ (سيتم حذف السجل، التذاكر، الزيارات، التقييمات نهائياً)" : "Are you sure you want to reset all site data?");
    if (!confirm1) return;
    const confirm2 = confirm(isRTL ? "تحذير أخير: هذا الإجراء لا يمكن التراجع عنه. متأكد؟" : "Final warning: This action cannot be undone. Are you sure?");
    if (!confirm2) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/reset", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${password}` }
      });
      if (res.ok) {
        alert(isRTL ? "تم تصفير البيانات بنجاح." : "Data has been reset successfully.");
        setTickets([]);
        setMessages([]);
        setRatings([]);
        setStats({ totalVisits: 0, todayVisits: 0, monthVisits: 0, activeUsers: 0 });
      } else {
        alert(isRTL ? "حدث خطأ أثناء التصفير." : "Error resetting data.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const submitReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ action: "reply", ticket_id: activeTicket.id, message: replyText })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages([...messages, data.message]);
        setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status: 'answered' } : t));
        setActiveTicket({ ...activeTicket, status: 'answered' });
        setReplyText("");
        setTicketSubTab('answered');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const changeTicketStatus = async (statusAction) => {
    if (!confirm(isRTL ? "هل أنت متأكد من هذا الإجراء؟" : "Are you sure you want to perform this action?")) return;
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ action: statusAction, ticket_id: activeTicket.id })
      });
      if (res.ok) {
        const newStatus = statusAction === 'close' ? 'closed' : 'open';
        setTickets(tickets.map(t => t.id === activeTicket.id ? { ...t, status: newStatus } : t));
        setActiveTicket({ ...activeTicket, status: newStatus });
        setTicketSubTab(newStatus);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleBanUser = async () => {
    const isCurrentlyBanned = activeTicket.is_banned;
    const confirmMsg = isCurrentlyBanned 
      ? (isRTL ? "هل أنت متأكد من فك الحظر عن هذا المستخدم؟" : "Are you sure you want to unban this user?")
      : (isRTL ? "هل أنت متأكد من حظر هذا المستخدم نهائياً؟" : "Are you sure you want to ban this user permanently?");
      
    if (!confirm(confirmMsg)) return;
    
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ action: "ban_user", user_email: activeTicket.user_email, is_banned: !isCurrentlyBanned })
      });
      if (res.ok) {
        setTickets(tickets.map(t => t.user_email === activeTicket.user_email ? { ...t, is_banned: !isCurrentlyBanned } : t));
        setActiveTicket({ ...activeTicket, is_banned: !isCurrentlyBanned });
        alert(isRTL ? "تم تحديث حالة الحظر بنجاح!" : "Ban status updated successfully!");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteTickets = async (deleteType, singleTicketId = null) => {
    const targetIds = singleTicketId ? [singleTicketId] : selectedTickets;
    if (targetIds.length === 0) return;

    try {
      const res = await fetch("/api/admin/tickets", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${password}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify(singleTicketId 
          ? { action: "delete", ticket_id: singleTicketId, deleteType }
          : { action: "bulk_delete", ticket_ids: targetIds, deleteType }
        )
      });
      if (res.ok) {
        setTickets(tickets.filter(t => !targetIds.includes(t.id)));
        if (targetIds.includes(activeTicket?.id)) {
          setActiveTicket(null);
        }
        setSelectedTickets([]);
        setShowDeleteModal(false);
        setTicketToDelete(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSelectTicket = (id) => {
    setSelectedTickets(prev => prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]);
  };

  const handleTicketClick = async (ticket) => {
    setActiveTicket(ticket);
    setIsMobileMenuOpen(false);
    
    if (ticket.admin_unread_count > 0) {
      try {
        await fetch("/api/admin/tickets", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${password}`,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({ action: "mark_read", ticket_id: ticket.id })
        });
        setTickets(tickets.map(t => t.id === ticket.id ? { ...t, admin_unread_count: 0 } : t));
        setActiveTicket({ ...ticket, admin_unread_count: 0 });
      } catch (e) {
        console.error(e);
      }
    }
  };
  
  const toggleSelectAll = () => {
    if (selectedTickets.length === filteredTickets.length) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(filteredTickets.map(t => t.id));
    }
  };

  // ─── Login Screen ───
  if (!isAuthenticated) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans relative">
        <div className="absolute top-4 rtl:left-4 ltr:right-4 flex items-center gap-2">
          <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
          <button onClick={toggleLang} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center gap-1 transition-colors text-sm font-medium">
            <Globe className="w-5 h-5" />
            <span>{lang === "en" ? "عربي" : "EN"}</span>
          </button>
        </div>
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md text-center">
            <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <img src={theme === "dark" ? "/logo-yellow.png" : "/logo-purple.png?v=2"} alt="Logo" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isRTL ? 'لوحة تحكم الإدارة' : 'Admin Panel'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">
              {isRTL ? 'يرجى إدخال كلمة سر الإدارة' : 'Please enter admin password'}
            </p>
            <form onSubmit={login}>
              <div className="relative mb-4">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="********"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 text-center transition-colors"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white py-3 rounded-xl font-medium"
              >
                {loading ? '...' : (isRTL ? 'دخول' : 'Login')}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open');
  const tabFilteredTickets = tickets.filter(t => t.status === ticketSubTab);
  const filteredTickets = tabFilteredTickets.filter(t => 
    t.subject.toLowerCase().includes(search.toLowerCase()) || 
    (t.user_email && t.user_email.toLowerCase().includes(search.toLowerCase())) ||
    (t.user_name && t.user_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalUnread = tickets.reduce((sum, t) => sum + (t.admin_unread_count || 0), 0);

  // ─── Main App ───
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-sans overflow-hidden">
      {/* ─── Header ─── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 z-20 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <img src={theme === "dark" ? "/logo-yellow.png" : "/logo-purple.png?v=2"} alt="Logo" className="w-8 h-8 rounded-lg object-contain hidden sm:block" />
          <span className="font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
            {isRTL ? "لوحة الإدارة" : "Admin Panel"}
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={fetchTicketsAndRatings} 
            disabled={loading}
            className="text-gray-500 dark:text-gray-400 hover:text-primary-600 flex items-center gap-2 text-sm font-medium transition-colors p-2 sm:p-0 rounded-lg hover:bg-gray-50 sm:hover:bg-transparent dark:hover:bg-gray-800 sm:dark:hover:bg-transparent"
            title={isRTL ? 'تحديث البيانات' : 'Refresh Data'}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-500' : ''}`} />
            <span className="hidden sm:inline">{isRTL ? 'تحديث' : 'Refresh'}</span>
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>
          <button onClick={() => {setIsAuthenticated(false); setPassword("");}} className="text-gray-500 dark:text-gray-400 hover:text-red-600 flex items-center gap-2 text-sm font-medium p-2 sm:p-0 rounded-lg hover:bg-gray-50 sm:hover:bg-transparent dark:hover:bg-gray-800 sm:dark:hover:bg-transparent">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{isRTL ? 'خروج' : 'Logout'}</span>
          </button>
        </div>
      </header>

      {/* ─── Main Tabs ─── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-2 sm:px-6 lg:px-8 flex-shrink-0">
        <div className="grid grid-cols-3 max-w-[1400px] mx-auto">
          <button
            onClick={() => { setMainTab('messages'); setActiveTicket(null); }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors relative ${mainTab === 'messages' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <MessageSquareText className="w-4 h-4 shrink-0" />
            <span>{isRTL ? 'الرسائل' : 'Messages'}</span>
            {totalUnread > 0 && (
              <span className="bg-red-500 text-white text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full">{totalUnread}</span>
            )}
          </button>
          <button
            onClick={() => { setMainTab('ratings'); setActiveTicket(null); }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${mainTab === 'ratings' ? 'border-yellow-500 text-yellow-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <Star className="w-4 h-4 shrink-0" />
            <span>{isRTL ? 'التقييمات' : 'Ratings'}</span>
            {ratings.length > 0 && (
              <span className="bg-yellow-100 text-yellow-700 text-[9px] sm:text-[10px] font-bold px-1 sm:px-1.5 py-0.5 rounded-full">{ratings.length}</span>
            )}
          </button>
          <button
            onClick={() => { setMainTab('visits'); setActiveTicket(null); }}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors ${mainTab === 'visits' ? 'border-green-500 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>{isRTL ? 'الزيارات' : 'Visits'}</span>
          </button>
        </div>
      </div>

      {/* ─── Content ─── */}
      <main className="flex-1 w-full max-w-[1400px] mx-auto p-0 md:p-4 lg:p-6 flex h-[calc(100vh-120px)] relative">
        
        {/* ═══════════════ TAB 1: MESSAGES ═══════════════ */}
        {mainTab === 'messages' && (
          <>
            {isMobileMenuOpen && (
              <div className="md:hidden fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
            )}

            {/* Sidebar */}
            <div className={`${isMobileMenuOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')} md:translate-x-0 transition-transform duration-300 ease-in-out fixed md:relative top-0 bottom-0 md:top-auto md:bottom-auto rtl:right-0 ltr:left-0 z-50 md:z-10 w-[85vw] max-w-[320px] md:w-1/3 md:max-w-[400px] h-full bg-white dark:bg-gray-900 md:rounded-2xl shadow-2xl md:shadow-sm border-r md:border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col`}>
              
              <div className="md:hidden p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950">
                <span className="font-bold text-gray-900 dark:text-white">{isRTL ? 'قائمة المحادثات' : 'Conversations'}</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-500 p-1 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                {/* Ticket Sub-Tabs */}
                <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-950 p-1 rounded-xl mb-4 text-[10px] sm:text-xs font-medium">
                  <button onClick={() => {setTicketSubTab('open'); setActiveTicket(null);}} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${ticketSubTab === 'open' ? 'bg-white dark:bg-gray-800 shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <Inbox className="w-4 h-4" />
                    {isRTL ? 'جديدة' : 'New'}
                    <span className="bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded-full text-[9px] ml-1">
                      {openTickets.length}
                    </span>
                  </button>
                  <button onClick={() => {setTicketSubTab('answered'); setActiveTicket(null);}} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${ticketSubTab === 'answered' ? 'bg-white dark:bg-gray-800 shadow-sm text-green-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <MessageSquareText className="w-4 h-4" />
                    {isRTL ? 'مفتوحة' : 'Open'}
                  </button>
                  <button onClick={() => {setTicketSubTab('closed'); setActiveTicket(null);}} className={`flex items-center justify-center gap-1.5 py-2 rounded-lg transition-all ${ticketSubTab === 'closed' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    <ArchiveX className="w-4 h-4" />
                    {isRTL ? 'مغلقة' : 'Closed'}
                  </button>
                </div>

                <div className="relative mb-3">
                  <Search className="w-4 h-4 absolute top-3 rtl:right-3 ltr:left-3 text-gray-400 dark:text-gray-500" />
                  <input 
                    type="text" 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={isRTL ? "ابحث عن تذكرة..." : "Search tickets..."}
                    className="w-full bg-gray-50 dark:bg-gray-950 border-none rounded-xl py-2 px-10 focus:ring-2 focus:ring-primary-100 outline-none text-sm"
                  />
                </div>
                
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-600 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={selectedTickets.length === filteredTickets.length && filteredTickets.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    {isRTL ? 'تحديد الكل' : 'Select All'}
                  </label>
                  
                  {selectedTickets.length > 0 && (
                    <button 
                      onClick={() => { setTicketToDelete(null); setShowDeleteModal(true); }}
                      className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 font-medium bg-red-50 px-2 py-1 rounded transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      {isRTL ? `حذف (${selectedTickets.length})` : `Delete (${selectedTickets.length})`}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50 dark:bg-gray-950/50">
                {filteredTickets.map(ticket => (
                  <div 
                    key={ticket.id}
                    className={`p-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer transition-colors flex gap-3 ${activeTicket?.id === ticket.id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-600 dark:border-l-primary-500' : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <div className="pt-1 shrink-0">
                      <input 
                        type="checkbox" 
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={() => toggleSelectTicket(ticket.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0" onClick={() => handleTicketClick(ticket)}>
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-medium text-sm text-gray-900 dark:text-white truncate pr-2">{ticket.subject}</h3>
                        <div className="flex items-center gap-1.5 shrink-0 mt-1">
                          {ticket.admin_unread_count > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                              {ticket.admin_unread_count}
                            </span>
                          )}
                          {ticket.status === 'open' && <span className="w-2 h-2 rounded-full bg-primary-500 shadow-sm shadow-primary-500/50"></span>}
                          {ticket.status === 'answered' && <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>}
                          {ticket.status === 'closed' && <span className="w-2 h-2 rounded-full bg-gray-400"></span>}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ticket.user_name || ticket.user_email || ticket.user_id} 
                        {ticket.is_banned && <span className="text-red-500 ml-1 font-bold text-[10px]">({isRTL ? 'محظور' : 'Banned'})</span>}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400 text-sm flex flex-col items-center">
                    <Inbox className="w-10 h-10 mb-3 opacity-20" />
                    {isRTL ? 'لا توجد تذاكر في هذا القسم' : 'No tickets in this section'}
                  </div>
                )}
              </div>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 h-full flex flex-col w-full md:ml-6 md:rtl:mr-6 md:rtl:ml-0 bg-white dark:bg-gray-900 md:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
              {activeTicket ? (
                <div className="flex flex-col h-full">
                  {/* Chat Header */}
                  <div className="p-3 sm:p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0 pr-4">
                          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 break-words">{activeTicket.subject}</h2>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className={`px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold border ${activeTicket.status === 'open' ? 'bg-primary-50 border-primary-200 text-primary-700' : activeTicket.status === 'answered' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}>
                              {isRTL ? 'الحالة:' : 'Status:'} <span className="uppercase ml-1">{activeTicket.status === 'open' ? (isRTL ? 'جديدة' : 'NEW') : activeTicket.status === 'answered' ? (isRTL ? 'تم الرد' : 'ANSWERED') : (isRTL ? 'مغلقة' : 'CLOSED')}</span>
                            </div>
                            {activeTicket.is_banned && (
                              <div className="px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-bold border bg-red-50 border-red-200 text-red-600">
                                {isRTL ? 'المستخدم محظور نهائياً' : 'USER IS BANNED'}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <button onClick={toggleBanUser} title={isRTL ? 'حظر/فك حظر' : 'Ban/Unban'} className={`p-2 rounded-lg transition-colors flex items-center justify-center ${activeTicket.is_banned ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}>
                              <Ban className="w-4 h-4" />
                              <span className="hidden lg:inline ml-1 text-xs font-medium">{activeTicket.is_banned ? (isRTL ? 'فك الحظر' : 'Unban') : (isRTL ? 'حظر' : 'Ban')}</span>
                            </button>
                            
                            {activeTicket.status === 'closed' ? (
                              <button onClick={() => changeTicketStatus('reopen')} title={isRTL ? 'إعادة فتح' : 'Reopen'} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center">
                                <RotateCcw className="w-4 h-4" />
                                <span className="hidden lg:inline ml-1 text-xs font-medium">{isRTL ? 'فتح' : 'Reopen'}</span>
                              </button>
                            ) : (
                              <button onClick={() => changeTicketStatus('close')} title={isRTL ? 'إغلاق المحادثة' : 'Close Ticket'} className="p-2 bg-yellow-50 text-yellow-600 hover:bg-yellow-100 rounded-lg transition-colors flex items-center justify-center">
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden lg:inline ml-1 text-xs font-medium">{isRTL ? 'إغلاق' : 'Close'}</span>
                              </button>
                            )}
                            
                            <button onClick={() => { setTicketToDelete(activeTicket.id); setShowDeleteModal(true); }} title={isRTL ? 'حذف' : 'Delete'} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center">
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden lg:inline ml-1 text-xs font-medium">{isRTL ? 'حذف' : 'Delete'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-950 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-col">
                          <span className="text-gray-400 dark:text-gray-500 mb-0.5">{isRTL ? 'الاسم' : 'Name'}</span>
                          <span className="font-medium text-gray-900 dark:text-white truncate">{activeTicket.user_name || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 dark:text-gray-500 mb-0.5">{isRTL ? 'الإيميل' : 'Email'}</span>
                          <span className="font-medium text-gray-900 dark:text-white truncate" title={activeTicket.user_email || activeTicket.user_id}>{activeTicket.user_email || activeTicket.user_id}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 dark:text-gray-500 mb-0.5">{isRTL ? 'الدولة والنوع' : 'Country/Gender'}</span>
                          <span className="font-medium text-gray-900 dark:text-white truncate capitalize">{activeTicket.country || 'N/A'} - {activeTicket.gender || 'N/A'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-400 dark:text-gray-500 mb-0.5">{isRTL ? 'تاريخ التسجيل' : 'Registered'}</span>
                          <span className="font-medium text-gray-900 dark:text-white truncate">{activeTicket.user_created_at ? new Date(activeTicket.user_created_at).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-gray-50/50 dark:bg-gray-950/30">
                    {messages.filter(m => m.ticket_id === activeTicket.id).map(msg => (
                      <div key={msg.id} className={`flex ${msg.sender_type === 'admin' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}>
                        <div className={`max-w-[90%] sm:max-w-[75%] lg:max-w-[65%] rounded-2xl px-4 sm:px-5 py-3 sm:py-4 shadow-sm ${msg.sender_type === 'admin' ? 'bg-primary-600 text-white rounded-tr-none rtl:rounded-tr-2xl rtl:rounded-tl-none' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none rtl:rounded-tl-2xl rtl:rounded-tr-none'}`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[11px] sm:text-xs font-bold ${msg.sender_type === 'admin' ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'}`}>
                              {msg.sender_type === 'admin' ? (isRTL ? 'الدعم الفني' : 'Admin Support') : (activeTicket.user_name || 'User')}
                            </span>
                          </div>
                          
                          {msg.media_type === 'image' && (
                            <img src={msg.media_url} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer" onClick={() => window.open(msg.media_url, '_blank')} />
                          )}
                          {msg.media_type === 'audio' && (
                            <audio controls src={msg.media_url} className="max-w-full h-10 mb-2"></audio>
                          )}
                          {msg.message && <p className="whitespace-pre-wrap leading-relaxed text-[13px] sm:text-sm">{msg.message}</p>}
                          
                          <p className={`text-[9px] sm:text-[10px] mt-2 sm:mt-3 text-right ${msg.sender_type === 'admin' ? 'text-primary-200' : 'text-gray-400 dark:text-gray-500'}`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply Box */}
                  {activeTicket.status !== 'closed' ? (
                    <form onSubmit={submitReply} className="shrink-0 p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-2 sm:gap-3 items-end">
                      <div className="flex-1 bg-gray-50 dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500 transition-all p-1 sm:p-2">
                        <textarea 
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder={isRTL ? 'اكتب ردك للمستخدم هنا...' : 'Type your reply to the user...'}
                          className="w-full bg-transparent border-none focus:outline-none resize-none min-h-[44px] max-h-[150px] p-2 text-[13px] sm:text-sm"
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={loading || !replyText.trim()}
                        className="bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white h-[44px] sm:h-12 w-[44px] sm:w-auto sm:px-6 rounded-xl flex items-center justify-center transition-colors font-medium gap-2 shadow-sm shrink-0"
                      >
                        <span className="hidden sm:inline">{isRTL ? 'إرسال' : 'Send'}</span>
                        <Send className="w-5 h-5 sm:w-4 sm:h-4 rtl:-scale-x-100" />
                      </button>
                    </form>
                  ) : (
                    <div className="shrink-0 p-4 bg-gray-50 dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
                      {isRTL ? 'هذه المحادثة مغلقة، اضغط إعادة فتح للرد مجدداً.' : 'This ticket is closed. Reopen it to reply.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-8 text-center bg-gray-50/30 dark:bg-gray-950/30">
                  <Shield className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-sm sm:text-base">{isRTL ? 'اختر محادثة من القائمة لعرضها' : 'Select a ticket from the sidebar to view'}</p>
                  <button 
                    className="md:hidden mt-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
                    onClick={() => setIsMobileMenuOpen(true)}
                  >
                    <Menu className="w-4 h-4" />
                    {isRTL ? 'فتح قائمة التذاكر' : 'Open Tickets Menu'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═══════════════ TAB 2: RATINGS ═══════════════ */}
        {mainTab === 'ratings' && (
          <div className="w-full bg-white dark:bg-gray-900 md:rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col h-full">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="text-yellow-500 w-6 h-6" />
                {isRTL ? 'التقييمات' : 'Ratings'}
                <span className="text-sm font-normal text-gray-400 dark:text-gray-500">({ratings.length})</span>
              </h2>
              {ratings.length > 0 && (
                <button onClick={() => deleteRating()} className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                  <Trash2 className="w-4 h-4" />
                  {isRTL ? 'حذف الكل' : 'Delete All'}
                </button>
              )}
            </div>
            <div className="p-4 sm:p-6 grid gap-4 overflow-y-auto flex-1">
              {ratings.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  {isRTL ? 'لا يوجد تقييمات حتى الآن' : 'No ratings yet'}
                </div>
              ) : (
                ratings.map(r => (
                  <div key={r.id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
                    <div>
                      <div className="flex items-center gap-1 mb-2 rtl:flex-row-reverse rtl:justify-end">
                        {[5,4,3,2,1].map(star => (
                          <Star key={star} className={`w-4 h-4 ${r.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{r.ticket_subject || (isRTL ? 'تذكرة محذوفة' : 'Deleted Ticket')}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2 italic">"{r.comment || (isRTL ? 'بدون تعليق' : 'No comment')}"</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {isRTL ? 'بواسطة:' : 'By:'} {r.user_name || r.user_email} • {new Date(r.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button onClick={() => deleteRating(r.id)} className="bg-white dark:bg-gray-900 text-red-500 border border-gray-200 dark:border-gray-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 self-start sm:self-center transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ═══════════════ TAB 3: VISITS / STATS ═══════════════ */}
        {mainTab === 'visits' && (
          <div className="w-full overflow-y-auto h-full p-4 md:p-0">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{isRTL ? 'الزيارات الإجمالية' : 'Total Visits'}</span>
                  <div className="w-10 h-10 bg-primary-50 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalVisits.toLocaleString()}</h3>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{isRTL ? 'زيارات هذا الشهر' : 'Month Visits'}</span>
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.monthVisits.toLocaleString()}</h3>
              </div>
              
              <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">{isRTL ? 'زيارات اليوم' : 'Today Visits'}</span>
                  <div className="w-10 h-10 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{stats.todayVisits.toLocaleString()}</h3>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-5 rounded-2xl shadow-sm border border-green-100 dark:border-green-800/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-green-700 dark:text-green-400 text-xs font-medium">{isRTL ? 'نشطين الآن' : 'Active Now'}</span>
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-800/50 rounded-xl flex items-center justify-center relative">
                    <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-green-50 dark:border-green-900/20"></div>
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-green-800 dark:text-green-300">{stats.activeUsers}</h3>
              </div>
            </div>

            {/* Reset Data Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                {isRTL ? 'منطقة الخطر' : 'Danger Zone'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {isRTL 
                  ? 'تصفير البيانات سيحذف جميع التذاكر، الرسائل، التقييمات، سجل الزيارات نهائياً. هذا الإجراء لا يمكن التراجع عنه.'
                  : 'Resetting data will permanently delete all tickets, messages, ratings, and visit logs. This action cannot be undone.'
                }
              </p>
              <button
                onClick={resetAllData}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                {loading ? '...' : (isRTL ? 'تصفير جميع البيانات' : 'Reset All Data')}
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100 dark:border-gray-800 transform transition-all">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-950/50">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                {isRTL ? 'خيارات الحذف' : 'Delete Options'}
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600 bg-white dark:bg-gray-800 rounded-full p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <p className="text-[13px] sm:text-sm text-gray-600 dark:text-gray-400 mb-5 text-center leading-relaxed font-medium">
                {ticketToDelete 
                  ? (isRTL ? 'اختر طريقة الحذف المفضلة لهذه المحادثة:' : 'Choose a deletion method for this ticket:')
                  : (isRTL ? `اختر طريقة الحذف المفضلة لـ ${selectedTickets.length} محادثات:` : `Choose a deletion method for ${selectedTickets.length} tickets:`)
                }
              </p>
              
              <button 
                onClick={() => deleteTickets('admin', ticketToDelete)}
                className="w-full text-center px-4 py-3.5 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 transition-colors shadow-sm"
              >
                {isRTL ? 'حذف من الإدارة فقط (تظل للمستخدم)' : 'Delete from Admin Only'}
              </button>
              
              <button 
                onClick={() => deleteTickets('both', ticketToDelete)}
                className="w-full text-center px-4 py-3.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-sm font-bold transition-colors shadow-sm"
              >
                {isRTL ? 'حذف نهائي للطرفين (إدارة ومستخدم)' : 'Delete Permanently (Both)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
