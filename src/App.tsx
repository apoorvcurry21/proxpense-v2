import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Send, History, PlusCircle, RefreshCw } from 'lucide-react';
import './index.css';

const API_BASE = 'http://localhost:3000';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '');
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (userId) {
      fetchData();
      localStorage.setItem('userId', userId);
    }
  }, [userId]);

  const fetchData = async () => {
    if (!userId) return;
    try {
      const walletRes = await axios.get(`${API_BASE}/wallets/${userId}`);
      setWallet(walletRes.data);
      const hostRes = await axios.get(`${API_BASE}/transactions/${userId}`);
      setTransactions(hostRes.data);
    } catch (err) {
      console.error('Error fetching data', err);
    }
  };

  const createWallet = async () => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/wallets`, { userId, initialBalance: 1000 });
      fetchData();
      setMessage({ text: 'Wallet created with $1000!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to create wallet', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiverId || !amount) return;
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/transfer`, {
        senderId: userId,
        receiverId,
        amount: parseFloat(amount),
      });
      setMessage({ text: 'Transfer initiated! Please wait for updates.', type: 'info' });
      setAmount('');
      setReceiverId('');
      // Poll for update after a few seconds
      setTimeout(fetchData, 3000);
    } catch (err) {
      setMessage({ text: 'Transfer failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="glass-card" style={{ maxWidth: '400px', margin: '100px auto' }}>
        <h1>Welcome</h1>
        <p className="dim">Enter User ID to get started</p>
        <div style={{ margin: '1.5rem 0' }}>
          <input
            className="input"
            placeholder="e.g. user_123"
            onKeyDown={(e) => e.key === 'Enter' && setUserId((e.target as any).value)}
          />
        </div>
        <button className="btn" style={{ width: '100%' }} onClick={() => {
          const val = (document.querySelector('.input') as any).value;
          if (val) setUserId(val);
        }}>
          Get Started
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="balance-card">
        <p className="dim" style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Current Balance</p>
        <h1 style={{ fontSize: '3.5rem', margin: 0 }}>
          {wallet ? `$${wallet.balance.toLocaleString()}` : 'No Wallet'}
        </h1>
        <p className="dim" style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.5rem' }}>
          UID: {userId}
        </p>
        {!wallet && (
          <button className="btn" style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.2)' }} onClick={createWallet} disabled={loading}>
            <PlusCircle size={18} /> Create New Wallet
          </button>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2><Send size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> Transfer</h2>
          </div>
          <form onSubmit={handleTransfer}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label className="dim" style={{ display: 'block', marginBottom: '0.5rem' }}>To (Receiver ID)</label>
              <input
                className="input"
                placeholder="Receiver User ID"
                value={receiverId}
                onChange={(e) => setReceiverId(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="dim" style={{ display: 'block', marginBottom: '0.5rem' }}>Amount ($)</label>
              <input
                className="input"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <button className="btn" style={{ width: '100%' }} disabled={loading || !wallet}>
              {loading ? 'Processing...' : 'Send Money'}
            </button>
          </form>
          {message.text && (
            <div style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              borderRadius: '0.5rem', 
              background: message.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: message.type === 'error' ? '#ef4444' : '#10b981',
              fontSize: '0.9rem'
            }}>
              {message.text}
            </div>
          )}
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2><History size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} /> History</h2>
            <button className="btn" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--glass-border)' }} onClick={fetchData}>
              <RefreshCw size={16} />
            </button>
          </div>
          <div className="txn-list">
            {transactions.length === 0 ? (
              <p className="dim" style={{ textAlign: 'center', padding: '2rem' }}>No transactions found</p>
            ) : (
              transactions.map((t: any) => (
                <div key={t.id} className="txn-item">
                  <div>
                    <p style={{ fontWeight: 600 }}>{t.senderId === userId ? `To: ${t.receiverId}` : `From: ${t.senderId}`}</p>
                    <p className="dim">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className={t.senderId === userId ? 'amount-minus' : 'amount-plus'} style={{ fontWeight: 'bold' }}>
                      {t.senderId === userId ? '-' : '+'}${t.amount.toLocaleString()}
                    </div>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      marginTop: '0.2rem',
                      color: t.status === 'SUCCESS' ? '#10b981' : '#ef4444',
                      textTransform: 'uppercase',
                      fontWeight: 'bold'
                    }}>
                      {t.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="btn" style={{ background: 'transparent', color: 'var(--text-dim)' }} onClick={() => {
          localStorage.clear();
          window.location.reload();
        }}>
          Logout / Switch User
        </button>
      </div>
    </div>
  );
}

export default App;
