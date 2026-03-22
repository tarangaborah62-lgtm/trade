import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineShoppingBag, HiOutlineTruck } from 'react-icons/hi';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [role, setRole] = useState('buyer');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', businessName: '', businessDescription: '', location: '', whatsapp: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success('Account created successfully!');
      if (user.role === 'supplier') nav('/supplier/dashboard');
      else nav('/browse');
    } catch (err) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>TradeBridge</h1>
          <p>Create your account</p>
        </div>

        <div className="role-selector">
          <button type="button" className={`role-option ${role === 'buyer' ? 'selected' : ''}`} onClick={() => setRole('buyer')}>
            <div className="role-option-icon"><HiOutlineShoppingBag /></div>
            <div className="role-option-label">Buyer</div>
          </button>
          <button type="button" className={`role-option ${role === 'supplier' ? 'selected' : ''}`} onClick={() => setRole('supplier')}>
            <div className="role-option-icon"><HiOutlineTruck /></div>
            <div className="role-option-label">Supplier</div>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input className="form-input" placeholder="John Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>

          {role === 'supplier' && (
            <>
              <div className="form-group">
                <label>Business Name</label>
                <input className="form-input" placeholder="Your Business Name" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Business Description</label>
                <textarea className="form-textarea" placeholder="Describe your business..." value={form.businessDescription} onChange={e => setForm({ ...form, businessDescription: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-input" placeholder="City, State" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input className="form-input" placeholder="+91 98765 43210" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} />
                </div>
              </div>
            </>
          )}

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-divider">Already have an account? <Link to="/login">Sign in</Link></div>
      </div>
    </div>
  );
}
