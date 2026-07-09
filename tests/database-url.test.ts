import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getConnectionString: vi.fn(),
}));

vi.mock("@netlify/database", () => ({
  getConnectionString: mocks.getConnectionString,
}));

async function loadDatabaseUrlModule() {
  vi.resetModules();
  return import("@/lib/database-url");
}

describe("resolveDatabaseUrl", () => {
  afterEach(() => {
    delete process.env.DATABASE_URL;
    delete process.env.NETLIFY_DB_URL;
    mocks.getConnectionString.mockReset();
  });

  it("prefers an explicit Prisma database URL", async () => {
    process.env.DATABASE_URL = "postgresql://explicit";

    const { resolveDatabaseUrl } = await loadDatabaseUrlModule();

    expect(resolveDatabaseUrl()).toBe("postgresql://explicit");
    expect(mocks.getConnectionString).not.toHaveBeenCalled();
  });

  it("uses the Netlify Database runtime URL when provided", async () => {
    process.env.NETLIFY_DB_URL = "postgresql://netlify";

    const { resolveDatabaseUrl } = await loadDatabaseUrlModule();

    expect(resolveDatabaseUrl()).toBe("postgresql://netlify");
    expect(mocks.getConnectionString).not.toHaveBeenCalled();
  });

  it("asks Netlify Database for a connection string outside local development", async () => {
    mocks.getConnectionString.mockReturnValue("postgresql://from-sdk");

    const { resolveDatabaseUrl } = await loadDatabaseUrlModule();

    expect(resolveDatabaseUrl()).toBe("postgresql://from-sdk");
  });

  it("falls back to the local development database when Netlify is unavailable", async () => {
    mocks.getConnectionString.mockImplementation(() => {
      throw new Error("missing Netlify Database environment");
    });

    const { resolveDatabaseUrl } = await loadDatabaseUrlModule();

    expect(resolveDatabaseUrl()).toBe("postgresql://store:store@localhost:5432/store?schema=public");
  });
});
