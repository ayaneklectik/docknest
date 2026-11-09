import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  {
    ignores: [".next/**", "frontend/.next/**", "node_modules/**", "dist/**", "coverage/**"]
  },
  ...nextVitals,
  ...nextTypescript,
  {
    settings: {
      next: {
        rootDir: ["frontend"]
      }
    }
  }
];

export default config;
