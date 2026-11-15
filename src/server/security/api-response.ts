import { NextResponse } from "next/server";

interface ApiErrorBody {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}

export function apiError(
  code: string,
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { error: { code, message } },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/problem+json; charset=utf-8",
      },
    },
  );
}

export function apiData<T>(data: T, status = 200): NextResponse<{ readonly data: T }> {
  return NextResponse.json(
    { data },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
