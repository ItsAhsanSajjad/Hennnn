import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL ??=
  "postgresql://pakhen:pakhen_dev_password@localhost:5432/pakhen_dev?schema=public";
