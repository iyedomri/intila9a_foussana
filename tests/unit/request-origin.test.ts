import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import {
  isArenaDevelopmentPreviewRequest,
  isRequestSameOrigin,
} from "../../src/lib/request-origin";

describe("request origin validation", () => {
  it("recognizes Arena development preview origins even with hyphens in sandbox ID", () => {
    const previewReqWithHyphens = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        origin: "https://3000-4b81899c-intila9a-foussana.e2b.app",
        host: "localhost:3000",
      },
    });

    expect(isArenaDevelopmentPreviewRequest(previewReqWithHyphens)).toBe(true);
    expect(isRequestSameOrigin(previewReqWithHyphens)).toBe(true);
  });

  it("recognizes standard same-origin requests", () => {
    const localReq = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        origin: "http://localhost:3000",
        host: "localhost:3000",
      },
    });

    expect(isRequestSameOrigin(localReq)).toBe(true);
  });

  it("rejects untrusted external origins", () => {
    const untrustedReq = new NextRequest("http://localhost:3000/api/test", {
      headers: {
        origin: "https://malicious-site.example.com",
        host: "localhost:3000",
      },
    });

    expect(isArenaDevelopmentPreviewRequest(untrustedReq)).toBe(false);
    expect(isRequestSameOrigin(untrustedReq)).toBe(false);
  });
});
