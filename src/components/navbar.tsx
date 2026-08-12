'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ThemeToggle, useUi } from '@/lib/ui-context';
import { getUserNotifications, markNotificationAsRead } from '@/lib/notifications';

const PUBLIC_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About Us' },
  { href: '/features', label: 'Core Capabilities' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/contact', label: 'Contact' },
];

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useUi();

  const [openMenu, setOpenMenu] = useState<'NOTIFICATIONS' | 'PROFILE' | null>(null);
  const [readTick, setReadTick] = useState(0);
  const actionsRef = useRef<HTMLDivElement>(null);

  // Close whichever dropdown is open when the click lands outside the actions.
  useEffect(() => {
    if (!openMenu) return;
    const handleClick = (event: MouseEvent) => {
      if (!actionsRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openMenu]);

  useEffect(() => setOpenMenu(null), [pathname]);

  const notifications = getUserNotifications(user ? user.id : 'guest');
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleLogout = () => {
    logout();
    setOpenMenu(null);
    router.push('/login');
  };

  const handleReadNotification = (id: string) => {
    markNotificationAsRead(id);
    setReadTick(readTick + 1);
  };

  const portalHref = user
    ? user.role === 'PATIENT'
      ? '/patient'
      : user.role === 'DOCTOR'
        ? '/doctor'
        : '/admin'
    : '/';

  return (
    <nav className="navbar admin-navbar navbar-expand bg-white">
      <div className="container-fluid px-3 px-lg-4">
        {isAuthenticated && user ? (
          <button
            className="sidebar-toggle"
            type="button"
            onClick={toggleSidebar}
            aria-controls="adminSidebar"
            aria-label="Toggle sidebar"
          >
            <span />
            <span />
            <span />
          </button>
        ) : (
          <Link className="auth-brand mb-0" href="/" aria-label="PulseTriage home">
            <span className="brand-icon">
              <i className="bi bi-activity" aria-hidden="true" />
            </span>
            <span>
              <strong>PulseTriage</strong>
              <small className="d-none d-sm-block">Telehealth Auto-Triage</small>
            </span>
          </Link>
        )}

        {!isAuthenticated && (
          <div className="public-nav d-none d-lg-flex ms-4">
            {PUBLIC_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className={pathname === link.href ? 'active' : undefined}>
                {link.label}
              </Link>
            ))}
          </div>
        )}

        <div className="navbar-actions ms-auto" ref={actionsRef}>
          <ThemeToggle />

          {!isAuthenticated || !user ? (
            <>
              <Link className="btn btn-outline-secondary btn-sm" href="/login">
                <i className="bi bi-box-arrow-in-right" aria-hidden="true" /> Login
              </Link>
              <Link className="btn btn-primary btn-sm" href="/register">
                <i className="bi bi-person-plus" aria-hidden="true" /> Register
              </Link>
            </>
          ) : (
            <>
              <div className="dropdown">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => setOpenMenu(openMenu === 'NOTIFICATIONS' ? null : 'NOTIFICATIONS')}
                  aria-expanded={openMenu === 'NOTIFICATIONS'}
                  aria-label={`Notifications (${unreadCount} unread)`}
                >
                  {unreadCount > 0 && <span className="notification-dot" />}
                  <i className="bi bi-bell" aria-hidden="true" />
                </button>

                {openMenu === 'NOTIFICATIONS' && (
                  <div className="dropdown-menu notification-menu menu-anchored show">
                    <div className="dropdown-header fw-bold text-body">
                      Notifications ({notifications.length})
                    </div>
                    {notifications.length === 0 && (
                      <span className="dropdown-item-text text-muted small">Nothing to show yet.</span>
                    )}
                    {notifications.map((n) => (
                      <button
                        key={n.id}
                        type="button"
                        className="dropdown-item text-wrap"
                        onClick={() => handleReadNotification(n.id)}
                      >
                        <span className="notification-title">
                          {!n.is_read && <i className="bi bi-dot text-primary" aria-hidden="true" />}
                          {n.title}
                        </span>
                        <span className="notification-time">{n.message}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="dropdown">
                <button
                  className="profile-button dropdown-toggle"
                  type="button"
                  onClick={() => setOpenMenu(openMenu === 'PROFILE' ? null : 'PROFILE')}
                  aria-expanded={openMenu === 'PROFILE'}
                >
                  {user.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="avatar-img avatar-sm" src={user.avatar_url} alt={user.full_name} />
                  ) : (
                    <span className="profile-avatar">{user.full_name.charAt(0)}</span>
                  )}
                  <span className="profile-name d-none d-sm-inline">{user.full_name}</span>
                </button>

                {openMenu === 'PROFILE' && (
                  <ul className="dropdown-menu menu-anchored show">
                    <li className="px-3 py-2">
                      <span className="fw-bold d-block">{user.full_name}</span>
                      <small className="text-muted d-block">{user.email}</small>
                      <span className="badge text-bg-secondary mt-2">{user.role}</span>
                    </li>
                    <li>
                      <hr className="dropdown-divider" />
                    </li>
                    <li>
                      <Link className="dropdown-item" href={portalHref}>
                        <i className="bi bi-speedometer2 me-2" aria-hidden="true" />
                        My Workspace
                      </Link>
                    </li>
                    <li>
                      <button className="dropdown-item text-danger" type="button" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2" aria-hidden="true" />
                        Sign Out
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
