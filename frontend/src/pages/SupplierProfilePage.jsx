import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supplierAPI, reviewAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineStar, HiOutlineShieldCheck, HiOutlinePhone, HiOutlineChatAlt, HiOutlineLocationMarker } from 'react-icons/hi';

export default function SupplierProfilePage() {
  const { id } = useParams();
  const [supplier, setSupplier] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await supplierAPI.getProfile(id);
        setSupplier(data.supplier);
        setProducts(data.products);
        setReviews(data.reviews);
      } catch (err) { toast.error(err.message); }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!supplier) return <div className="empty-state"><h3>Supplier not found</h3></div>;

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div className="sidebar-user-avatar" style={{ width: 72, height: 72, fontSize: '1.75rem' }}>{supplier.businessName?.charAt(0)}</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.4rem' }}>
              {supplier.businessName}
              {supplier.verified && <span className="verified-badge"><HiOutlineShieldCheck /> Verified</span>}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>{supplier.businessDescription}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              {supplier.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HiOutlineLocationMarker /> {supplier.location}</span>}
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><HiOutlineStar style={{ color: 'var(--accent-gold)' }} /> {supplier.rating?.toFixed(1)} ({supplier.totalReviews} reviews)</span>
              <span>{supplier.totalOrders} orders completed</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              {supplier.phone && <a href={`tel:${supplier.phone}`} className="btn btn-secondary btn-sm"><HiOutlinePhone /> Call</a>}
              {supplier.whatsapp && <a href={`https://wa.me/${supplier.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener" className="btn btn-success btn-sm"><HiOutlineChatAlt /> WhatsApp</a>}
            </div>
          </div>
        </div>
      </div>

      {products.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1rem' }}>Products</h3>
          <div className="product-grid" style={{ marginBottom: '2rem' }}>
            {products.map(p => (
              <Link key={p._id} to={`/products/${p._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="product-card">
                  <div className="product-card-image">{p.images?.length > 0 ? <img src={`http://localhost:5000${p.images[0]}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}</div>
                  <div className="product-card-body">
                    <div className="product-card-category">{p.category}</div>
                    <div className="product-card-name">{p.name}</div>
                    <div className="product-card-price">₹{p.price.toLocaleString()}</div>
                    <div className="product-card-meta"><span>MOQ: {p.moq}</span><span>Stock: {p.stock}</span></div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}

      {reviews.length > 0 && (
        <>
          <h3 style={{ marginBottom: '1rem' }}>Reviews</h3>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {reviews.map(r => (
              <div key={r._id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600 }}>{r.userId?.name}</span>
                  <span style={{ color: 'var(--accent-gold)' }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                </div>
                {r.comment && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
