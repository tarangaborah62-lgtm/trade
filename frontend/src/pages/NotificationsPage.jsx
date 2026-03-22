import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineBell } from 'react-icons/hi';

const TYPE_COLORS = { order: 'badge-blue', review: 'badge-gold', complaint: 'badge-red', system: 'badge-muted', verification: 'badge-green' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const d = await notificationAPI.getAll();
        setNotifications(d.notifications);
        setUnread(d.unreadCount);
      } catch (e) { toast.error(e.message); }
      setLoading(false);
    };
    load();
  }, []);

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(n => n.map(x => ({ ...x, read: true })));
      setUnread(0);
      toast.success('All marked as read');
    } catch (e) { toast.error(e.message); }
  };

  const markRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(n => n.map(x => x._id === id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>Notifications {unread > 0 && <span className="badge badge-red" style={{ marginLeft: '0.5rem' }}>{unread} unread</span>}</h3>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}>Mark All Read</button>}
      </div>

      {notifications.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon"><HiOutlineBell /></div><h3>No notifications</h3></div>
      ) : (
        <div style={{ display: 'grid', gap: '0.5rem' }}>
          {notifications.map(n => (
            <div key={n._id} className="card" style={{ opacity: n.read ? 0.6 : 1, cursor: n.read ? 'default' : 'pointer', padding: '1rem' }}
              onClick={() => !n.read && markRead(n._id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-blue)', flexShrink: 0 }} />}
                  <div>
                    <span style={{ fontSize: '0.9rem' }}>{n.message}</span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                </div>
                <span className={`badge ${TYPE_COLORS[n.type] || 'badge-muted'}`}>{n.type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
