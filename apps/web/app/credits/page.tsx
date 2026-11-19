import React from 'react';
import Link from 'next/link';
import { Navbar } from '../../components/layout/Navbar';
import { LandingFooter } from '../../components/landing/LandingFooter';
import {
  GraduationCap,
  Users,
  Code2,
  Cpu,
  Globe,
  Database,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const metadata = {
  title: 'Credits & Academic Attribution — StudyFlow',
  description:
    'Academic project attribution, engineering team credits, and architectural specifications for StudyFlow (SD3 — Web Development).',
};

export default function CreditsPage() {
  const teamMembers = [
    {
      name: 'Md. Asraful Islam Furdus',
      role: 'Lead Full-Stack Architect',
      details:
        'Next.js 15 App Router architecture, Express.js REST API, authoritative Socket.IO synchronization engine, Prisma ORM schema design, GSAP animations, and end-to-end deployment setup.',
      initials: 'AF',
    },
    {
      name: 'Md Shakil Mia',
      role: 'Full-Stack Developer & Collaborator',
      details:
        'Multi-user concurrency & live presence tracking, database relations & migrations, productivity analytics calculation algorithms, UI components, and automated test suite verification.',
      initials: 'SM',
    },
  ];

  const techStack = [
    {
      icon: Cpu,
      title: 'Full-Stack Architecture',
      subtitle: 'Next.js 15 & Express.js',
      description:
        'Turborepo monorepo with React 19, TypeScript strict mode, server-side data fetching, and dedicated Express API server.',
    },
    {
      icon: Globe,
      title: 'Real-Time Concurrency',
      subtitle: 'Socket.IO & WebSockets',
      description:
        'Authoritative backend timer reconciliation, multi-client presence heartbeat, room state broadcasts, and sub-50ms latency.',
    },
    {
      icon: Database,
      title: 'Relational Persistence',
      subtitle: 'PostgreSQL 16 & Prisma ORM',
      description:
        'Fully normalized relational schema with foreign key constraints, cascading deletes, indexes, and automated migrations.',
    },
    {
      icon: Lock,
      title: 'Security & Authorization',
      subtitle: 'HTTP-Only Cookies & JWT',
      description:
        'Strict cookie-based authentication, salted bcrypt password hashing, and role-based permissions (Owner, Moderator, Member).',
    },
  ];

  const defenseCriteria = [
    'Authoritative server-side synchronized Pomodoro state (zero clock drift)',
    'Real-time collaborative task board with multi-column status pipelines',
    'Heartbeat-driven user presence tracking and active room member counter',
    'Relational productivity analytics, streak calculation, and focus metrics',
    'Normalized PostgreSQL database schema managed via Prisma ORM',
    'Comprehensive automated test suite covering auth, concurrency, and timer logic',
  ];

  return (
    <div className="min-h-screen bg-canvas text-foreground flex flex-col selection:bg-accent selection:text-accent-contrast transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full space-y-12">
        {/* Back Link */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs text-foreground-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>
        </div>

        {/* Page Header */}
        <div className="space-y-4">
          <div className="badge-base bg-surface border border-border px-4 py-1.5 shadow-sm">
            <GraduationCap className="w-4 h-4 text-accent" />
            <span className="text-xs font-mono uppercase tracking-wider text-foreground-secondary">
              Academic Project Attribution
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-foreground">
            Project Credits &amp; Attribution
          </h1>
          <p className="text-sm sm:text-base text-foreground-secondary max-w-2xl leading-relaxed">
            StudyFlow was engineered by Group Astro as an advanced, production-grade full-stack
            web application demonstration for the academic project defense.
          </p>
        </div>

        {/* Academic Course Information Card */}
        <div className="card-base p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-accent">
            <Sparkles className="w-4 h-4" />
            Course &amp; Academic Program Context
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card-subtle space-y-1 p-4">
              <span className="text-[11px] uppercase font-mono text-foreground-muted block">Course</span>
              <p className="font-semibold text-sm text-foreground">SD3 — Web Development</p>
            </div>

            <div className="card-subtle space-y-1 p-4">
              <span className="text-[11px] uppercase font-mono text-foreground-muted block">Academic Program</span>
              <p className="font-semibold text-sm text-foreground">ECSE Department</p>
            </div>

            <div className="card-subtle space-y-1 p-4">
              <span className="text-[11px] uppercase font-mono text-foreground-muted block">Section</span>
              <p className="font-semibold text-sm text-foreground">Section D</p>
            </div>

            <div className="card-subtle space-y-1 p-4">
              <span className="text-[11px] uppercase font-mono text-foreground-muted block">Team Identity</span>
              <p className="font-semibold text-sm text-accent">Group Astro</p>
            </div>
          </div>
        </div>

        {/* Team Members Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
            <Users className="w-4 h-4 text-accent" />
            <h2>Development Team &amp; Engineering Contributors</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teamMembers.map((member, idx) => (
              <div
                key={idx}
                className="card-base p-6 sm:p-7 space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border text-accent font-mono font-bold text-base flex items-center justify-center">
                      {member.initials}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{member.name}</h3>
                      <p className="text-xs text-accent font-medium">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed">{member.details}</p>
                </div>

                <div className="pt-4 divider-subtle text-[11px] text-foreground-muted">
                  Group Astro • ECSE Section D
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Architectural Highlights */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground">
            <Code2 className="w-4 h-4 text-accent" />
            <h2>Technical Architecture Specifications</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="card-subtle p-5 space-y-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-accent">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">{tech.title}</h3>
                      <p className="text-[11px] text-foreground-muted">{tech.subtitle}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground-secondary leading-relaxed">{tech.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Defense Criteria Met Checklist */}
        <div className="card-elevated p-6 sm:p-8 space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
            Academic Project Defense Deliverables
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {defenseCriteria.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-foreground-secondary">
                <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="pt-6 divider-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/">
            <Button variant="secondary" size="md">
              Return to Landing Page
            </Button>
          </Link>

          <Link href="/login">
            <Button variant="primary" size="md">
              Launch Application
            </Button>
          </Link>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
}
