/**
 * Avatar helpers shared by the navbar, room cards and the participant list.
 */

/** "Sargun Kaur" -> "SK", "Sargun" -> "SA", "" -> "?" */
export function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* Fixed palette so a given person keeps the same colour everywhere. */
const tints = [
  "from-indigo-500 to-violet-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-violet-500 to-fuchsia-600",
  "from-cyan-500 to-blue-600",
];

/** Deterministic gradient for a user/room id — same seed, same colour. */
export function avatarTint(seed) {
  const key = String(seed || "");
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return tints[hash % tints.length];
}
