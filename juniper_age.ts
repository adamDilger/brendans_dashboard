export function getJuniperAge() {
  const dob = new Date("2024-05-07T05:08:00.000Z");
  const now = new Date();

  const diff = now.getTime() - dob.getTime();

  // diff in days and hours
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffDays} days, ${diffHours} hours, ${diffMinutes} minutes old.`;
}
