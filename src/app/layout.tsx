'use client';

import React, { useEffect } from 'react';
import './globals.css';
import { usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { UiProvider, useUi } from '@/lib/ui-context';
import { Navbar } from '@/components/navbar';
import { Sidebar } from '@/components/sidebar';
import { AIAssistantWidget } from '@/components/ai/ai-assistant-widget';

/** Routes that use the template's centred auth card instead of the admin shell. */
const AUTH_ROUTES = ['/login', '/register'];

function LayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const { closeSidebar, setAuthBody } = useUi();

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const hasSidebar = isAuthenticated && !!user && !isAuthRoute;

  useEffect(() => {
    setAuthBody(isAuthRoute);
    return () => setAuthBody(false);
  }, [isAuthRoute, setAuthBody]);

  // Login / register / error pages render edge-to-edge with no chrome.
  if (isAuthRoute) return <>{children}</>;

  return (
    <div className={`admin-shell${hasSidebar ? '' : ' shell-public'}`}>
      <div className="sidebar-backdrop" onClick={closeSidebar} aria-hidden="true" />

      {hasSidebar && <Sidebar />}

      <div className="admin-main">
        <Navbar />

        <main className="dashboard-content">
          <div className="container-fluid px-3 px-lg-4 py-4">{children}</div>
        </main>

        <footer className="admin-footer">
          <div className="container-fluid px-3 px-lg-4 d-flex flex-wrap align-items-center justify-content-between gap-2">
            <div>
              <strong>PulseTriage</strong> — Telehealth Appointment &amp; Urgency Auto-Triage System
              <br />
              <small className="text-muted">
                Student: <strong>Ernest Nketia Asubonteng</strong> (Index: <strong>22424715</strong>) • CSCD 602 Capstone
              </small>
            </div>
            <div className="text-end small">
              <span>University of Ghana • Examiner: Prof. Solomon Mensah</span>
              <br />
              <a
                href="https://enasubonteng.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-decoration-none fw-semibold"
              >
                <i className="bi bi-globe me-1" aria-hidden="true" />
                Portfolio: enasubonteng.vercel.app
              </a>
            </div>
          </div>
        </footer>

        {/* 24/7 AI Health Chat Widget (Hidden on home page & auth routes) */}
        {pathname !== '/' && !isAuthRoute && <AIAssistantWidget />}
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" data-bs-theme="light" suppressHydrationWarning>
      <head>
        <title>PulseTriage | Telehealth &amp; Urgency Auto-Triage System</title>
        <meta name="description" content="CSCD 602 Advanced Software Engineering Capstone Examination Project" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/vendors/bootstrap-icons/bootstrap-icons.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body suppressHydrationWarning>
        <UiProvider>
          <AuthProvider>
            <LayoutInner>{children}</LayoutInner>
          </AuthProvider>
        </UiProvider>
      </body>
    </html>
  );
}
