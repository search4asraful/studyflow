import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'sonner';
import { SingleTabGuard } from '../components/layout/SingleTabGuard';

export const metadata: Metadata = {
  title: 'StudyFlow — Collaborative Digital Study Environment',
  description:
    'Real-time collaborative study platform with authoritative synchronized Pomodoro timers, shared task boards, and productivity analytics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('studyflow-theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');document.documentElement.setAttribute('data-theme','light');}else{document.documentElement.classList.add('dark');document.documentElement.classList.remove('light');document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen bg-canvas text-foreground antialiased transition-colors duration-200">
        <SingleTabGuard />
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-base)',
              color: 'var(--text-primary)',
            },
          }}
        />
      </body>
    </html>
  );
}
