'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/layout/AppShell';
import { CreateRoomModal } from '../../../components/rooms/CreateRoomModal';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CreateRoomPage() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link
          href="/rooms"
          className="inline-flex items-center gap-1.5 text-xs text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Study Rooms
        </Link>

        {/* Modal handles creation, presets, rhythm visualization, and access control */}
        <CreateRoomModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            router.push('/rooms');
          }}
        />
      </div>
    </AppShell>
  );
}
