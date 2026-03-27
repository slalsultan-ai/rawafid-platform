import { vi } from "vitest";

// Mock Next.js server modules that are not available in Node test environment
vi.mock("next-auth", () => ({
  default: vi.fn(),
  getServerSession: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/server/auth", () => ({
  auth: vi.fn().mockResolvedValue(null),
}));

vi.mock("next/server", () => ({
  NextResponse: { next: vi.fn(), redirect: vi.fn() },
  NextRequest: vi.fn(),
}));
