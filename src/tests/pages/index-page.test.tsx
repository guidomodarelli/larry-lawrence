import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { signIn, signOut, useSession } from "next-auth/react";
import type { ReactElement } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import type { StorageBootstrapResult } from "@/modules/storage/application/results/storage-bootstrap";
import HomePage from "@/pages/index";

jest.mock("next-auth/react", () => ({
  signIn: jest.fn(),
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

const mockedUseSession = jest.mocked(useSession);
const mockedSignIn = jest.mocked(signIn);
const mockedSignOut = jest.mocked(signOut);
function renderWithProviders(ui: ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>);
}

const bootstrap: StorageBootstrapResult = {
  architecture: {
    dataStrategy: "ssr-first",
    middleendLocation: "src/modules",
    routing: "pages-router",
  },
  authStatus: "configured",
  requiredScopes: [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/drive.file",
  ],
  storageTargets: [
    {
      id: "userFiles",
      requiredScope: "https://www.googleapis.com/auth/drive.file",
      writesUserVisibleFiles: true,
    },
  ],
};

describe("HomePage", () => {
  beforeEach(() => {
    mockedSignIn.mockReset();
    mockedSignOut.mockReset();
    mockedUseSession.mockReturnValue({
      data: null,
      status: "unauthenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);
  });

  it("renders the storage playground without legacy cards", () => {
    renderWithProviders(<HomePage bootstrap={bootstrap} />);

    expect(
      screen.queryByRole("heading", { name: "Mis Finanzas" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Pages Router + SSR + Hexagonal"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Probar storage en Google Drive"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Conectar cuenta de Google" }),
    ).toBeInTheDocument();
  });

  it("starts Google sign in when the disconnected avatar is clicked", async () => {
    const user = userEvent.setup();

    renderWithProviders(<HomePage bootstrap={bootstrap} />);

    await user.click(
      screen.getByRole("button", { name: "Conectar cuenta de Google" }),
    );

    expect(mockedSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/",
    });
  });

  it("allows disconnecting from the connected avatar menu", async () => {
    const user = userEvent.setup();

    mockedUseSession.mockReturnValue({
      data: {
        expires: "2099-01-01T00:00:00.000Z",
        user: {
          email: "gus@example.com",
          name: "Gus",
        },
      },
      status: "authenticated",
      update: jest.fn(),
    } as ReturnType<typeof useSession>);

    renderWithProviders(<HomePage bootstrap={bootstrap} />);

    await user.click(
      screen.getByRole("button", { name: "Cuenta de Google conectada" }),
    );
    await user.click(screen.getByRole("menuitem", { name: "Desconectar Google" }));

    expect(mockedSignOut).toHaveBeenCalledWith({
      callbackUrl: "/",
    });
  });

  it("renders the OAuth setup hint when bootstrap is pending", () => {
    renderWithProviders(<HomePage bootstrap={{ ...bootstrap, authStatus: "pending" }} />);

    expect(
      screen.getByRole("button", { name: "Conectar cuenta de Google" }),
    ).toBeInTheDocument();
  });
});
