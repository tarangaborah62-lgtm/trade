import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI, reviewAPI, complaintAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  pending: 'badge-gold', confirmed: 'badge-blue', shipped: 'badge-purple',
  delivered: 'badge-green', returned: 'badge-red', cancelled: 'badge-muted'
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [reviewModal, setReviewModal] = useState(null);
  const [complaintModal, setComplaintModal] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [complaintForm, setComplaintForm] = useState({ reason: '', type: 'other' });

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = filter ? `status=${filter}` : '';
      const data = await orderAPI.getAll(params);
      setOrders(data.orders);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await orderAPI.updateStatus(orderId, status);
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (err) { toast.error(err.message); }
  };

  const handleReview = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.create({ orderId: reviewModal._id, ...reviewForm });
      toast.success('Review submitted!');
      setReviewModal(null);
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) { toast.error(err.message); }
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    try {
      await complaintAPI.create({ orderId: complaintModal._id, ...complaintForm });
      toast.success('Complaint raised');
      setComplaintModal(null);
      setComplaintForm({ reason: '', type: 'other' });
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'pending', 'confirmed', 'shipped', 'delivered', 'returned', 'cancelled'].map(s => (
          <button key={s} className={`category-chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-page"><div className="spinner" /></div> :
        orders.length === 0 ? (
          <div className="empty-state"><div className="empty-state-icon">📋</div><h3>No orders found</h3></div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {orders.map(order => (
              <div key={order._id} className="card">
                <div className="card-header">
                  <div>
                    <span style={{ fontWeight: 700 }}>Order #{order._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className={`badge ${STATUS_BADGE[order.status]}`}>{order.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                  <div>
                    {order.items?.map((item, i) => (
                      <div key={i} style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                        {item.productName || 'Product'} × {item.quantity} — ₹{item.subtotal?.toLocaleString()}
                      </div>
                    ))}
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {user?.role === 'buyer' ? `Supplier: ${order.supplierId?.businessName}` : `Buyer: ${order.buyerId?.name}`}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {order.discount > 0 && <div style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>Discount: -₹{order.discount.toLocaleString()}</div>}
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-gold)' }}>₹{order.finalAmount?.toLocaleString()}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Commission: ₹{order.commission?.toLocaleString()}</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {/* Supplier actions */}
                  {user?.role === 'supplier' && order.status === 'pending' && (
                    <>
                      <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(order._id, 'confirmed')}>Confirm</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(order._id, 'cancelled')}>Cancel</button>
                    </>
                  )}
                  {user?.role === 'supplier' && order.status === 'confirmed' && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order._id, 'shipped')}>Mark Shipped</button>
                  )}
                  {user?.role === 'supplier' && order.status === 'shipped' && (
                    <button className="btn btn-success btn-sm" onClick={() => handleStatusUpdate(order._id, 'delivered')}>Mark Delivered</button>
                  )}

                  {/* Buyer actions */}
                  {user?.role === 'buyer' && order.status === 'delivered' && (
                    <button className="btn btn-gold btn-sm" onClick={() => setReviewModal(order)}>⭐ Review</button>
                  )}
                  {user?.role === 'buyer' && ['delivered', 'shipped'].includes(order.status) && (
                    <button className="btn btn-danger btn-sm" onClick={() => setComplaintModal(order)}>⚠️ Complaint</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }

      {/* Review Modal */}
      {reviewModal && (
        <div className="modal-overlay" onClick={() => setReviewModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Review Order #{reviewModal._id.slice(-6)}</h3>
              <button className="modal-close" onClick={() => setReviewModal(null)}>×</button>
            </div>
            <form onSubmit={handleReview}>
              <div className="form-group">
                <label>Rating</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setReviewForm(f => ({...f, rating: n}))}
                      style={{ fontSize: '1.5rem', background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewForm.rating ? 'var(--accent-gold)' : 'var(--text-muted)' }}>★</button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Comment</label>
                <textarea className="form-textarea" value={reviewForm.comment} onChange={e => setReviewForm(f => ({...f, comment: e.target.value}))} placeholder="Share your experience..." />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>Submit Review</button>
            </form>
          </div>
        </div>
      )}

      {/* Complaint Modal */}
      {complaintModal && (
        <div className="modal-overlay" onClick={() => setComplaintModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Raise Complaint</h3>
              <button className="modal-close" onClick={() => setComplaintModal(null)}>×</button>
            </div>
            <form onSubmit={handleComplaint}>
              <div className="form-group">
                <label>Type</label>
                <select className="form-select" value={complaintForm.type} onChange={e => setComplaintForm(f => ({...f, type: e.target.value}))}>
                  <option value="quality">Quality Issue</option>
                  <option value="delivery">Delivery Issue</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="damaged">Damaged</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reason</label>
                <textarea className="form-textarea" value={complaintForm.reason} onChange={e => setComplaintForm(f => ({...f, reason: e.target.value}))} placeholder="Describe the issue..." required />
              </div>
              <button className="btn btn-danger" style={{ width: '100%' }}>Submit Complaint</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
