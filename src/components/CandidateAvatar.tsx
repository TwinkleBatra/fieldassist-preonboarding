import React, { useState, useEffect } from 'react';
import { Candidate, CandidateFormData, RequiredDocument } from '../types';
import { getCandidatePhotoUrl, getInitials, getAvatarColorClass } from '../utils/avatarUtils';
import { toTitleCase } from '../utils/textUtils';

interface CandidateAvatarProps {
  candidate?: Partial<Candidate> | null;
  name?: string;
  photoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBorder?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs',
  lg: 'w-12 h-12 text-sm',
  xl: 'w-14 h-14 text-base'
};

export const CandidateAvatar: React.FC<CandidateAvatarProps> = ({
  candidate,
  name: explicitName,
  photoUrl: explicitPhotoUrl,
  size = 'md',
  className = '',
  showBorder = true
}) => {
  const [hasImageError, setHasImageError] = useState(false);

  const candidateName = toTitleCase(explicitName || candidate?.name || 'Candidate');
  const resolvedPhotoUrl = explicitPhotoUrl !== undefined ? explicitPhotoUrl : getCandidatePhotoUrl(candidate);

  // Reset error state if URL changes
  useEffect(() => {
    setHasImageError(false);
  }, [resolvedPhotoUrl]);

  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const borderClass = showBorder ? 'border border-purple-200/80 shadow-2xs' : '';
  const colorGradientClass = getAvatarColorClass(candidateName);
  const initials = getInitials(candidateName);

  if (resolvedPhotoUrl && !hasImageError) {
    return (
      <img
        src={resolvedPhotoUrl}
        alt={candidateName}
        onError={() => setHasImageError(true)}
        className={`${sizeClass} rounded-full object-cover shrink-0 ${borderClass} ${className}`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      title={candidateName}
      className={`${sizeClass} rounded-full bg-gradient-to-br ${colorGradientClass} flex items-center justify-center font-extrabold tracking-wider select-none shrink-0 ${borderClass} ${className}`}
    >
      <span>{initials}</span>
    </div>
  );
};
