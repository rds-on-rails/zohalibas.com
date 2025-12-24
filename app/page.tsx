'use client';

import { useAuth } from '@/components/auth-provider';
import { ProductCard } from '@/components/ProductCard';

const FEATURED_PRODUCTS = [
  {
    id: '1',
    title: 'Exquisite Silk Saree',
    image: 'https://www.zohalibas.com/images/saree.jpg',
    category: 'Saree'
  },
  {
    id: '2',
    title: 'Regal Bridal Lehenga',
    image: 'https://www.zohalibas.com/images/lehenga.jpg',
    category: 'Lehenga'
  },
  {
    id: '3',
    title: 'Modern White Abaya',
    image: 'https://www.zohalibas.com/images/abaya.jpeg',
    category: 'Abaya'
  },
  {
    id: '4',
    title: 'Elegant Salwar Suit',
    image: 'https://www.zohalibas.com/images/img_1.jpeg',
    category: 'Suit'
  }
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="py-16 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-serif font-bold text-[#7C0000] italic mb-6">
          Zoha Libas – "Where Tradition Meets Elegance...."
        </h2>
        <p className="text-gray-600 text-lg md:text-xl max-w-4xl mx-auto leading-relaxed italic">
          Explore our latest collection and be part of a legacy woven with love and tradition.
        </p>
      </section>

      {/* Featured Collection Section */}
      <section className="container mx-auto px-6 pb-20">
        <div className="flex justify-between items-end mb-10">
          <h3 className="text-2xl font-serif font-bold text-[#7C0000] uppercase tracking-wider">Featured Collection</h3>
          <a href="/collection" className="text-[#B5A280] font-bold uppercase tracking-widest text-sm hover:text-[#7C0000] transition-colors">View All</a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </section>
    </main>
  );
}
