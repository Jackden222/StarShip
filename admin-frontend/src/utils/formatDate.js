export function formatOmskDate(date) {
  if (!date) return '-';
  return new Date(date).toLocaleString('ru-RU', {
    timeZone: 'Asia/Omsk',
    hour12: false
  });
} 