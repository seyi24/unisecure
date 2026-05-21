import packageJson from "../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Unisecure Admin",
  version: packageJson.version,
  copyright: `© ${currentYear}, Unisecure.`,
  meta: {
    title: "Unisecure Admin",
    description: "Admin dashboard for Unisecure.",
  },
};
