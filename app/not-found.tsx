import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[var(--primary)] mb-4">404</h1>
        <p className="text-xl">Page not found</p>
        <Link href="/" className="text-[var(--primary)] mt-4 inline-block hover:underline">
          Go back home
        </Link>
      </div>
    </div>
  );
}
