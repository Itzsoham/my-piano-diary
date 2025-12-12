import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "My Piano Diary",
  version: packageJson.version,
  copyright: `© ${currentYear}, My Piano Diary.`,
  meta: {
    title: "My Piano Diary – Piano Lessons, Attendance & Earnings Tracker",
    description:
      "My Piano Diary is a modern, elegant tool for music teachers to manage students, track lesson attendance, calculate earnings, and organize their teaching studio effortlessly.",
  },
};
