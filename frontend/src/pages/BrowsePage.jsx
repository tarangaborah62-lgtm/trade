import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineSearch, HiOutlineStar, HiOutlineShieldCheck } from 'react-icons/hi';

const CATEGORIES = ['all', 'clothing', 'electronics', 'grocery', 'furniture', 'beauty', 'sports', 'automotive', 'books', 'toys', 'health', 'home', 'other'];

export default function BrowsePage() {
  const nav = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => { fetchProducts(); }, [category, sort, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 12, sort });
      if (category !== 'all') params.set('category', category);
      if (search) params.set('search', search);
      const data = await productAPI.getAll(params.toString());
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (err) { toast.error(err.message); }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  return (
    <>
      <form onSubmit={handleSearch} className="search-bar">
        <div className="search-input-wrap">
          <HiOutlineSearch />
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={sort} onChange={e => { setSort(e.target.value); setPage(1); }}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
        <button type="submit" className="btn btn-primary">Search</button>
      </form>

      <div className="category-chips">
        {CATEGORIES.map(cat => (
          <button key={cat} className={`category-chip ${category === cat ? 'active' : ''}`}
            onClick={() => { setCategory(cat); setPage(1); }}>
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-page"><div className="spinner" /></div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <h3>No products found</h3>
          <p>Try different search terms or categories</p>
        </div>
      ) : (
        <>
          <div className="product-grid">
            {products.map(p => (
              <div key={p._id} className="product-card" onClick={() => nav(`/products/${p._id}`)}>
                <div className="product-card-image">
                  {p.images?.length > 0 ? (
                    <img src={`http://localhost:5000${p.images[0]}`} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : '📦'}
                </div>
                <div className="product-card-body">
                  <div className="product-card-category">{p.category}</div>
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-price">₹{p.price.toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{p.unit || 'piece'}</span></div>
                  <div className="product-card-meta">
                    <span>MOQ: {p.moq}</span>
                    {p.discountTiers?.length > 0 && <span className="badge badge-green">Bulk Discounts</span>}
                    <span>Stock: {p.stock}</span>
                  </div>
                  {p.supplierId && (
                    <div className="product-card-supplier">
                      {p.supplierId.verified && <HiOutlineShieldCheck style={{ color: 'var(--accent-blue)' }} />}
                      <span>{p.supplierId.businessName || 'Unknown'}</span>
                      {p.supplierId.rating > 0 && (
                        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <HiOutlineStar style={{ color: 'var(--accent-gold)' }} /> {p.supplierId.rating.toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {pagination.pages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
              {Array.from({ length: pagination.pages }, (_, i) => (
                <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
