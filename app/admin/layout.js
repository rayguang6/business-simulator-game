// app/admin/layout.js
import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <AdminNav />
      <main>
        {children}
      </main>
    </div>
  );
}