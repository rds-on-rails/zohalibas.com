'use client';

import { ProductCard } from '@/components/ProductCard';

const COLLECTION_IMAGES = [
    { id: '1', title: 'Elegant Salwar Suit', image: 'https://www.zohalibas.com/images/img_1.jpeg', category: 'Suit' },
    { id: '2', title: 'Traditional Ethnic Wear', image: 'https://www.zohalibas.com/images/img_2.jpeg', category: 'Suit' },
    { id: '3', title: 'Graceful Designer Suit', image: 'https://www.zohalibas.com/images/img_3.jpeg', category: 'Suit' },
    { id: '4', title: 'Classic Indian Attire', image: 'https://www.zohalibas.com/images/img_4.jpeg', category: 'Suit' },
    { id: '5', title: 'Premium Collection Suit', image: 'https://www.zohalibas.com/images/img_5.jpeg', category: 'Suit' },
    { id: '6', title: 'Embroidered Elegance', image: 'https://www.zohalibas.com/images/img_6.jpeg', category: 'Suit' },
    { id: '7', title: 'Vibrant Party Wear', image: 'https://www.zohalibas.com/images/img_7.jpeg', category: 'Suit' },
    { id: '8', title: 'Sophisticated Daily Wear', image: 'https://www.zohalibas.com/images/img_8.jpeg', category: 'Suit' },
    { id: '9', title: 'Artisan Crafted Suit', image: 'https://www.zohalibas.com/images/img_9.jpeg', category: 'Suit' },
    { id: '10', title: 'Floral Print Ensemble', image: 'https://www.zohalibas.com/images/img_10.jpeg', category: 'Suit' },
    { id: '11', title: 'Regal Bridal Lehenga', image: 'https://www.zohalibas.com/images/lehenga.jpg', category: 'Lehenga' },
    { id: '12', title: 'Exquisite Silk Saree', image: 'https://www.zohalibas.com/images/saree.jpg', category: 'Saree' },
    { id: '13', title: 'Modern White Abaya', image: 'https://www.zohalibas.com/images/abaya.jpeg', category: 'Abaya' },
    { id: '14', title: 'Designer Celebration Suit', image: 'https://www.zohalibas.com/images/suit.jpg', category: 'Suit' },
];

export default function CollectionPage() {
    return (
        <div className="container mx-auto py-12 px-6">
            <header className="text-center mb-16">
                <h1 className="text-4xl font-serif font-bold text-[#7C0000] mb-4 uppercase tracking-widest">Our Full Collection</h1>
                <p className="text-gray-600 max-w-2xl mx-auto text-lg italic">
                    Explore our curated selection of suits, abayas, lehengas, and sarees—each crafted to reflect tradition and grace.
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {COLLECTION_IMAGES.map((item) => (
                    <ProductCard key={item.id} {...item} />
                ))}
            </div>
        </div>
    );
}
