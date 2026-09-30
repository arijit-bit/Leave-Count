// Hardcoded holidays for West Bengal 2026 (Format: YYYY-MM-DD)
const holidaysWB = {
  '2026-01-01': "New Year's Day",
  '2026-01-12': "Swami Vivekananda Jayanti",
  '2026-01-23': "Netaji Subhas Chandra Bose Jayanti",
  '2026-01-26': "Republic Day",
  '2026-02-14': "Saraswati Puja",
  '2026-03-03': "Dol Jatra",
  '2026-03-04': "Holi",
  '2026-04-10': "Good Friday",
  '2026-04-14': "Dr. B.R. Ambedkar Jayanti / Bengali New Year",
  '2026-05-01': "May Day",
  '2026-05-08': "Rabindra Jayanti",
  '2026-08-15': "Independence Day",
  '2026-10-02': "Gandhi Jayanti",
  '2026-10-18': "Durga Puja Saptami",
  '2026-10-19': "Durga Puja Ashtami",
  '2026-10-20': "Durga Puja Navami",
  '2026-10-21': "Vijaya Dashami",
  '2026-11-09': "Kali Puja / Diwali",
  '2026-12-25': "Christmas Day"
};

const isHoliday = (dateString) => {
  return Object.prototype.hasOwnProperty.call(holidaysWB, dateString);
};

module.exports = {
  holidaysWB,
  isHoliday
};
