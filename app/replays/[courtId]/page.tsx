'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import PlayerPortal from '@/components/player/PlayerPortal';

export default function ReplaysCourtPage() {
  const params = useParams();
  const courtId = typeof params?.courtId === 'string' ? params.courtId : Array.isArray(params?.courtId) ? params.courtId[0] : '';

  return <PlayerPortal initialCourtParam={courtId} />;
}
