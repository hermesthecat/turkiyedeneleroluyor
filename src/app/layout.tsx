import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Türkiye\'de Neler Oluyor',
  description: 'Türkiye\'deki güncel haberlerin özet ve analizleri',
  authors: [{ name: 'A. Kerem Gök' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <header className="bg-white shadow-md dark:bg-secondary">
          <div className="container py-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <h1 className="text-2xl font-bold text-primary">Türkiye&apos;de Neler Oluyor?</h1>

              <nav>
                <ul className="flex space-x-4">
                  <li>
                    <Link href="/" className="hover:text-primary">
                      Ana Sayfa
                    </Link>
                  </li>
                  <li>
                    <Link href="/test-crawler" className="hover:text-primary">
                      Crawler Test
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </header>
        <main className="container py-8">{children}</main>
        <footer className="bg-gray-100 dark:bg-gray-900 py-6">
          <div className="container text-center">
            <p>© {new Date().getFullYear()} Türkiye&apos;de Neler Oluyor - Tüm hakları saklıdır.</p>
            <p className="text-sm mt-2">Geliştiren: A. Kerem Gök</p>
          </div>
        </footer>
      </body>
    </html>
  )
} 