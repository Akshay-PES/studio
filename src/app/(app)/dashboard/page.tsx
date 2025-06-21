
import { Suspense } from 'react';
import DashboardComponent from './DashboardComponent';

export const dynamic = 'force-dynamic';

// A simple loading component to show while the main component is loading.
// This will be the fallback for the Suspense boundary.
function DashboardLoading() {
    return (
      <div className="flex flex-1 h-full items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading calendar...</p>
      </div>
    );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardComponent />
    </Suspense>
  );
}
