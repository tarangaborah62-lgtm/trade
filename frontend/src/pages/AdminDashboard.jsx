import { useState, useEffect } from 'react';
import { adminAPI, complaintAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineUsers, HiOutlineCube, HiOutlineClipboardList, HiOutlineCurrencyRupee, HiOutlineExclamationCircle, HiOutlineShieldCheck, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const STATUS_BADGE = { pending: 'badge-gold', confirmed: 'badge-blue', shipped: 'badge-purple', delivered: 'badge-green', returned: 'badge-red', cancelled: 'badge-muted' };

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard');
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [resolveModal, setResolveModal] = useState(null);
  const [resolveForm, setResolveForm] = useState({ status: 'resolved', refundStatus: 'none', adminNotes: '' });

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { if (tab === 'users') loadUsers(); }, [tab, roleFilter]);
  useEffect(() => { if (tab === 'orders') loadOrders(); }, [tab]);
  useEffect(() => { if (tab === 'complaints') loadComplaints(); }, [tab]);

  const loadDashboard = async () => { try { const d = await adminAPI.getDashboard(); setData(d); } catch (e) { toast.error(e.message); } setLoading(false); };
  const loadUsers = async () => { try { const d = await adminAPI.getUsers(roleFilter ? `role=${roleFilter}` : ''); setUsers(d.users); } catch (e) { toast.error(e.message); } };
  const loadOrders = async () => { try { const d = await adminAPI.getOrders(); setOrders(d.orders); } catch (e) { toast.error(e.message); } };
  const loadComplaints = async () => { try { const d = await adminAPI.getComplaints(); setComplaints(d.complaints); } catch (e) { toast.error(e.message); } };

  const handleVerify = async (id) => {
    try { await adminAPI.verifySupplier(id); toast.success('Updated'); loadUsers(); } catch (e) { toast.error(e.message); }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.resolve(resolveModal._id, resolveForm);
      toast.success('Complaint resolved');
      setResolveModal(null);
      loadComplaints();
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['dashboard', 'users', 'orders', 'complaints'].map(t => (
          <button key={t} className={`category-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && data && (
        <>
          <div className="stats-grid">
            <div className="stat-card"><div className="stat-card-icon blue"><HiOutlineUsers /></div><div className="stat-card-value">{data.stats.totalUsers}</div><div className="stat-card-label">Total Users</div></div>
            <div className="stat-card"><div className="stat-card-icon green"><HiOutlineUsers /></div><div className="stat-card-value">{data.stats.totalSuppliers}</div><div className="stat-card-label">Suppliers</div></div>
            <div className="stat-card"><div className="stat-card-icon purple"><HiOutlineUsers /></div><div className="stat-card-value">{data.stats.totalBuyers}</div><div className="stat-card-label">Buyers</div></div>
            <div className="stat-card"><div className="stat-card-icon gold"><HiOutlineCube /></div><div className="stat-card-value">{data.stats.totalProducts}</div><div className="stat-card-label">Products</div></div>
            <div className="stat-card"><div className="stat-card-icon blue"><HiOutlineClipboardList /></div><div className="stat-card-value">{data.stats.totalOrders}</div><div className="stat-card-label">Total Orders</div></div>
            <div className="stat-card"><div className="stat-card-icon green"><HiOutlineCurrencyRupee /></div><div className="stat-card-value">₹{(data.stats.totalCommission || 0).toLocaleString()}</div><div className="stat-card-label">Platform Revenue</div></div>
            <div className="stat-card"><div className="stat-card-icon gold"><HiOutlineCurrencyRupee /></div><div className="stat-card-value">₹{(data.stats.totalRevenue || 0).toLocaleString()}</div><div className="stat-card-label">Total GMV</div></div>
            <div className="stat-card"><div className="stat-card-icon red"><HiOutlineExclamationCircle /></div><div className="stat-card-value">{data.stats.openComplaints}</div><div className="stat-card-label">Open Disputes</div></div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Recent Orders</h3>
            {data.recentOrders?.map(o => (
              <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                <span>#{o._id.slice(-6)} — {o.buyerId?.name} → {o.supplierId?.businessName}</span>
                <span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'users' && (
        <>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['', 'buyer', 'supplier', 'admin'].map(r => (
              <button key={r} className={`category-chip ${roleFilter === r ? 'active' : ''}`} onClick={() => setRoleFilter(r)}>{r || 'All'}</button>
            ))}
          </div>
          <div className="table-container">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Verified</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}{u.businessName ? ` (${u.businessName})` : ''}</td>
                    <td>{u.email}</td>
                    <td><span className={`badge ${u.role === 'supplier' ? 'badge-blue' : u.role === 'admin' ? 'badge-purple' : 'badge-green'}`}>{u.role}</span></td>
                    <td>{u.verified ? <HiOutlineCheck style={{ color: 'var(--accent-green)' }} /> : <HiOutlineX style={{ color: 'var(--text-muted)' }} />}</td>
                    <td>
                      {u.role === 'supplier' && (
                        <button className={`btn btn-sm ${u.verified ? 'btn-danger' : 'btn-success'}`} onClick={() => handleVerify(u._id)}>
                          <HiOutlineShieldCheck /> {u.verified ? 'Revoke' : 'Verify'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'orders' && (
        <div className="table-container">
          <table className="table">
            <thead><tr><th>Order ID</th><th>Buyer</th><th>Supplier</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
            <tbody>
              {orders.map(o => (
                <tr key={o._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{o._id.slice(-6)}</td>
                  <td>{o.buyerId?.name}</td>
                  <td>{o.supplierId?.businessName}</td>
                  <td style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>₹{o.finalAmount?.toLocaleString()}</td>
                  <td>₹{o.commission?.toLocaleString()}</td>
                  <td><span className={`badge ${STATUS_BADGE[o.status]}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'complaints' && (
        <>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {complaints.length === 0 ? (
              <div className="empty-state"><div className="empty-state-icon">✅</div><h3>No disputes</h3></div>
            ) : complaints.map(c => (
              <div key={c._id} className="card">
                <div className="card-header">
                  <div>
                    <span style={{ fontWeight: 700 }}>Complaint #{c._id.slice(-6)}</span>
                    <span style={{ marginLeft: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <span className={`badge ${c.status === 'open' ? 'badge-red' : c.status === 'investigating' ? 'badge-gold' : 'badge-green'}`}>{c.status}</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  <strong>Type:</strong> {c.type} | <strong>By:</strong> {c.userId?.name} | <strong>Supplier:</strong> {c.supplierId?.businessName}
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{c.reason}</p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <span className={`badge ${c.refundStatus === 'completed' ? 'badge-green' : c.refundStatus === 'pending' ? 'badge-gold' : 'badge-muted'}`}>Refund: {c.refundStatus}</span>
                  {['open', 'investigating'].includes(c.status) && (
                    <button className="btn btn-primary btn-sm" onClick={() => { setResolveModal(c); setResolveForm({ status: 'resolved', refundStatus: 'none', adminNotes: '' }); }}>Resolve</button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {resolveModal && (
            <div className="modal-overlay" onClick={() => setResolveModal(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3 className="modal-title">Resolve Complaint</h3>
                  <button className="modal-close" onClick={() => setResolveModal(null)}>×</button>
                </div>
                <form onSubmit={handleResolve}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Status</label>
                      <select className="form-select" value={resolveForm.status} onChange={e => setResolveForm(f => ({...f, status: e.target.value}))}>
                        <option value="investigating">Investigating</option>
                        <option value="resolved">Resolved</option>
                        <option value="rejected">Rejected</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Refund Status</label>
                      <select className="form-select" value={resolveForm.refundStatus} onChange={e => setResolveForm(f => ({...f, refundStatus: e.target.value}))}>
                        <option value="none">None</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Admin Notes</label>
                    <textarea className="form-textarea" value={resolveForm.adminNotes} onChange={e => setResolveForm(f => ({...f, adminNotes: e.target.value}))} />
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }}>Update Complaint</button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
