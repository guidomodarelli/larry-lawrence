import {
  uploadMonthlyExpenseReceiptViaApi,
} from "./monthly-expenses-receipts-api";

describe("monthly-expenses-receipts-api client", () => {
  it("sends x-correlation-id header on upload requests", async () => {
    const fetchImplementation = jest.fn().mockResolvedValue({
      json: async () => ({
        data: {
          fileId: "receipt-file-id",
          fileName: "comprobante.pdf",
          fileViewUrl: "https://drive.google.com/file/d/receipt-file-id/view",
          folderId: "receipt-folder-id",
          folderViewUrl: "https://drive.google.com/drive/folders/receipt-folder-id",
        },
      }),
      ok: true,
    });

    await uploadMonthlyExpenseReceiptViaApi(
      {
        contentBase64: "dGVzdA==",
        expenseDescription: "Internet",
        fileName: "comprobante.pdf",
        mimeType: "application/pdf",
      },
      fetchImplementation,
    );

    const options = fetchImplementation.mock.calls[0]?.[1] as
      | RequestInit
      | undefined;
    const headers = new Headers(options?.headers);

    expect(headers.get("x-correlation-id")).toEqual(expect.any(String));
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});
