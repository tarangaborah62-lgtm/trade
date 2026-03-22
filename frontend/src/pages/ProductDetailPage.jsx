import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { productAPI, orderAPI, reviewAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineStar, HiOutlineShieldCheck, HiOutlinePhone, HiOutlineChatAlt } from 'react-icons/hi';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await productAPI.getOne(id);
        setProduct(data.product);
        setQuantity(data.product.moq);
        if (data.product.supplierId?._id) {
          const revData = await reviewAPI.getSupplierReviews(data.product.supplierId._id);
          setReviews(revData.reviews);
        }
      } catch (err) { toast.error(err.message); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!product) return <div className="empty-state"><h3>Product not found</h3></div>;

  const supplier = product.supplierId;

  // Calculate price based on discount tiers
  const getDiscountedPrice = () => {
    if (!product.discountTiers?.length) return { total: product.price * quantity, discount: 0 };
    const sortedTiers = [...product.discountTiers].sort((a, b) => b.minQty - a.minQty);
    const tier = sortedTiers.find(t => quantity >= t.minQty);
    if (!tier) return { total: product.price * quantity, discount: 0 };
    const subtotal = product.price * quantity;
    const disc = subtotal * (tier.discountPercent / 100);
    return { total: subtotal - disc, discount: disc, tier };
  };

  const priceCalc = getDiscountedPrice();

  const handleOrder = async () => {
    if (!user) { nav('/login'); return; }
    if (user.role !== 'buyer') { toast.error('Only buyers can place orders'); return; }
    setOrdering(true);
    try {
      await orderAPI.create({
        items: [{ productId: product._id, quantity }],
        shippingAddress: 'Default address'
      });
      toast.success('Order placed successfully!');
      nav('/orders');
    } catch (err) { toast.error(err.message); }
    setOrdering(false);
  };

  return (
    <div>
      <button className="btn btn-secondary btn-sm" onClick={() => nav(-1)} style={{ marginBottom: '1.5rem' }}>← Back</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left - Image */}
        <div>
          <div className="card" style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {product.images?.length > 0 ? (
              <img src={`http://localhost:5000${product.images[0]}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius)' }} />
            ) : (
              <span style={{ fontSize: '5rem' }}>📦</span>
            )}
          </div>
        </div>

        {/* Right - Details */}
        <div>
          <span className="badge badge-blue" style={{ marginBottom: '0.75rem' }}>{product.category}</span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>₹{product.price.toLocaleString()}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/{product.unit || 'piece'}</span>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.7 }}>{product.description}</p>

          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Min Order Qty</span><div style={{ fontWeight: 700 }}>{product.moq} {product.unit || 'pcs'}</div></div>
              <div><span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Available Stock</span><div style={{ fontWeight: 700 }}>{product.stock}</div></div>
            </div>
          </div>

          {product.discountTiers?.length > 0 && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>📊 Bulk Discount Tiers</h4>
              {product.discountTiers.sort((a, b) => a.minQty - b.minQty).map((tier, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <span>Buy {tier.minQty}+ units</span>
                  <span className="badge badge-green">{tier.discountPercent}% off</span>
                </div>
              ))}
            </div>
          )}

          {/* Order Form */}
          {user?.role === 'buyer' && (
            <div className="card" style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Place Order</h4>
              <div className="form-group">
                <label>Quantity (min: {product.moq})</label>
                <input className="form-input" type="number" min={product.moq} max={product.stock} value={quantity}
                  onChange={e => setQuantity(Math.max(product.moq, parseInt(e.target.value) || product.moq))} />
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div className="order-summary-row"><span>Subtotal</span><span>₹{(product.price * quantity).toLocaleString()}</span></div>
                {priceCalc.discount > 0 && (
                  <div className="order-summary-row" style={{ color: 'var(--accent-green)' }}>
                    <span>Discount ({priceCalc.tier.discountPercent}%)</span><span>- ₹{priceCalc.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="order-summary-row total"><span>Total</span><span>₹{priceCalc.total.toLocaleString()}</span></div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={ordering || quantity > product.stock} onClick={handleOrder}>
                {ordering ? 'Placing Order...' : 'Place Bulk Order'}
              </button>
            </div>
          )}

          {/* Supplier Card */}
          {supplier && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="sidebar-user-avatar" style={{ width: 44, height: 44, fontSize: '1rem' }}>{supplier.businessName?.charAt(0)}</div>
                <div>
                  <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {supplier.businessName}
                    {supplier.verified && <HiOutlineShieldCheck style={{ color: 'var(--accent-blue)' }} />}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{supplier.location}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                {supplier.rating > 0 && (
                  <span style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <HiOutlineStar style={{ color: 'var(--accent-gold)' }} /> {supplier.rating.toFixed(1)} ({supplier.totalReviews} reviews)
                  </span>
                )}
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{supplier.totalOrders} orders</span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                {supplier.phone && (
                  <a href={`tel:${supplier.phone}`} className="btn btn-secondary btn-sm"><HiOutlinePhone /> Call</a>
                )}
                {supplier.whatsapp && (
                  <a href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" className="btn btn-success btn-sm"><HiOutlineChatAlt /> WhatsApp</a>
                )}
                <Link to={`/supplier/${supplier._id}`} className="btn btn-secondary btn-sm">View Profile</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Supplier Reviews</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {reviews.map(r => (
              <div key={r._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 600 }}>{r.userId?.name || 'User'}</span>
                  <span className="stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
