export default function ContactPage() {
    return (
        <div className="container mx-auto py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-serif font-bold text-[#B5A280] text-center mb-12 uppercase tracking-wide">
                    Contact Us
                </h1>

                <div className="bg-[#FAF9F6] rounded-xl p-8 md:p-12 mb-12 shadow-sm border border-gray-100 text-center relative overflow-hidden">
                    {/* Visual accent line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#B5A280]"></div>

                    <h2 className="text-2xl font-serif font-bold text-[#7C0000] mb-6">Visit Us</h2>

                    <div className="space-y-2">
                        <p className="text-xl font-serif font-bold text-[#7C0000]">Zoha Libas Centre</p>
                        <p className="text-gray-700 font-medium">Star Complex, Sarai Fatak</p>
                        <p className="text-gray-700 font-medium">Govindbagh, Balrampur 271201</p>
                        <p className="text-gray-700 font-medium whitespace-nowrap">Uttar Pradesh, India</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-8">
                    {/* Google Map Iframe Placeholder/Mockup */}
                    <div className="w-full h-[450px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d113645.74872291589!2d82.11586!3d27.31135!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjfCsDE4JzQwLjkiTiA4MsKwMDYnNTcuMSJF!5e0!3m2!1sen!2sin!4v1703410000000!5m2!1sen!2sin"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen={true}
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Store Location"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
