'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useUi } from '@/lib/ui-context';
import { UserRole } from '@/lib/types';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const ROLE_NAV: Record<UserRole, NavItem[]> = {
  PATIENT: [
    { label: 'Patient Dashboard', href: '/patient', icon: 'bi-speedometer2' },
    { label: 'Start Symptom Triage', href: '/triage', icon: 'bi-activity' },
    { label: 'My Appointments', href: '/patient/appointments', icon: 'bi-calendar-check' },
    { label: 'Book Consultation', href: '/booking', icon: 'bi-calendar-plus' },
    { label: 'My Profile', href: '/profile', icon: 'bi-person-gear' },
  ],
  DOCTOR: [
    { label: 'Clinical Workspace', href: '/doctor', icon: 'bi-speedometer2' },
    { label: 'Works Pending', href: '/doctor/pending', icon: 'bi-hourglass-split' },
    { label: 'Upcoming Works', href: '/doctor/upcoming', icon: 'bi-calendar-event' },
    { label: 'Work Done by Doctor', href: '/doctor/works-done', icon: 'bi-clipboard2-check' },
    { label: 'Already Completed', href: '/doctor/completed', icon: 'bi-check2-circle' },
    { label: 'Clinical AI Suite', href: '/doctor/ai', icon: 'bi-stars' },
    { label: 'Schedule Slot Manager', href: '/doctor/schedule', icon: 'bi-sliders' },
    { label: 'My Profile', href: '/profile', icon: 'bi-person-gear' },
  ],
  ADMIN: [
    { label: 'Executive Center', href: '/admin', icon: 'bi-speedometer2' },
    { label: 'Doctor Operations', href: '/admin/doctors', icon: 'bi-person-badge' },
    { label: 'Patient Records', href: '/admin/patients', icon: 'bi-people' },
    { label: 'Triage Rules Engine', href: '/admin/rules', icon: 'bi-sliders' },
    { label: 'System Audit Logs', href: '/admin/audit', icon: 'bi-file-earmark-text' },
    { label: 'My Profile', href: '/profile', icon: 'bi-person-gear' },
  ],
};

const ROLE_SUBTITLE: Record<UserRole, string> = {
  PATIENT: 'Patient Portal',
  DOCTOR: 'Clinical Workspace',
  ADMIN: 'Operations Center',
};

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { closeSidebar } = useUi();

  if (!isAuthenticated || !user) return null;

  const navItems = ROLE_NAV[user.role];
  const homeHref = navItems[0].href;

  return (
    <aside className="admin-sidebar" id="adminSidebar" aria-label="Main navigation">
      <div className="sidebar-header">
        <Link className="brand-mark" href={homeHref} aria-label="PulseTriage workspace">
          <span className="brand-icon">
            <i className="bi bi-activity" aria-hidden="true" />
          </span>
          <span className="brand-copy">
            <span className="brand-title">PulseTriage</span>
            <span className="brand-subtitle">{ROLE_SUBTITLE[user.role]}</span>
          </span>
        </Link>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              className={`nav-link${active ? ' active' : ''}`}
              href={item.href}
              onClick={closeSidebar}
              aria-current={active ? 'page' : undefined}
              title={item.label}
            >
              <span className="nav-icon">
                <i className={`bi ${item.icon}`} aria-hidden="true" />
              </span>
              <span className="nav-text">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <span className="status-dot" />
        <span className="sidebar-footer-text">Triage engine online</span>
      </div>
    </aside>
  );
};
