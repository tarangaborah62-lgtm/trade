import { useState, useEffect } from 'react';
import { complaintAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_BADGE = { open: 'badge-red', investigating: 'badge-gold', resolved: 'badge-green', refunded: 'badge-blue', rejected: 'badge-muted' };

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try { const d = await complaintAPI.getAll(); setComplaints(d.complaints); } catch (e) { toast.error(e.message); }
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      {complaints.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No complaints</h3><p>You haven't raised any complaints yet</p></div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {complaints.map(c => (
            <div key={c._id} className="card">
              <div className="card-header">
                <div>
                  <span style={{ fontWeight: 700 }}>Complaint #{c._id.slice(-6)}</span>
                  <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                </div>
                <span className={`badge ${STATUS_BADGE[c.status] || 'badge-muted'}`}>{c.status}</span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Type: {c.type} | Order: #{c.orderId?._id?.slice(-6) || 'N/A'} | Supplier: {c.supplierId?.businessName}
              </div>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.reason}</p>
              <div style={{ marginTop: '0.5rem' }}>
                <span className={`badge ${c.refundStatus === 'completed' ? 'badge-green' : c.refundStatus === 'pending' ? 'badge-gold' : 'badge-muted'}`}>
                  Refund: {c.refundStatus}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
