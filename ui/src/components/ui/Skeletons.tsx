import React from "react";

export const ContinueRowSkeleton: React.FC = () => (
  <div className="flex gap-3 overflow-hidden">
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        className="w-[236px] shrink-0 rounded-[12px] border border-[var(--border)] bg-[var(--surface)] overflow-hidden"
      >
        <div className="aspect-video tf-skeleton" />
        <div className="p-3 space-y-2">
          <div className="h-3.5 w-3/4 rounded tf-skeleton" />
          <div className="h-2.5 w-1/2 rounded tf-skeleton" />
        </div>
      </div>
    ))}
  </div>
);

export const PosterRowSkeleton: React.FC = () => (
  <div className="flex gap-3 overflow-hidden">
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div key={i} className="w-[126px] md:w-[152px] shrink-0 space-y-2">
        <div className="aspect-[2/3] rounded-[12px] border border-[var(--border)] tf-skeleton" />
        <div className="h-3.5 w-4/5 rounded tf-skeleton" />
        <div className="h-2.5 w-1/2 rounded tf-skeleton" />
      </div>
    ))}
  </div>
);

export const SearchGridSkeleton: React.FC = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
    {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
      <div key={i} className="space-y-2">
        <div className="aspect-[2/3] rounded-[12px] border border-[var(--border)] tf-skeleton" />
        <div className="h-3.5 w-4/5 rounded tf-skeleton" />
        <div className="h-2.5 w-1/2 rounded tf-skeleton" />
      </div>
    ))}
  </div>
);

export const ChannelListSkeleton: React.FC = () => (
  <div className="space-y-2.5">
    {[0, 1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-[12px] border border-[var(--border)] bg-[var(--surface)]"
      >
        <div className="w-12 h-12 rounded-[10px] tf-skeleton shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/3 rounded tf-skeleton" />
          <div className="h-3 w-2/3 rounded tf-skeleton" />
          <div className="h-1.5 w-full rounded tf-skeleton" />
        </div>
      </div>
    ))}
  </div>
);

export const PanelRowsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-2.5">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="h-16 rounded-[12px] border border-[var(--border)] tf-skeleton"
      />
    ))}
  </div>
);
