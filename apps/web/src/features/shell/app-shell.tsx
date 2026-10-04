'use client';

import { useAuth } from '../auth/auth-provider';
import { CapabilityGate } from '../auth/capability-gate';
import { StaffManagement } from '../admin/staff-management';
import { ReferenceDataManagement } from '../admin/reference-data-management';
import { CatalogueManagement } from '../catalogue/catalogue-management';
import { MenuCategoryManagement } from '../catalogue/menu-category-management';
import { CompanyManagement } from '../companies/company-management';
import { EmployeeManagement } from '../companies/employee-management';
import { PricingManagement } from '../pricing/pricing-management';
import { CompanyCalendar } from '../companies/company-calendar';
import { MenuPreview } from '../menu/menu-preview';
import { Badge, Button, PageHeader } from '../../components/ui';

export function AppShell() {
  const { user, logout, can } = useAuth();
  const navigation = [
    { id: 'overview', label: 'Overview', visible: true },
    { id: 'orders', label: 'Orders', visible: can('order.read') },
    { id: 'catalogue', label: 'Catalogue', visible: can('catalogue.read') },
    { id: 'companies', label: 'Companies', visible: can('company.read') },
    { id: 'pricing', label: 'Pricing', visible: can('billing.read') || can('catalogue.manage') },
    { id: 'team', label: 'Staff', visible: can('staff.manage') },
  ].filter((item) => item.visible);
  function goTo(section: string) {
    document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="brand-lockup"><span className="brand-mark">F</span><div><strong>Fernleaf</strong><small>Kitchen ops</small></div></div>
        <nav aria-label="Workspace navigation">
          {navigation.map((item, index) => <button className={index === 0 ? 'nav-active' : ''} key={item.id} type="button" onClick={() => goTo(item.id)}>{item.label}</button>)}
        </nav>
        <div className="sidebar-footer"><span>Signed in as</span><strong>{user?.name}</strong><Badge tone="info">{user?.role}</Badge></div>
      </aside>
      <section className="dashboard-content">
        <header className="topbar" id="overview">
          <PageHeader eyebrow="Today’s workspace" title={`Good to see you, ${user?.name ?? 'team'}.`} description="A clear view of the work that keeps service moving." />
          <Button variant="secondary" onClick={() => void logout()}>Sign out</Button>
        </header>
        <CapabilityGate capability="order.read">
          <section className="welcome-card">
            <p className="eyebrow">Operations dashboard</p>
            <h2>Your kitchen, in sync.</h2>
            <p className="muted">Your workspace is ready for the next service.</p>
          </section>
        </CapabilityGate>
        <section id="orders" className="welcome-card section-anchor">
          <p className="eyebrow">Orders</p>
          <h2>Service operations are coming next.</h2>
          <p className="muted">Your menu, company, and pricing foundations are ready for the order workflow.</p>
        </section>
        <div id="team" className="section-anchor"><StaffManagement /></div>
        <div id="catalogue" className="section-anchor"><ReferenceDataManagement /><CatalogueManagement /><MenuCategoryManagement /></div>
        <div id="companies" className="section-anchor"><CompanyManagement /><EmployeeManagement /></div>
        <div id="pricing" className="section-anchor"><PricingManagement /><CompanyCalendar /><MenuPreview /></div>
      </section>
    </main>
  );
}
