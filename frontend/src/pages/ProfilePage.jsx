import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    businessName: user?.businessName || '',
    businessDescription: user?.businessDescription || '',
    location: user?.location || '',
    whatsapp: user?.whatsapp || ''
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await authAPI.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    setSaving(false);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <div className="sidebar-user-avatar" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div>
            <h2 style={{ fontSize: '1.25rem' }}>{user?.name}</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</div>
            <span className={`badge ${user?.role === 'supplier' ? 'badge-blue' : user?.role === 'admin' ? 'badge-purple' : 'badge-green'}`} style={{ marginTop: 4 }}>{user?.role}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '1rem' }}>Edit Profile</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} required />
            </div>
          </div>
          {user?.role === 'supplier' && (
            <>
              <div className="form-group">
                <label>Business Name</label>
                <input className="form-input" value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Business Description</label>
                <textarea className="form-textarea" value={form.businessDescription} onChange={e => setForm(f => ({...f, businessDescription: e.target.value}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Location</label>
                  <input className="form-input" value={form.location} onChange={e => setForm(f => ({...f, location: e.target.value}))} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input className="form-input" value={form.whatsapp} onChange={e => setForm(f => ({...f, whatsapp: e.target.value}))} />
                </div>
              </div>
            </>
          )}
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}
