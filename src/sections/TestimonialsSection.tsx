const testimonials = [
  {
    quote: 'EventoraX cut our registration time by 80%. Absolutely game-changing.',
    author: 'Sarah M.',
    role: 'University Coordinator',
    avatar: '/images/avatar-1.jpg',
  },
  {
    quote: 'The certificate automation alone saved us 40 hours per event.',
    author: 'James K.',
    role: 'Conference Organizer',
    avatar: '/images/avatar-2.jpg',
  },
  {
    quote: 'Finally, a platform that understands multi-tenancy.',
    author: 'Priya R.',
    role: 'NGO Director',
    avatar: '/images/avatar-3.jpg',
  },
  {
    quote: 'QR check-in was seamless. Our attendees loved it.',
    author: 'David L.',
    role: 'Corporate Events',
    avatar: '/images/avatar-4.jpg',
  },
  {
    quote: 'Beautiful ID cards generated in seconds. Professional quality.',
    author: 'Aisha N.',
    role: 'Workshop Host',
    avatar: '/images/avatar-5.jpg',
  },
  {
    quote: 'The analytics dashboard gave us insights we never had before.',
    author: 'Mark T.',
    role: 'Festival Director',
    avatar: '/images/avatar-6.jpg',
  },
];

function TestimonialCard({ quote, author, role, avatar }: typeof testimonials[0]) {
  return (
    <div
      className="bg-white rounded-2xl p-8 min-h-[200px] border border-[#e9e4ff] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    >
      <div className="mb-4">
        <span className="text-4xl text-[#ddd6fe] font-serif leading-none">"</span>
      </div>
      <p
        className="font-heading text-lg md:text-xl italic mb-5 leading-relaxed text-[#0f172a]"
      >
        {quote}
      </p>
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={avatar}
            alt={author}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-transparent hover:ring-[#ddd6fe] transition-all duration-200"
          />
        </div>
        <div>
          <p className="font-body text-sm font-semibold text-[#0f172a]">
            {author}
          </p>
          <p className="font-body text-xs text-[#94a3b8]">
            {role}
          </p>
        </div>
      </div>
    </div>
  );
}

function TestimonialColumn({
  items,
  direction,
  speed,
}: {
  items: typeof testimonials;
  direction: 'up' | 'down';
  speed: number;
}) {
  const animationClass = direction === 'up' ? 'ticker-col-up' : 'ticker-col-down';
  return (
    <div className="overflow-hidden relative" style={{ height: 600 }}>
      <div
        className={`flex flex-col gap-6 ${animationClass}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {/* Duplicate content for seamless loop */}
        {[...items, ...items].map((t, i) => (
          <TestimonialCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  const col1 = [testimonials[0], testimonials[3], testimonials[0], testimonials[3]];
  const col2 = [testimonials[1], testimonials[4], testimonials[1], testimonials[4]];
  const col3 = [testimonials[2], testimonials[5], testimonials[2], testimonials[5]];

  return (
    <section className="bg-[#faf8ff] section-padding overflow-hidden">
      <div className="content-max">
        <h2
          className="font-heading text-3xl md:text-5xl font-bold text-center mb-12 md:mb-16 tracking-[-0.02em] text-[#0f172a]"
        >
          Loved by event organizers worldwide
        </h2>

        <div className="ticker-grid grid grid-cols-1 md:grid-cols-3 gap-6" style={{ height: 600 }}>
          <TestimonialColumn items={col1} direction="down" speed={25} />
          <TestimonialColumn items={col2} direction="up" speed={30} />
          <TestimonialColumn items={col3} direction="down" speed={28} />
        </div>
      </div>
    </section>
  );
}