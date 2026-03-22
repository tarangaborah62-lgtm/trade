import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supplierAPI, productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineCube, HiOutlineClipboardList, HiOutlineCurrencyRupee, HiOutlineStar, HiOutlineShieldCheck, HiOutlinePlus, HiOutlineTrash, HiOutlinePencil } from 'react-icons/hi';

const CATEGORIES = ['clothing', 'electronics', 'grocery', 'furniture', 'beauty', 'sports', 'automotive', 'books', 'toys', 'health', 'home', 'other'];

export default function SupplierDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', description: '', price: '', category: 'clothing', moq: '1', stock: '0', unit: 'piece', discountTiers: '' });
  const [productImages, setProductImages] = useState(null);

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const d = await supplierAPI.getDashboard();
      setData(d);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const d = await productAPI.getMyProducts();
      setProducts(d.products);
    } catch (err) { toast.error(err.message); }
  };

  useEffect(() => { if (tab === 'products') loadProducts(); }, [tab]);

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('name', productForm.name);
      fd.append('description', productForm.description);
      fd.append('price', productForm.price);
      fd.append('category', productForm.category);
      fd.append('moq', productForm.moq);
      fd.append('stock', productForm.stock);
      fd.append('unit', productForm.unit);
      if (productForm.discountTiers) fd.append('discountTiers', productForm.discountTiers);
      if (productImages) {
        for (const f of productImages) fd.append('images', f);
      }

      if (editingProduct) {
        await productAPI.update(editingProduct._id, fd);
        toast.success('Product updated');
      } else {
        await productAPI.create(fd);
        toast.success('Product created');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', category: 'clothing', moq: '1', stock: '0', unit: 'piece', discountTiers: '' });
      setProductImages(null);
      loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      loadProducts();
    } catch (err) { toast.error(err.message); }
  };

  const openEdit = (p) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, description: p.description || '', price: String(p.price),
      category: p.category, moq: String(p.moq), stock: String(p.stock),
      unit: p.unit || 'piece', discountTiers: p.discountTiers?.length ? JSON.stringify(p.discountTiers) : ''
    });
    setShowProductModal(true);
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['dashboard', 'products'].map(t => (
          <button key={t} className={`category-chip ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && data && (
        <>
          {!user?.verified && (
            <div className="card" style={{ borderColor: 'var(--accent-gold)', marginBottom: '1.5rem', background: 'var(--accent-gold-soft)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HiOutlineShieldCheck style={{ fontSize: '1.25rem', color: 'var(--accent-gold)' }} />
                <span style={{ fontWeight: 600, color: 'var(--accent-gold)' }}>Your account is not yet verified. Contact admin for verification.</span>
              </div>
            </div>
          )}

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-icon blue"><HiOutlineCube /></div>
              <div className="stat-card-value">{data.stats.totalProducts}</div>
              <div className="stat-card-label">Total Products</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon gold"><HiOutlineClipboardList /></div>
              <div className="stat-card-value">{data.stats.pendingOrders}</div>
              <div className="stat-card-label">Pending Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon green"><HiOutlineCurrencyRupee /></div>
              <div className="stat-card-value">₹{(data.stats.totalEarnings || 0).toLocaleString()}</div>
              <div className="stat-card-label">Total Earnings</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-icon purple"><HiOutlineStar /></div>
              <div className="stat-card-value">{data.stats.rating?.toFixed(1) || '0.0'}</div>
              <div className="stat-card-label">Rating ({data.stats.totalReviews} reviews)</div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <h3 className="card-title">Recent Orders</h3>
              <Link to="/supplier/orders" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            {data.recentOrders?.length > 0 ? (
              data.recentOrders.map(o => (
                <div key={o._id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <span>#{o._id.slice(-6)} — {o.buyerId?.name}</span>
                  <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>₹{o.finalAmount?.toLocaleString()}</span>
                </div>
              ))
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No orders yet</p>}
          </div>

          {/* Recent Reviews */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>Recent Reviews</h3>
            {data.recentReviews?.length > 0 ? (
              data.recentReviews.map(r => (
                <div key={r._id} style={{ padding: '0.65rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>{r.userId?.name}</span>
                    <span style={{ color: 'var(--accent-gold)' }}>{'★'.repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{r.comment}</p>}
                </div>
              ))
            ) : <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No reviews yet</p>}
          </div>
        </>
      )}

      {tab === 'products' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3>My Products ({products.length})</h3>
            <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setProductForm({ name: '', description: '', price: '', category: 'clothing', moq: '1', stock: '0', unit: 'piece', discountTiers: '' }); setShowProductModal(true); }}>
              <HiOutlinePlus /> Add Product
            </button>
          </div>

          {products.length === 0 ? (
            <div className="empty-state"><div className="empty-state-icon">📦</div><h3>No products yet</h3><p>Click "Add Product" to get started</p></div>
          ) : (
            <div className="product-grid">
              {products.map(p => (
                <div key={p._id} className="product-card">
                  <div className="product-card-image">
                    {p.images?.length > 0 ? (
                      <img src={`http://localhost:5000${p.images[0]}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : '📦'}
                  </div>
                  <div className="product-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <div className="product-card-category">{p.category}</div>
                        <div className="product-card-name">{p.name}</div>
                      </div>
                      <span className={`badge ${p.active ? 'badge-green' : 'badge-muted'}`}>{p.active ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="product-card-price">₹{p.price.toLocaleString()}</div>
                    <div className="product-card-meta">
                      <span>MOQ: {p.moq}</span>
                      <span>Stock: {p.stock}</span>
                    </div>
                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><HiOutlinePencil /> Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}><HiOutlineTrash /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>×</button>
            </div>
            <form onSubmit={handleProductSubmit}>
              <div className="form-group">
                <label>Product Name</label>
                <input className="form-input" value={productForm.name} onChange={e => setProductForm(f => ({...f, name: e.target.value}))} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea className="form-textarea" value={productForm.description} onChange={e => setProductForm(f => ({...f, description: e.target.value}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input className="form-input" type="number" min="0" step="0.01" value={productForm.price} onChange={e => setProductForm(f => ({...f, price: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select className="form-select" value={productForm.category} onChange={e => setProductForm(f => ({...f, category: e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Min Order Qty (MOQ)</label>
                  <input className="form-input" type="number" min="1" value={productForm.moq} onChange={e => setProductForm(f => ({...f, moq: e.target.value}))} required />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input className="form-input" type="number" min="0" value={productForm.stock} onChange={e => setProductForm(f => ({...f, stock: e.target.value}))} required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Unit</label>
                  <select className="form-select" value={productForm.unit} onChange={e => setProductForm(f => ({...f, unit: e.target.value}))}>
                    {['piece', 'kg', 'dozen', 'box', 'carton', 'set'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Images</label>
                  <input className="form-input" type="file" multiple accept="image/*" onChange={e => setProductImages(e.target.files)} />
                </div>
              </div>
              <div className="form-group">
                <label>Discount Tiers (JSON format)</label>
                <input className="form-input" placeholder='[{"minQty": 10, "discountPercent": 5}]' value={productForm.discountTiers} onChange={e => setProductForm(f => ({...f, discountTiers: e.target.value}))} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }}>{editingProduct ? 'Update Product' : 'Create Product'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
