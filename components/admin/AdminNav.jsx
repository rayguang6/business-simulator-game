// components/admin/AdminNav.jsx
import Link from 'next/link';

export default function AdminNav() {
  return (
    <nav className="bg-gray-800 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/admin" className="font-medium">
            Dashboard
          </Link>
          <Link href="/admin/cards/new" className="text-gray-300 hover:text-white">
            New Card
          </Link>
          <Link href="/" className="text-gray-300 hover:text-white">
            Back to Game
          </Link>
        </div>
        <div className="text-sm text-gray-400">
          Business Tycoon Admin
        </div>
      </div>
    </nav>
  );
}