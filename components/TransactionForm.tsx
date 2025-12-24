
import React, { useState, useEffect } from 'react';
import { TransactionType, PaymentMethod, Transaction } from '../types';
import { CATEGORIES, PAYMENT_METHODS } from '../constants';

interface TransactionFormProps {
  onAdd: (transaction: Transaction) => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAdd, editingTransaction, onCancelEdit }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.INCOME);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES.INCOME[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [notes, setNotes] = useState('');

  // Sync state if we are in "Edit Mode"
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setNotes(editingTransaction.notes || '');
    } else {
      // Reset to defaults for fresh entry
      setType(TransactionType.INCOME);
      setAmount('');
      setCategory(CATEGORIES.INCOME[0]);
      setPaymentMethod('CASH');
      setNotes('');
    }
  }, [editingTransaction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;

    const transactionData: Transaction = {
      id: editingTransaction ? editingTransaction.id : Date.now().toString(),
      date: editingTransaction ? editingTransaction.date : new Date().toISOString(),
      amount: Number(amount),
      category,
      type,
      paymentMethod,
      notes,
      staffId: editingTransaction?.staffId
    };

    onAdd(transactionData);
    
    // Clear form if not editing
    if (!editingTransaction) {
      setAmount('');
      setNotes('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-6 rounded-2xl shadow-sm border ${editingTransaction ? 'border-amber-500 ring-2 ring-amber-100' : 'border-stone-200'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <span className={`w-2 h-6 rounded-full ${editingTransaction ? 'bg-amber-600' : 'bg-amber-500'}`}></span>
          {editingTransaction ? 'Edit Entry' : 'Add Daily Log'}
        </h3>
        {editingTransaction && (
          <button 
            type="button" 
            onClick={onCancelEdit}
            className="text-xs font-bold text-stone-400 hover:text-stone-600 underline"
          >
            Cancel
          </button>
        )}
      </div>
      
      <div className="flex gap-2 mb-4 bg-stone-100 p-1 rounded-lg">
        <button
          type="button"
          onClick={() => { setType(TransactionType.INCOME); setCategory(CATEGORIES.INCOME[0]); }}
          className={`flex-1 py-2 rounded-md font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-green-600' : 'text-stone-500'}`}
        >
          Income
        </button>
        <button
          type="button"
          onClick={() => { setType(TransactionType.EXPENSE); setCategory(CATEGORIES.EXPENSE[0]); }}
          className={`flex-1 py-2 rounded-md font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-600' : 'text-stone-500'}`}
        >
          Expense
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-xl font-bold"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none"
          >
            {type === TransactionType.INCOME 
              ? CATEGORIES.INCOME.map(c => <option key={c} value={c}>{c}</option>)
              : CATEGORIES.EXPENSE.map(c => <option key={c} value={c}>{c}</option>)
            }
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Payment Method</label>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map(pm => (
              <button
                key={pm.id}
                type="button"
                onClick={() => setPaymentMethod(pm.id as PaymentMethod)}
                className={`p-2 rounded-lg border text-sm transition-all ${paymentMethod === pm.id ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-600'}`}
              >
                {pm.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-500 uppercase mb-1">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl outline-none"
            placeholder="Optional detail..."
          />
        </div>

        <button
          type="submit"
          className={`w-full text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${editingTransaction ? 'bg-amber-700 hover:bg-amber-800 shadow-amber-100' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-200'}`}
        >
          {editingTransaction ? 'Update Entry' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};
