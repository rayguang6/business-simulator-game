import Link from 'next/link';
import { Building, CreditCard, TrendingUp } from 'lucide-react';
import { getIndustries } from '@/lib/game-data/data-service';
import { getAllCards } from '@/lib/game-data/data-service';

export default async function AdminDashboard() {
  const industries = await getIndustries();
  const cards = await getAllCards();
  
  const stats = [
    { 
      title: 'Industries', 
      value: industries.length.toString(), 
      icon: <Building size={24} />,
      color: 'bg-blue-500',
      link: '/admin/industries'
    },
    { 
      title: 'Cards', 
      value: cards.length.toString(), 
      icon: <CreditCard size={24} />,
      color: 'bg-green-500',
      link: '/admin/cards'
    },
    { 
      title: 'Available Industries', 
      value: industries.filter(i => i.isAvailable).length.toString(), 
      icon: <TrendingUp size={24} />,
      color: 'bg-purple-500',
      link: '/admin/industries'
    }
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Link href={stat.link} key={index}>
            <div className="bg-white rounded-lg shadow-md p-6 transition-transform hover:scale-105">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-700">{stat.title}</h2>
                <div className={`p-3 rounded-full ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Actions</h2>
          <div className="border-t border-gray-200 pt-4">
            <p className="text-gray-700">No recent actions</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Links</h2>
          <div className="space-y-2 border-t border-gray-200 pt-4">
            <Link 
              href="/admin/industries/new" 
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            >
              Add New Industry
            </Link>
            <Link 
              href="/admin/cards/new" 
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            >
              Add New Card
            </Link>
            <Link 
              href="/admin/settings" 
              className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-gray-700"
            >
              Game Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}