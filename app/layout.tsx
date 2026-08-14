import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CandidateProvider } from '@/lib/context';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CareerGraph — Graph-Powered Career & Skill Recommendation Platform',
  description:
    'Explore the connections between candidate skills, projects, jobs, companies, and learning paths using CognoDB openCypher graph traversals.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className={`${inter.className} bg-[#0b0f17] text-slate-100 min-h-screen flex antialiased selection:bg-indigo-500/30 selection:text-indigo-200`}>
        <CandidateProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <TopNav />
            <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
          </div>
        </CandidateProvider>
      </body>
    </html>
  );
}
