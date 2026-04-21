/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  QrCode, 
  History, 
  Bell, 
  CheckCircle2, 
  Smartphone, 
  ExternalLink,
  Languages,
  Vibrate,
  Crown,
  Gem,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Sun,
  Moon,
  Settings,
  X,
  Download,
  Search,
  Volume2,
  VolumeX,
  PlayCircle,
  BellRing,
  Calculator,
  Filter,
  Trash2,
  Calendar,
  Copy,
  Check,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { format, startOfDay, subDays, isSameDay, isAfter, isBefore, parseISO, endOfDay } from 'date-fns';
import { Language, translations } from './translations';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  currency: string;
  senderName: string;
  timestamp: string;
  externalId?: string;
  senderAccount?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'qr' | 'history'>('qr');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [lastTxCount, setLastTxCount] = useState(0);
  const [isNewTx, setIsNewTx] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [appMode, setAppMode] = useState<'MOCK' | 'LIVE' | 'LOADING'>('LOADING');
  const [serverBlocked, setServerBlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'en');
  const [usePlan, setUsePlan] = useState<'free' | 'deluxe' | 'premium'>(() => (localStorage.getItem('userPlan') as any) || 'free');
  const [isMounted, setIsMounted] = useState(false);
  
  // Settings State
  const [bakongId, setBakongId] = useState(() => localStorage.getItem('bakongId') || "phearun_ly@aba");
  const [merchantName, setMerchantName] = useState(() => localStorage.getItem('merchantName') || "PayPing Demo Store");
  const [bakongToken, setBakongToken] = useState(() => localStorage.getItem('bakongToken') || "");
  const [directSync, setDirectSync] = useState(() => localStorage.getItem('directSync') === 'true');
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem('soundEnabled') !== 'false');
  const [voiceEnabled, setVoiceEnabled] = useState(() => localStorage.getItem('voiceEnabled') === 'true');
  const [vibrationEnabled, setVibrationEnabled] = useState(() => localStorage.getItem('vibrationEnabled') !== 'false');
  const [telegramEnabled, setTelegramEnabled] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' || 
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalToday = transactions.reduce((acc, tx) => acc + tx.amount, 0);
  const totalTodayKHR = totalToday * 4100;

  const filteredTransactions = transactions.filter(tx => {
    // Search Query (Sender, Account, ID)
    const matchesSearch = tx.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.externalId && tx.externalId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.senderAccount && tx.senderAccount.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Amount Filter
    const amount = tx.amount;
    const matchesMin = minAmount === "" || amount >= parseFloat(minAmount);
    const matchesMax = maxAmount === "" || amount <= parseFloat(maxAmount);
    
    // Date Filter
    const txDate = parseISO(tx.timestamp);
    const matchesStart = startDate === "" || isAfter(txDate, startOfDay(parseISO(startDate))) || isSameDay(txDate, parseISO(startDate));
    const matchesEnd = endDate === "" || isBefore(txDate, endOfDay(parseISO(endDate))) || isSameDay(txDate, parseISO(endDate));

    return matchesSearch && matchesMin && matchesMax && matchesStart && matchesEnd;
  });

  // Generate chart data for last 7 days
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const day = subDays(new Date(), 6 - i);
    const dayTotal = transactions
      .filter(tx => isSameDay(new Date(tx.timestamp), day))
      .reduce((acc, tx) => acc + tx.amount, 0);
    
    return {
      name: format(day, 'EEE'),
      total: dayTotal,
      fullDate: format(day, 'MMM dd')
    };
  });

  // Trans helper
  const t = (key: keyof typeof translations.en) => translations[lang][key] || translations.en[key];

  useEffect(() => {
    // Delay mounting the chart to let the bento grid layout stabilize
    const timer = setTimeout(() => setIsMounted(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('bakongId', bakongId);
    localStorage.setItem('merchantName', merchantName);
    localStorage.setItem('bakongToken', bakongToken);
    localStorage.setItem('directSync', String(directSync));
    localStorage.setItem('soundEnabled', String(soundEnabled));
    localStorage.setItem('voiceEnabled', String(voiceEnabled));
    localStorage.setItem('vibrationEnabled', String(vibrationEnabled));
    localStorage.setItem('userPlan', usePlan);
    localStorage.setItem('lang', lang);
  }, [bakongId, merchantName, bakongToken, directSync, soundEnabled, voiceEnabled, vibrationEnabled, usePlan, lang]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    if (showSettings) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSettings]);

  useEffect(() => {
    fetchTransactions();
    fetchAppStatus();
    const interval = setInterval(() => {
      fetchTransactions();
      fetchAppStatus();
    }, 5000);

    // Direct Sync Logic (Browser IP to bypass 403)
    let syncInterval: any;
    if (directSync && bakongToken && bakongId) {
      syncInterval = setInterval(performDirectSync, 15000);
    }

    return () => {
      clearInterval(interval);
      if (syncInterval) clearInterval(syncInterval);
    };
  }, [directSync, bakongToken, bakongId]);

  const performDirectSync = async () => {
    try {
      // Browser-side fetch bypasses data center IP blocks
      const res = await fetch("https://api-bakong.nbc.gov.kh/v1/transaction_history", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${bakongToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ accountId: bakongId })
      });
      
      const data = await res.json();
      if (data && data.data) {
        const inboundTx = data.data.filter((t: any) => t.type === "RECEIVE" || t.direction === "IN");
        
        for (const t of inboundTx) {
          // Report to server for persistence and Telegram
          const senderAcc = t.fromAccountId || "N/A";
          await fetch("/api/report_transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: t.amount,
              currency: t.currency || "USD",
              senderName: t.senderName || senderAcc,
              senderAccount: senderAcc,
              timestamp: new Date(t.timestamp).toISOString(),
              externalId: t.hash || t.transactionId
            })
          });
        }
      }
    } catch (e) {
      console.warn("Direct sync error (likely CORS):", e);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      
      if (data.length > lastTxCount && lastTxCount !== 0) {
        handleNewTransaction();
      }
      
      setTransactions(data);
      setLastTxCount(data.length);
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    }
  };

  const fetchAppStatus = async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setAppMode(data.mode);
      setServerBlocked(!!data.isBlocked);
      if (typeof data.telegramEnabled === 'boolean') {
        setTelegramEnabled(data.telegramEnabled);
      }
    } catch (e) {
      setAppMode('MOCK');
    }
  };

  const handleNewTransaction = () => {
    setIsNewTx(true);
    
    // Haptic Feedback
    if (vibrationEnabled && "vibrate" in navigator) {
      navigator.vibrate([100, 50, 100]);
    }

    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
    }

    if (voiceEnabled) {
      const text = lang === 'en' 
        ? `Payment received. ${transactions[0]?.amount} dollars from ${transactions[0]?.senderName}`
        : `ទទួលបានការទូទាត់ ${transactions[0]?.amount} ដុល្លារ ពី ${transactions[0]?.senderName}`;
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = lang === 'en' ? 'en-US' : 'km-KH';
      window.speechSynthesis.speak(msg);
    }
    setTimeout(() => setIsNewTx(false), 5000);
  };

  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ["ID", "External ID", "Sender", "Account", "Amount", "Currency", "Timestamp"];
    const rows = transactions.map(tx => [
      tx.id,
      tx.externalId || "",
      tx.senderName,
      tx.senderAccount || "",
      tx.amount,
      tx.currency,
      tx.timestamp
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payments_export_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const testTelegram = async () => {
    try {
      await fetch('/api/report_transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 0.01,
          currency: 'USD',
          senderName: 'System Test',
          senderAccount: 'TEST-ACCOUNT',
          timestamp: new Date().toISOString(),
          externalId: 'TEST_' + Date.now()
        })
      });
      alert("Test ping sent to Telegram!");
    } catch (e) {
      alert("Failed to send test ping.");
    }
  };

  const testSound = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(e => alert("Audio blocked by browser. Click anywhere on the page first."));
    }
  };

  const clearHistory = async () => {
    if (confirm("Are you sure you want to delete all transaction history? This cannot be undone.")) {
      try {
        await fetch('/api/clear_transactions', { method: 'DELETE' });
        setTransactions([]);
        alert("Transaction history cleared.");
      } catch (e) {
        alert("Failed to clear history.");
      }
    }
  }

  const resetApp = () => {
    if (confirm("Reset all settings and clear local cache?")) {
      localStorage.clear();
      window.location.reload();
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const performTelegramToggle = async (enabled: boolean) => {
    setTelegramEnabled(enabled);
    try {
      await fetch('/api/settings/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
    } catch (e) {
      console.error("Failed to update Telegram setting");
    }
  };

  const khqrString = `https://bakong.nbc.gov.kh/pay?id=${bakongId}&name=${encodeURIComponent(merchantName)}&amount=0&currency=USD`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto transition-colors duration-300">
      {/* Audio for notification */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3" preload="auto" />

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 shadow-sm gap-4 transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
             <QrCode className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 italic">PayPing</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('appTitleDesc')}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setLang(lang === 'en' ? 'kh' : 'en')}
            className="flex items-center gap-2 px-4 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-[11px] font-black uppercase rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
          >
            <Languages className="w-3.5 h-3.5" />
            {lang === 'en' ? 'ភាសាខ្មែរ' : 'English'}
          </button>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/50">
            <span className={cn("w-2 h-2 rounded-full animate-pulse", appMode === 'LIVE' ? "bg-emerald-500" : "bg-amber-500")}></span>
            <span className="text-xs font-bold uppercase tracking-wider">{appMode === 'LIVE' ? t('liveSync') : appMode === 'MOCK' ? t('mockMode') : t('initializing')}</span>
          </div>
          {serverBlocked && !directSync && (
            <motion.button 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-full border border-red-100 dark:border-red-900/50 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('proxyBlock')}</span>
            </motion.button>
          )}
        </div>
      </header>

      {/* Main Bento Layout */}
      <div className="flex flex-col md:grid md:grid-cols-12 md:grid-rows-10 gap-6 flex-grow min-h-[800px]">
        
        {/* Transaction Stream (Tall Card) */}
        <div className={cn(
          "md:col-span-6 lg:col-span-4 bento-card flex flex-col bg-white dark:bg-slate-900 dark:border-slate-800 transition-all duration-700",
          transactions.length > 3 ? "md:row-span-10" : "md:row-span-5 h-fit lg:h-full lg:row-span-10"
        )}>
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-slate-700 dark:text-slate-300 uppercase text-xs tracking-widest">{t('activityFeed')}</h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    showFilters ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30" : "hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"
                  )}
                  title={t('filterOptions')}
                >
                  <Filter className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={exportToCSV}
                  className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors text-slate-400"
                  title="Export to CSV"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full font-bold uppercase">
                  {filteredTransactions.length} / {transactions.length} {t('records')}
                </span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden space-y-3 pt-1"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{t('amountMin')}</label>
                        <input 
                          type="number" 
                          placeholder="0.00"
                          value={minAmount}
                          onChange={(e) => setMinAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{t('amountMax')}</label>
                        <input 
                          type="number" 
                          placeholder="9999"
                          value={maxAmount}
                          onChange={(e) => setMaxAmount(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{t('fromDate')}</label>
                        <input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold uppercase text-slate-400 tracking-tighter">{t('toDate')}</label>
                        <input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md px-2 py-1.5 text-[10px] focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>
                    {(minAmount || maxAmount || startDate || endDate) && (
                      <button 
                        onClick={() => {
                          setMinAmount(""); setMaxAmount(""); setStartDate(""); setEndDate("");
                        }}
                        className="w-full py-1 text-[9px] font-bold text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-950/20 rounded-md transition"
                      >
                        {t('clearFilters')}
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex-grow p-4 overflow-y-auto max-h-[500px] md:max-h-full space-y-3">
            <AnimatePresence initial={false}>
              {filteredTransactions.map((tx, idx) => (
                <motion.div 
                  key={tx.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-2xl flex flex-col gap-2 transition-all cursor-default relative overflow-hidden",
                    "hover:border-indigo-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] hover:-translate-y-0.5 active:scale-[0.98] group",
                    idx === 0 && isNewTx 
                      ? "bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/10" 
                      : "bg-white dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                  )}
                >
                  {/* Status Badge */}
                  <div className="absolute top-0 right-0">
                    <div className={cn(
                      "text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-tighter transition-colors",
                      idx === 0 && isNewTx ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-600 group-hover:text-white"
                    )}>
                      {t('success')}
                    </div>
                  </div>

                  <div className="flex justify-between items-center w-full">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-400 font-bold uppercase overflow-hidden group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {tx.senderName.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1">{tx.senderName}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {tx.senderAccount || t('verifiedAccount')}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "text-right font-mono font-black italic",
                      idx === 0 && isNewTx ? "text-emerald-600 dark:text-emerald-400 text-lg" : "text-slate-700 dark:text-slate-300"
                    )}>
                      +${tx.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-50 dark:border-slate-800/50">
                    <div 
                      className="flex items-center gap-1.5 overflow-hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 p-1 -ml-1 rounded-md transition-colors group/id"
                      onClick={() => copyToClipboard(tx.externalId || tx.id, tx.id)}
                    >
                       <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase">{t('txid')}</span>
                       <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[100px]">
                         {tx.externalId || tx.id.substring(0, 12)}
                       </span>
                       {copiedId === tx.id ? (
                         <Check className="w-2.5 h-2.5 text-emerald-500" />
                       ) : (
                         <Copy className="w-2.5 h-2.5 text-slate-300 opacity-0 group-hover/id:opacity-100 transition-opacity" />
                       )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                      {format(new Date(tx.timestamp), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {transactions.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <History className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto" />
                <p className="text-slate-400 dark:text-slate-600 mt-4 text-xs font-bold uppercase tracking-widest">{t('awaitingPayments')}</p>
              </div>
            )}
          </div>
        </div>

        {/* QR Code Central Focus */}
        <div className="md:col-span-6 lg:col-span-5 md:row-span-5 bento-card flex flex-col items-center justify-center p-8 space-y-6 bg-white dark:bg-slate-900 dark:border-slate-800 border-2 border-slate-100 dark:border-slate-800/50">
          <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl border-[8px] border-slate-950 flex items-center justify-center group overflow-hidden">
            <QRCodeSVG 
              value={khqrString} 
              size={240}
              level="H"
              includeMargin={false}
              fgColor="#0f172a"
            />
            {/* Logo Center Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-[10px] font-black leading-none text-center text-slate-900">KHQR<br/><span className="text-red-500">PAY</span></span>
            </div>
            
            <div className="absolute inset-0 bg-indigo-600/0 group-hover:bg-indigo-600/5 transition-all flex items-center justify-center pointer-events-none">
                <ExternalLink className="w-12 h-12 text-white/0 group-hover:text-white/20 transition-all" />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase italic">{merchantName}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono uppercase tracking-widest">{t('bakongId')}: {bakongId}</p>
            <div className="mt-6 inline-flex bg-slate-900 dark:bg-indigo-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl dark:shadow-none cursor-pointer">
              {t('refreshQr')}
            </div>
          </div>
        </div>

        {/* Summary Stat Cards */}
        <div className="md:col-span-6 lg:col-span-3 md:row-span-5 bento-card-indigo flex flex-col group overflow-hidden relative">
          {/* Background Dynamics */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/10 blur-[80px] rounded-full group-hover:bg-white/20 transition-colors"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_1px)] bg-[size:32px_32px] opacity-10"></div>
          </div>
          
          <div className="p-8 relative z-10 flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-start mb-6">
              <div className="flex flex-col gap-1.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200/60 leading-none">
                  {t('revenueToday')}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase tracking-widest leading-none">Syncing</span>
                </div>
              </div>
              <div className="px-2 py-1 bg-white/10 backdrop-blur-md rounded-md border border-white/5 hidden xl:block">
                <p className="text-[8px] font-black text-white uppercase tracking-tighter leading-none">USD/KHR</p>
              </div>
            </div>
            
            <div className="flex flex-col">
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-5xl md:text-5xl lg:text-5xl xl:text-7xl font-mono font-black italic tracking-tighter group-hover:translate-x-2 transition-transform origin-left text-white drop-shadow-xl"
              >
                ${totalToday.toFixed(2)}
              </motion.p>
              <div className="w-20 h-1 bg-white/20 rounded-full mt-4"></div>
            </div>
          </div>

          <div className="relative z-10 px-8 py-6 bg-black/20 backdrop-blur-xl border-t border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/10 shrink-0 shadow-inner">
                   <Calculator className="w-4 h-4 text-indigo-200" />
                 </div>
                 <div className="flex flex-col">
                   <p className="text-lg font-mono font-black text-white tracking-tight leading-none italic">៛{new Intl.NumberFormat().format(totalTodayKHR)}</p>
                   <p className="text-[9px] text-indigo-300 font-bold uppercase tracking-widest mt-1 opacity-50">Converted</p>
                 </div>
              </div>
              <p className="text-[9px] text-indigo-100 font-mono uppercase tracking-[0.2em] opacity-40 hidden lg:block">{t('realTimeTotal')}</p>
            </div>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="md:col-span-12 lg:col-span-5 md:row-span-3 bento-card p-8 flex flex-col bg-white dark:bg-slate-900 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
              <TrendingUp className="w-3 h-3" /> {t('weeklyTrends')}
            </p>
          </div>
          <div className="h-[200px] w-full min-w-0 overflow-hidden">
            {isMounted && (
              <ResponsiveContainer width="100%" height="100%" debounce={200} key="analytics-chart">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.3} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-slate-900 text-white p-2 rounded-lg text-[10px] font-black border border-slate-700 shadow-xl">
                            <p>{payload[0].payload.fullDate}</p>
                            <p className="text-emerald-400">${payload[0].value?.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 6 ? '#4f46e5' : '#e2e8f0'} 
                        className={index === 6 ? "dark:fill-indigo-500" : "dark:fill-slate-800"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        {/* Worker Status Card */}
        <div className="md:col-span-6 lg:col-span-3 md:row-span-3 bento-card p-6 flex flex-col justify-between bg-white dark:bg-slate-900 dark:border-slate-800 border-2 border-emerald-500/10 active:border-indigo-500 transition-colors">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> {t('workerStatus')}
          </p>
          <div>
            <p className={cn(
              "text-4xl font-mono font-black tracking-tighter uppercase",
              appMode === 'LIVE' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"
            )}>
              {appMode === 'LIVE' ? t('liveSync') : appMode === 'MOCK' ? t('mockMode') : t('initializing')}
            </p>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-3 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: appMode === 'LOADING' ? '30%' : '100%' }}
                className={cn("h-full transition-all duration-1000", appMode === 'LIVE' ? "bg-emerald-500" : "bg-amber-500")}
              />
            </div>
          </div>
        </div>

        {/* System Status Grid */}
        <div className="md:col-span-6 lg:col-span-5 md:row-span-2 grid grid-cols-3 gap-4">
          {[
            { icon: Smartphone, label: t('bakongApi'), status: 'OK', color: 'blue' },
            { icon: History, label: t('firestore'), status: 'SYNC', color: 'amber' },
            { icon: Bell, label: t('telegram'), status: 'UP', color: 'sky' }
          ].map((item, i) => (
            <div key={i} className="bento-card p-4 flex flex-col items-center justify-center gap-2 text-center bg-white dark:bg-slate-900 dark:border-slate-800 hover:scale-105 transition-transform">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shadow-sm",
                item.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 
                item.color === 'amber' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600' : 'bg-sky-100 dark:bg-sky-900/30 text-sky-600'
              )}>
                <item.icon className="w-5 h-5 text-current" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter">{item.label}</span>
              <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter italic">{item.status}</span>
            </div>
          ))}
        </div>

        {/* System Log Card */}
        <div className="md:col-span-6 lg:col-span-3 md:row-span-2 bento-card-dark flex flex-col justify-between">
           <div className="flex justify-between items-start">
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('logs')}</p>
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></div>
           </div>
           <div className="font-mono text-[9px] space-y-1 text-slate-400 dark:text-slate-500 mt-4 h-24 overflow-hidden mask-fade-bottom">
             <p className="flex gap-2"><span className="text-emerald-500">[INIT]</span> {t('logInit')}</p>
             <p className="flex gap-2"><span className="text-emerald-500">[AUTH]</span> {t('logAuth')}</p>
             <p className="flex gap-2"><span className="text-emerald-500">[DB]</span> {t('logDb')}</p>
             <p className="flex gap-2 opacity-50"><span className="text-slate-600">05:09:40</span> {t('logHeartbeat')}</p>
           </div>
        </div>

      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div 
            className="fixed inset-0 z-[100] flex items-start justify-center p-4 md:p-6 bg-slate-950/60 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowSettings(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              layout
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg my-auto bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 md:p-10 space-y-8 shadow-2xl relative border-2 border-slate-100 dark:border-slate-800"
            >
              <button 
                onClick={() => setShowSettings(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center">
                <Settings className="w-10 h-10 text-indigo-600 mx-auto" />
                <h2 className="text-xl font-bold mt-2">{t('settings')}</h2>
                <p className="text-xs text-slate-500 whitespace-nowrap">{t('configMerchantDesc')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('merchantName')}</label>
                  <input 
                    type="text" 
                    value={merchantName}
                    onChange={(e) => setMerchantName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                    placeholder={t('shopNamePlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('bakongId')}</label>
                  <input 
                    type="text" 
                    value={bakongId}
                    onChange={(e) => setBakongId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors italic font-mono"
                    placeholder={t('bakongIdPlaceholder')}
                  />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('bakongToken')}</label>
                   <input 
                    type="password" 
                    value={bakongToken}
                    onChange={(e) => setBakongToken(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold focus:border-indigo-500 outline-none transition-colors"
                    placeholder={t('tokenPlaceholder')}
                  />
                </div>

                {/* Notifications Section */}
                <div className="pt-2">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('notificationPrefs')}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                          <Volume2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{t('soundNotifications')}</p>
                          <p className="text-[10px] text-slate-500">{t('soundDesc')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={testSound}
                          className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                          title={t('testSound')}
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setSoundEnabled(!soundEnabled)}
                          className={cn(
                            "w-10 h-5 rounded-full transition-colors relative",
                            soundEnabled ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
                          )}
                        >
                          <div className={cn(
                            "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                            soundEnabled ? "left-5.5" : "left-0.5"
                          )} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{t('voiceAnnouncements')}</p>
                          <p className="text-[10px] text-slate-500">{t('voiceDesc')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVoiceEnabled(!voiceEnabled)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          voiceEnabled ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                          voiceEnabled ? "left-5.5" : "left-0.5"
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/30 flex items-center justify-center">
                          <Vibrate className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{t('hapticFeedback')}</p>
                          <p className="text-[10px] text-slate-500">{t('hapticDesc')}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setVibrationEnabled(!vibrationEnabled)}
                        className={cn(
                          "w-10 h-5 rounded-full transition-colors relative",
                          vibrationEnabled ? "bg-indigo-500" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                          vibrationEnabled ? "left-5.5" : "left-0.5"
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/30 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-sky-600" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">{t('telegramAlerts')}</p>
                            <p className="text-[10px] text-slate-500">{t('telegramDesc')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={testTelegram}
                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            title={t('testTelegram')}
                          >
                            <BellRing className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => performTelegramToggle(!telegramEnabled)}
                            className={cn(
                              "w-10 h-5 rounded-full transition-colors relative",
                              telegramEnabled ? "bg-sky-600" : "bg-slate-300 dark:bg-slate-700"
                            )}
                          >
                            <div className={cn(
                              "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                              telegramEnabled ? "left-5.5" : "left-0.5"
                            )} />
                          </button>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{t('pricing')}</p>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { id: 'free', name: t('freeTier'), color: 'slate', icon: Search, desc: t('freeFeatures') },
                      { id: 'deluxe', name: t('deluxeTier'), color: 'amber', icon: Gem, desc: t('deluxeFeatures') },
                      { id: 'premium', name: t('premiumTier'), color: 'indigo', icon: Crown, desc: t('premiumFeatures') }
                    ].map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => setUsePlan(plan.id as any)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left",
                          usePlan === plan.id 
                            ? `border-${plan.color}-500 bg-${plan.color}-50 dark:bg-${plan.color}-900/20` 
                            : "border-slate-100 dark:border-slate-800 hover:border-slate-200"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          usePlan === plan.id ? `bg-${plan.color}-500 text-white` : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          <plan.icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-[11px] font-bold">{plan.name}</p>
                          <p className="text-[9px] text-slate-500">{plan.desc}</p>
                        </div>
                        {usePlan === plan.id && (
                          <div className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", `bg-${plan.color}-500 text-white`)}>
                            {t('currentPlan')}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">{t('systemControls')}</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-xs font-bold">{t('directSync')}</p>
                        <p className="text-[10px] text-slate-500">{t('directSyncDesc')}</p>
                      </div>
                      <button 
                        onClick={() => setDirectSync(!directSync)}
                        className={cn(
                          "w-12 h-6 rounded-full transition-colors relative",
                          directSync ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                          directSync ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-2 border-slate-100 dark:border-slate-700">
                      <div>
                        <p className="text-xs font-bold text-red-500">{t('dangerZone')}</p>
                        <p className="text-[10px] text-slate-500">{t('dangerZoneDesc')}</p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={clearHistory}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 rounded-lg transition"
                          title={t('clearHistory')}
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={resetApp}
                          className="p-2 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-orange-500 rounded-lg transition"
                          title={t('resetLocal')}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button 
                    onClick={testSound}
                    className="py-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {t('testSound')}
                  </button>
                  <button 
                    onClick={testTelegram}
                    className="py-3 bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  >
                    {t('testTelegram')}
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowSettings(false)}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-colors uppercase tracking-widest text-xs"
              >
                {t('saveClose')}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global New Transaction Alert */}
      <AnimatePresence>
        {isNewTx && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-6 pointer-events-none"
          >
            <div className="max-w-xs mx-auto bg-indigo-600 dark:bg-indigo-500 text-white p-4 rounded-3xl shadow-2xl flex items-center gap-4 border-4 border-white/30 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-80 italic">{t('paymentReceived')}!</p>
                <p className="text-sm font-bold leading-tight">
                  <span className="text-2xl font-mono italic tracking-tighter">
                    {lang === 'en' ? `+$${transactions[0]?.amount}` : `+${transactions[0]?.amount} ដុល្លារ`}
                  </span><br/>
                  <span className="text-[11px] font-medium opacity-90 uppercase tracking-widest">{transactions[0]?.senderName}</span>
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



