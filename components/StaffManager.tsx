
import React, { useState } from 'react';
import { StaffMember, Transaction, TransactionType } from '../types';

interface StaffManagerProps {
  staff: StaffMember[];
  onAddStaff: (s: StaffMember) => void;
  onUpdateStaff: (s: StaffMember) => void;
  onAddTransaction: (t: Transaction) => void;
}

export const StaffManager: React.FC<StaffManagerProps> = ({ staff, onAddStaff, onUpdateStaff, onAddTransaction }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '',
    address: '',
    aadhaar: '',
    pay: ''
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.pay || !newStaff.phone) {
      alert("Please fill in at least Name, Phone, and Salary");
      return;
    }
    
    onAddStaff({
      id: Date.now().toString(),
      name: newStaff.name,
      phone: newStaff.phone,
      address: newStaff.address,
      aadhaar: newStaff.aadhaar,
      weeklyBasePay: Number(newStaff.pay),
      totalHeldBalance: 0,
      joinedDate: new Date().toISOString()
    });
    
    setNewStaff({ name: '', phone: '', address: '', aadhaar: '', pay: '' });
    setShowAddForm(false);
  };

  const processWeeklyPay = (s: StaffMember) => {
    const weeklyTotal = s.weeklyBasePay;
    const paidNow = weeklyTotal * 0.40; // 40% paid now
    const heldAmount = weeklyTotal * 0.60; // 60% held

    onAddTransaction({
      id: `pay-${Date.now()}-${s.id}`,
      date: new Date().toISOString(),
      amount: paidNow,
      category: 'Staff - Weekly',
      type: TransactionType.EXPENSE,
      paymentMethod: 'CASH',
      notes: `Weekly 40% pay for ${s.name}. Held: ₹${heldAmount}`,
      staffId: s.id
    });

    onUpdateStaff({
      ...s,
      totalHeldBalance: s.totalHeldBalance + heldAmount
    });
    
    alert(`Processed pay for ${s.name}.\nPaid: ₹${paidNow}\nHeld: ₹${heldAmount}`);
  };

  const settleMonthlyHold = (s: StaffMember) => {
    if (s.totalHeldBalance <= 0) return;
    
    const amountToPay = s.totalHeldBalance;

    onAddTransaction({
      id: `settle-${Date.now()}-${s.id}`,
      date: new Date().toISOString(),
      amount: amountToPay,
      category: 'Staff - Month End',
      type: TransactionType.EXPENSE,
      paymentMethod: 'CASH',
      notes: `Month-end settlement (held 60%) for ${s.name}`,
      staffId: s.id
    });

    onUpdateStaff({
      ...s,
      totalHeldBalance: 0
    });

    alert(`Settled month-end dues for ${s.name}: ₹${amountToPay}`);
  };

  const exportStaffToExcel = () => {
    const headers = "Name,Phone,Aadhaar,Address,Weekly Pay,Held Balance,Joined Date\n";
    const rows = staff.map(s => 
      `${s.name},${s.phone},${s.aadhaar},"${s.address}",${s.weeklyBasePay},${s.totalHeldBalance},${s.joinedDate}`
    ).join("\n");
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Staff_List_${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div>
          <h3 className="text-xl font-bold">Staff Directory</h3>
          <p className="text-xs text-stone-500">Manage payroll and personal records</p>
        </div>
        <div className="flex gap-2">
           <button 
            onClick={exportStaffToExcel}
            title="Download Staff Excel"
            className="bg-stone-100 text-stone-600 p-2 rounded-full border border-stone-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-amber-600 text-white p-2 rounded-full shadow-lg"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddStaff} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <h4 className="font-bold text-stone-800">New Staff Registration</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Full Name</label>
              <input 
                type="text" 
                value={newStaff.name} 
                onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 outline-none"
                placeholder="Staff Name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Phone Number</label>
              <input 
                type="tel" 
                value={newStaff.phone} 
                onChange={e => setNewStaff({...newStaff, phone: e.target.value})}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 outline-none"
                placeholder="10 Digits"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Weekly Salary (₹)</label>
              <input 
                type="number" 
                value={newStaff.pay} 
                onChange={e => setNewStaff({...newStaff, pay: e.target.value})}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 outline-none"
                placeholder="Amount"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Aadhaar Number</label>
              <input 
                type="text" 
                value={newStaff.aadhaar} 
                onChange={e => setNewStaff({...newStaff, aadhaar: e.target.value})}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 outline-none"
                placeholder="12 Digit Aadhaar"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-stone-500 uppercase">Home Address</label>
              <textarea 
                rows={2}
                value={newStaff.address} 
                onChange={e => setNewStaff({...newStaff, address: e.target.value})}
                className="w-full p-2 bg-stone-50 border border-stone-200 rounded-lg mt-1 outline-none"
                placeholder="Full Address"
              />
            </div>
          </div>
          <button type="submit" className="w-full bg-stone-900 text-white font-bold py-3 rounded-xl">Register Staff</button>
        </form>
      )}

      <div className="space-y-4">
        {staff.map(s => (
          <div key={s.id} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-lg text-stone-800 leading-tight">{s.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                     <span className="text-[10px] font-medium bg-stone-100 text-stone-500 px-2 py-0.5 rounded">ID: {s.id.slice(-4)}</span>
                     <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded">₹{s.weeklyBasePay}/wk</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-stone-400 uppercase">Total Held</p>
                  <p className="text-xl font-black text-amber-600">₹{s.totalHeldBalance}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {s.phone}
                </div>
                <div className="flex items-center gap-2 text-stone-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="7" y1="15" x2="11" y2="15"/><line x1="15" y1="15" x2="17" y2="15"/></svg>
                  {s.aadhaar || 'No Aadhaar'}
                </div>
                <div className="col-span-2 flex items-start gap-2 text-stone-600">
                   <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                   <span className="flex-1 line-clamp-1">{s.address || 'No address added'}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => processWeeklyPay(s)}
                  className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs py-3 rounded-xl transition-colors"
                >
                  Pay 40% (Weekly)
                </button>
                <button 
                  onClick={() => settleMonthlyHold(s)}
                  disabled={s.totalHeldBalance <= 0}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-3 rounded-xl disabled:opacity-30 disabled:bg-stone-200 disabled:text-stone-400 transition-colors"
                >
                  Settle Held 60%
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-amber-900 text-amber-50 p-6 rounded-3xl shadow-lg mt-8 border border-amber-800">
        <h4 className="text-xs font-bold text-amber-400 uppercase mb-4 tracking-widest">Payroll Protocol</h4>
        <div className="space-y-3 text-sm leading-relaxed opacity-90">
          <div className="flex gap-3">
             <span className="w-5 h-5 bg-amber-800 rounded flex items-center justify-center text-[10px]">1</span>
             <p>Weekly payouts are 40% of base salary to maintain liquid cash flow.</p>
          </div>
          <div className="flex gap-3">
             <span className="w-5 h-5 bg-amber-800 rounded flex items-center justify-center text-[10px]">2</span>
             <p>60% is automatically held in "Escrow" for the monthly cumulative payment.</p>
          </div>
          <div className="flex gap-3">
             <span className="w-5 h-5 bg-amber-800 rounded flex items-center justify-center text-[10px]">3</span>
             <p>Escrow payouts are recorded as "Staff - Month End" expenses.</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-amber-800/50 flex justify-between items-end">
           <span className="text-xs font-medium text-amber-400">Total Escrow Liability:</span>
           <span className="text-2xl font-black">₹{staff.reduce((acc, curr) => acc + curr.totalHeldBalance, 0)}</span>
        </div>
      </div>
    </div>
  );
};
