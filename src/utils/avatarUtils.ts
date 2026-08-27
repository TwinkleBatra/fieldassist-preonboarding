import { Candidate, CandidateFormData, RequiredDocument } from '../types';

/**
 * Extracts clean 1-2 letter uppercase initials from a person's name.
 * Example: "Rahul Sharma" -> "RS", "Sophia" -> "S", "Marcus Tan" -> "MT"
 */
export function getInitials(name?: string): string {
  if (!name || !name.trim()) return 'FA';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generates a consistent background color/gradient class based on candidate name string hash.
 */
export function getAvatarColorClass(name?: string): string {
  const gradients = [
    'from-purple-600 to-indigo-700 text-white',
    'from-indigo-600 to-blue-700 text-white',
    'from-violet-600 to-purple-800 text-white',
    'from-fuchsia-600 to-purple-700 text-white',
    'from-teal-600 to-emerald-700 text-white',
    'from-cyan-600 to-blue-700 text-white'
  ];
  if (!name) return gradients[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

/**
 * Resolves the active Professional Photo URL uploaded by the candidate in Section 7,
 * checking candidate formData, statutory document attachments, and candidate avatarUrl.
 */
export function getCandidatePhotoUrl(
  candidate?: Partial<Candidate> | null
): string | null {
  if (!candidate) return null;

  // 1. Direct form data upload in Section 7 (Primary Source)
  if (candidate.formData?.professionalPhotoUrl && candidate.formData.professionalPhotoUrl.trim()) {
    return candidate.formData.professionalPhotoUrl.trim();
  }

  // 2. Direct photoDocUrl property
  if (candidate.photoDocUrl && candidate.photoDocUrl.trim()) {
    return candidate.photoDocUrl.trim();
  }

  // 3. Document attachment matching professional photo
  if (candidate.documents && Array.isArray(candidate.documents)) {
    const proDoc = candidate.documents.find(
      (d: RequiredDocument) =>
        (d.id === 'doc-photo-pro' ||
          d.name.toLowerCase().includes('professional photo') ||
          d.name.toLowerCase().includes('photo-pro') ||
          d.name.toLowerCase().includes('headshot')) &&
        Boolean(d.fileUrl && d.fileUrl.trim())
    );
    if (proDoc?.fileUrl) {
      return proDoc.fileUrl.trim();
    }
  }

  // 4. Candidate avatarUrl fallback
  if (candidate.avatarUrl && candidate.avatarUrl.trim()) {
    return candidate.avatarUrl.trim();
  }

  return null;
}
