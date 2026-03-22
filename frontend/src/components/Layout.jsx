import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiOutlineHome, HiOutlineShoppingBag, HiOutlineCube, HiOutlineClipboardList, HiOutlineStar, HiOutlineExclamationCircle, HiOutlineUsers, HiOutlineChartBar, HiOutlineBell, HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineUser } from 'react-icons/hi';

const buyerLinks = [
  { to: '/browse', icon: <HiOutlineShoppingBag />, label: 'Browse Products' },
  { to: '/orders', icon: <HiOutlineClipboardList />, label: 'My Orders' },
  { to: '/complaints', icon: <HiOutlineExclamationCircle />, label: 'My Complaints' },
];

const supplierLinks = [
  { to: '/supplier/dashboard', icon: <HiOutlineChartBar />, label: 'Dashboard' },
  { to: '/supplier/products', icon: <HiOutlineCube />, label: 'My Products' },
  { to: '/supplier/orders', icon: <HiOutlineClipboardList />, label: 'Orders' },
];

const adminLinks = [
  { to: '/admin/dashboard', icon: <HiOutlineChartBar />, label: 'Dashboard' },
  { to: '/admin/users', icon: <HiOutlineUsers />, label: 'Users' },
  { to: '/admin/orders', icon: <HiOutlineClipboardList />, label: 'All Orders' },
  { to: '/admin/complaints', icon: <HiOutlineExclamationCircle />, label: 'Disputes' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : user?.role === 'supplier' ? supplierLinks : buyerLinks;

  const handleLogout = () => { logout(); nav('/login'); };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>TradeBridge</h1>
          <span>B2B Marketplace</span>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu</div>
          {links.map(link => (
            <Link key={link.to} to={link.to} className={location.pathname === link.to ? 'active' : ''} onClick={() => setSidebarOpen(false)}>
              {link.icon} {link.label}
            </Link>
          ))}
          <div className="sidebar-section-title">Account</div>
          <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''} onClick={() => setSidebarOpen(false)}>
            <HiOutlineUser /> Profile
          </Link>
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} style={{ color: 'var(--accent-red)' }}>
            <HiOutlineLogout /> Logout
          </a>
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role">{user?.role}</div>
          </div>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <HiOutlineX /> : <HiOutlineMenu />}
            </button>
            <h2>{links.find(l => l.to === location.pathname)?.label || 'TradeBridge'}</h2>
          </div>
          <div className="topbar-right">
            <Link to="/notifications" className="notif-btn" title="Notifications">
              <HiOutlineBell />
            </Link>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </div>
    </div>
  );
}
