import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import "@/test/navigation";
import { navState, resetNavigation } from "@/test/navigation";
import { UploadFiles } from "@/app/(app)/jobs/[id]/_components/upload-files";

beforeEach(() => {
  resetNavigation();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function mockFetch(impl: (url: string, init?: RequestInit) => Promise<Response>) {
  const fetchMock = vi.fn(
    async (url: string | URL, init?: RequestInit) =>
      impl(url.toString(), init),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function makeFile(): File {
  return new File(["hello"], "invoice.pdf", { type: "application/pdf" });
}

describe("UploadFiles", () => {
  it("renders the upload pill and hidden file input", () => {
    render(<UploadFiles jobId="JOB-1" />);
    expect(screen.getByText("+ อัปโหลดไฟล์")).toBeInTheDocument();
    expect(screen.getByLabelText("เลือกไฟล์แนบ")).toHaveClass("hidden");
  });

  it("clicking the pill opens the file picker", async () => {
    const user = userEvent.setup();
    render(<UploadFiles jobId="JOB-1" />);
    const input = screen.getByLabelText("เลือกไฟล์แนบ");
    const clickSpy = vi.spyOn(input, "click").mockImplementation(() => {});
    await user.click(screen.getByRole("button", { name: "+ อัปโหลดไฟล์" }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it("POSTs the file as FormData and refreshes on success", async () => {
    const user = userEvent.setup();
    const fetchMock = mockFetch(async () =>
      Response.json({ url: "https://drive/x" }),
    );
    render(<UploadFiles jobId="JOB-2026-0001" />);
    await user.upload(screen.getByLabelText("เลือกไฟล์แนบ"), makeFile());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/upload");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get("jobId")).toBe("JOB-2026-0001");
    expect(body.get("file")).toBeInstanceOf(File);
    await waitFor(() => expect(navState.refresh).toHaveBeenCalled());
  });

  it("surfaces the Thai error from the server when the upload fails", async () => {
    const user = userEvent.setup();
    mockFetch(async () =>
      Response.json({ error: "ไฟล์ใหญ่เกิน 10 MB" }, { status: 413 }),
    );
    render(<UploadFiles jobId="JOB-1" />);
    await user.upload(screen.getByLabelText("เลือกไฟล์แนบ"), makeFile());
    await waitFor(() =>
      expect(screen.getByText("ไฟล์ใหญ่เกิน 10 MB")).toBeInTheDocument(),
    );
    expect(navState.refresh).not.toHaveBeenCalled();
  });

  it("falls back to a generic Thai error on non-Error failures", async () => {
    const user = userEvent.setup();
    mockFetch(async () => {
      throw "network down";
    });
    render(<UploadFiles jobId="JOB-1" />);
    await user.upload(screen.getByLabelText("เลือกไฟล์แนบ"), makeFile());
    await waitFor(() =>
      expect(
        screen.getByText("อัปโหลดไฟล์ไม่สำเร็จ โปรดลองอีกครั้ง"),
      ).toBeInTheDocument(),
    );
  });
});
