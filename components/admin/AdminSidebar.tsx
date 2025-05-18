'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building, CreditCard, Home } from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  
  const menuItems = [
    { name: 'Dashboard', path: '/admin', icon: <Home size={20} /> },
    { name: 'Industries', path: '/admin/industries', icon: <Building size={20} /> },
    { name: 'Cards', path: '/admin/cards', icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Business Tycoon</h1>
        <p className="text-gray-400 text-sm">Admin Dashboard</p>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                  pathname === item.path 
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      {/* <div className="absolute bottom-4 left-4 right-4">
        <Link
          href="/"
          className="flex items-center px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
        >
          <span className="mr-3">🎮</span>
          Back to Game
        </Link>
      </div> */}
    </div>
  );
}