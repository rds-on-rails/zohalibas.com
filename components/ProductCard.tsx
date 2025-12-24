'use client';

interface ProductCardProps {
    title: string;
    image: string;
    category: string;
}

export function ProductCard({ title, image, category }: ProductCardProps) {
    return (
        <div className="group bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
            <div className="aspect-[3/4] overflow-hidden">
                <img
                    src={image}
                    alt={title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
            </div>
            <div className="p-4 text-center">
                <span className="text-xs uppercase tracking-widest text-[#B5A280] font-bold mb-1 block">
                    {category}
                </span>
                <h3 className="text-lg font-serif font-medium text-gray-900 group-hover:text-[#7C0000] transition-colors">
                    {title}
                </h3>
            </div>
        </div>
    );
}
