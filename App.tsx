
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Transaction, TransactionType, UserProfile, PaymentMethod, StaffMember } from './types';
import { TransactionForm } from './components/TransactionForm';
import { StaffManager } from './components/StaffManager';
import { ICONS, PAYMENT_METHODS } from './constants';
import { getBusinessInsights } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>({
    name: '',
    email: '',
    businessName: '',
    businessAddress: '',
    isAuthenticated: false,
    isConfigured: false
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [insights, setInsights] = useState<string>('Recording data to generate AI insights...');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'logs' | 'reports' | 'staff' | 'settings'>('dashboard');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Load data from LocalStorage on mount
  useEffect(() => {
    const savedU = localStorage.getItem('chai_user');
    const savedT = localStorage.getItem('chai_transactions');
    const savedS = localStorage.getItem('chai_staff');
    if (savedU) setUser(JSON.parse(savedU));
    if (savedT) setTransactions(JSON.parse(savedT));
    if (savedS) setStaff(JSON.parse(savedS));
  }, []);

  // Save data whenever it changes
  useEffect(() => {
    localStorage.setItem('chai_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('chai_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('chai_staff', JSON.stringify(staff));
  }, [staff]);

  const addTransaction = (t: Transaction) => {
    if (editingTransaction) {
      setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
      setEditingTransaction(null);
    } else {
      setTransactions(prev => [t, ...prev]);
    }
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm("Delete this entry?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (editingTransaction?.id === id) setEditingTransaction(null);
    }
  };

  const handleEditClick = (t: Transaction) => {
    setEditingTransaction(t);
    setActiveTab('dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addStaff = (s: StaffMember) => {
    setStaff(prev => [...prev, s]);
  };

  const updateStaff = (updated: StaffMember) => {
    setStaff(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  const fetchInsights = async () => {
    if (transactions.length < 3) return;
    setLoadingInsights(true);
    const result = await getBusinessInsights(transactions, user.businessName);
    setInsights(result);
    setLoadingInsights(false);
  };

  const totals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) acc.income += t.amount;
      else acc.expenses += t.amount;
      return acc;
    }, { income: 0, expenses: 0 });
  }, [transactions]);

  const profit = totals.income - totals.expenses;

  const paymentData = useMemo(() => {
    const counts = transactions.reduce((acc, t) => {
      if (t.type === TransactionType.INCOME) {
        acc[t.paymentMethod] = (acc[t.paymentMethod] || 0) + t.amount;
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const dailyChartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7Days.map(date => {
      const dayT = transactions.filter(t => t.date.startsWith(date));
      return {
        date: date.split('-').slice(1).join('/'),
        income: dayT.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0),
        expense: dayT.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0),
      };
    });
  }, [transactions]);

  const COLORS = ['#F59E0B', '#3B82F6', '#8B5CF6', '#6B7280'];

  // Setup/Onboarding View
  const SetupView = () => {
    const [step, setStep] = useState(1);
    const [shopName, setShopName] = useState('');
    const [shopAddress, setShopAddress] = useState('');
    const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
    const [image, setImage] = useState<string | null>(null);
    const [locating, setLocating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleGetLocation = () => {
      setLocating(true);
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition((pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocating(false);
        }, (err) => {
          console.error(err);
          setLocating(false);
          alert("Could not get location. Check device GPS.");
        });
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => { setImage(reader.result as string); };
        reader.readAsDataURL(file);
      }
    };

    const handleComplete = () => {
      if (!shopName || !shopAddress) return alert("Shop name and address required.");
      setUser({
        ...user,
        businessName: shopName,
        businessAddress: shopAddress,
        location: location ? { latitude: location.lat, longitude: location.lng } : undefined,
        shopImage: image || undefined,
        isConfigured: true,
        isAuthenticated: true
      });
    };

    return (
      <div className="min-h-screen bg-stone-50 p-6 flex flex-col justify-center page-transition">
        <div className="max-w-md mx-auto w-full bg-white p-8 rounded-[40px] shadow-2xl border border-stone-100">
          <div className="flex justify-between items-center mb-8">
            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Setup Step {step}/3</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => <div key={s} className={`h-1.5 rounded-full transition-all duration-300 ${s <= step ? 'w-6 bg-amber-500' : 'w-1.5 bg-stone-200'}`}></div>)}
            </div>
          </div>

          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-stone-900 mb-2">Shop Details</h2>
              <p className="text-stone-500 text-sm mb-8 font-medium">Let's start your digital ledger.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Shop Name</label>
                  <input type="text" value={shopName} onChange={e => setShopName(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold" placeholder="e.g. Moonlight Tea Corner" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Business Address</label>
                  <textarea value={shopAddress} onChange={e => setShopAddress(e.target.value)} className="w-full p-4 bg-stone-50 border border-stone-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 transition-all" rows={3} placeholder="Full address" />
                </div>
                <button onClick={() => setStep(2)} className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all">Next</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 text-center">
              <h2 className="text-3xl font-black text-stone-900 mb-2">Location</h2>
              <p className="text-stone-500 text-sm mb-8 font-medium">Pin your shop for smart local reports.</p>
              <div className="space-y-6">
                <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-3xl p-10 flex flex-col items-center justify-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${location ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  {location ? <p className="text-xs font-bold text-stone-800">Coordinates Captured!</p> : <p className="text-xs font-bold text-stone-500">Enable GPS Access</p>}
                </div>
                <button onClick={handleGetLocation} className="w-full bg-amber-600 text-white font-black py-4 rounded-2xl shadow-xl">{locating ? "Locating..." : "Capture Location"}</button>
                <div className="flex gap-4">
                   <button onClick={() => setStep(1)} className="flex-1 text-stone-400 font-bold">Back</button>
                   <button onClick={() => setStep(3)} className="flex-1 bg-stone-900 text-white font-bold py-4 rounded-2xl">Next</button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-3xl font-black text-stone-900 mb-2">Shop Photo</h2>
              <p className="text-stone-500 text-sm mb-8 font-medium">Add a photo to complete your profile.</p>
              <div className="space-y-6">
                <div onClick={() => fileInputRef.current?.click()} className="relative cursor-pointer bg-stone-50 border-2 border-dashed border-stone-200 rounded-[32px] aspect-video overflow-hidden flex flex-col items-center justify-center">
                  {image ? <img src={image} className="w-full h-full object-cover" /> : <div className="text-center"><p className="text-2xl mb-1">📸</p><p className="text-xs font-bold text-stone-400">Take Photo</p></div>}
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleImageChange} />
                </div>
                <button onClick={handleComplete} className="w-full bg-stone-900 text-white font-black py-4 rounded-2xl shadow-xl">Complete Setup</button>
                <button onClick={() => setStep(2)} className="w-full text-stone-400 font-bold">Back</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!user.isConfigured) return <SetupView />;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-stone-50 pb-24 relative page-transition">
      <header className="sticky top-0 z-20 bg-stone-50/80 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-stone-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl overflow-hidden border border-amber-200 shadow-inner">
             {user.shopImage ? <img src={user.shopImage} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍵</div>}
          </div>
          <div>
            <h2 className="text-lg font-black text-stone-900 leading-tight">{user.businessName}</h2>
            <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider line-clamp-1">{user.businessAddress}</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('settings')} className="w-10 h-10 bg-white border border-stone-200 rounded-full flex items-center justify-center shadow-sm">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </header>

      <main className="p-4 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200">
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Daily Sales</p>
                <p className="text-green-600 font-black text-xl">₹{totals.income}</p>
              </div>
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200">
                <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-1">Expenses</p>
                <p className="text-red-500 font-black text-xl">₹{totals.expenses}</p>
              </div>
            </div>

            <div className="bg-stone-900 text-white p-7 rounded-[40px] shadow-2xl relative overflow-hidden">
              <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest mb-1">Net Daily Profit</p>
              <h3 className="text-4xl font-black mb-4">₹{profit}</h3>
              <div className="flex gap-2 text-[9px] font-black uppercase tracking-wider">
                <span className="px-3 py-1.5 bg-white/10 border border-white/5 rounded-full">ACTIVE SESSION</span>
                <span className="px-3 py-1.5 bg-white/10 border border-white/5 rounded-full">{staff.length} TEAM</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-[32px] border border-amber-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-amber-900 font-black text-xs uppercase tracking-widest">AI Advisor</h4>
                <button onClick={fetchInsights} disabled={loadingInsights} className="text-[10px] font-bold text-amber-600">{loadingInsights ? '...' : 'Refresh'}</button>
              </div>
              <p className="text-amber-900/80 text-sm italic font-medium">"{insights}"</p>
            </div>

            <TransactionForm onAdd={addTransaction} editingTransaction={editingTransaction} onCancelEdit={() => setEditingTransaction(null)} />

            <div className="bg-white rounded-[32px] p-6 border border-stone-200">
              <h4 className="font-black text-stone-800 mb-5 text-sm uppercase tracking-widest">Recent Activity</h4>
              <div className="space-y-4">
                {transactions.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black ${t.type === TransactionType.INCOME ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>{t.type === TransactionType.INCOME ? '₹' : '−'}</div>
                      <div>
                        <p className="text-sm font-black text-stone-800">{t.category}</p>
                        <p className="text-[10px] text-stone-400 font-bold uppercase tracking-tighter">{t.paymentMethod} • {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className={`font-black text-lg ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'}`}>₹{t.amount}</p>
                      <button onClick={() => handleEditClick(t)} className="p-2 opacity-0 group-hover:opacity-100 transition-opacity text-stone-300 hover:text-amber-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <h3 className="text-2xl font-black px-2">Ledger</h3>
            <div className="bg-white rounded-[40px] border border-stone-200 overflow-hidden divide-y divide-stone-100">
               {transactions.map(t => (
                  <div key={t.id} className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xs font-black ${PAYMENT_METHODS.find(pm => pm.id === t.paymentMethod)?.color}`}>{t.paymentMethod.slice(0, 1)}</span>
                        <div>
                          <p className="text-sm font-black text-stone-800">{t.category}</p>
                          <p className="text-[10px] font-bold text-stone-400 uppercase">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className={`font-black text-lg ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-500'}`}>₹{t.amount}</p>
                    </div>
                    <div className="flex justify-end gap-6 pt-4 border-t border-stone-50">
                      <button onClick={() => handleEditClick(t)} className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Edit</button>
                      <button onClick={() => deleteTransaction(t.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest">Delete</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && <StaffManager staff={staff} onAddStaff={addStaff} onUpdateStaff={updateStaff} onAddTransaction={addTransaction} />}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-2xl font-black px-2">Analytics</h3>
            <div className="bg-white p-6 rounded-[40px] border border-stone-200">
              <h4 className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-6 text-center">Revenue Trend</h4>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis dataKey="date" fontSize={9} axisLine={false} tickLine={false} fontWeight="bold" />
                    <YAxis fontSize={9} axisLine={false} tickLine={false} fontWeight="bold" />
                    <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} barSize={12} />
                    <Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setActiveTab('settings')} className="bg-stone-900 text-white p-6 rounded-[32px] flex flex-col items-center gap-3 transition-transform hover:scale-95 shadow-xl">
                <span className="text-3xl">☁️</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Cloud Sync</span>
              </button>
              <button onClick={() => {
                  const csv = transactions.map(t => `${t.date},${t.type},${t.amount},${t.category},${t.paymentMethod},"${t.notes || ''}"`).join('\n');
                  const blob = new Blob([`Date,Type,Amount,Category,PaymentMethod,Notes\n${csv}`], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `TeaStall_Records.csv`;
                  a.click();
                }} className="bg-white border-2 border-stone-100 text-stone-800 p-6 rounded-[32px] flex flex-col items-center gap-3 transition-transform hover:scale-95 shadow-sm">
                <span className="text-3xl">📁</span>
                <span className="text-[10px] font-black uppercase tracking-widest">Export Excel</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-2xl font-black px-2">Store & Cloud</h3>
            
            <div className="bg-white p-6 rounded-[40px] border border-stone-200">
              <h4 className="text-xs font-black uppercase text-stone-400 tracking-widest mb-4">APK / Play Store Guide</h4>
              <div className="space-y-4 text-xs font-medium text-stone-600 leading-relaxed">
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                   <p className="font-black text-stone-800 mb-1">Step 1: Host Code</p>
                   <p>Upload these files to Vercel or GitHub Pages to get a live URL.</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                   <p className="font-black text-stone-800 mb-1">Step 2: Use Bubblewrap</p>
                   <p>Use the Google Chrome tool "Bubblewrap" to turn your live URL into a signed APK for Play Store.</p>
                </div>
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100">
                   <p className="font-black text-stone-800 mb-1">Step 3: Upload AAB</p>
                   <p>The build tool gives you an .aab file. Upload this to Google Play Console.</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-600 text-white p-6 rounded-[40px] shadow-lg">
              <h4 className="text-xs font-black uppercase tracking-widest mb-2">Google Sheets Sync</h4>
              <p className="text-xs opacity-90 mb-4 font-medium">To sync with Sheets, simply export to Excel and upload to Google Drive. The app automatically saves all data locally on your device for offline use.</p>
              <button onClick={() => alert("Cloud backup is active on local storage. For real-time Google Sheets, use the Export Excel feature and import to Drive.")} className="w-full bg-white text-blue-600 font-black py-3 rounded-2xl text-xs uppercase tracking-widest">Force Cloud Sync</button>
            </div>

            <button onClick={() => { if(window.confirm("Redo setup?")) setUser({...user, isConfigured: false}) }} className="w-full p-6 border-2 border-red-100 text-red-500 font-black rounded-[32px] uppercase text-xs tracking-widest flex items-center justify-center gap-2">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
               Reset Shop Configuration
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-xl border-t border-stone-100 flex justify-around items-center py-5 px-6 z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] rounded-t-[40px]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'dashboard' ? 'text-amber-600 scale-110' : 'text-stone-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Home</span>
        </button>
        <button onClick={() => setActiveTab('staff')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'staff' ? 'text-amber-600 scale-110' : 'text-stone-300'}`}>
          <ICONS.Users />
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Staff</span>
        </button>
        <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'logs' ? 'text-amber-600 scale-110' : 'text-stone-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Ledger</span>
        </button>
        <button onClick={() => setActiveTab('reports')} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === 'reports' ? 'text-amber-600 scale-110' : 'text-stone-300'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          <span className="text-[8px] font-black uppercase tracking-[0.2em]">Reports</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
