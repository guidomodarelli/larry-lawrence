import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { LenderPicker } from "./lender-picker";

describe("LenderPicker", () => {
  it("closes the panel when clicking outside without selecting a lender", async () => {
    const user = userEvent.setup();
    const onAddLender = jest.fn();
    const onSelect = jest.fn();

    render(
      <div>
        <button type="button">Fuera</button>
        <LenderPicker
          onAddLender={onAddLender}
          onSelect={onSelect}
          options={[]}
          selectedLenderId=""
          selectedLenderName=""
        />
      </div>,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));

    expect(screen.getByLabelText("Buscar prestador")).toBeInTheDocument();
    expect(
      screen.getByText("No hay prestadores registrados todavía."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar prestador" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Fuera" }));

    expect(screen.queryByLabelText("Buscar prestador")).not.toBeInTheDocument();
    expect(
      screen.queryByText("No hay prestadores registrados todavía."),
    ).not.toBeInTheDocument();
    expect(onAddLender).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("triggers lender creation from the picker panel", async () => {
    const user = userEvent.setup();
    const onAddLender = jest.fn();

    render(
      <LenderPicker
        onAddLender={onAddLender}
        onSelect={jest.fn()}
        options={[]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.click(screen.getByRole("button", { name: "Agregar prestador" }));

    expect(onAddLender).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText("Buscar prestador")).toBeInTheDocument();
  });

  it("keeps the add lender action visible when there are lender options", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Banco Ciudad",
            type: "bank",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));

    expect(screen.getByRole("button", { name: /Banco Ciudad/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Agregar prestador" }),
    ).toBeInTheDocument();
  });

  it("filters lenders using fuzzy, case-insensitive and accent-insensitive matching", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Banco Nación",
            type: "bank",
          },
          {
            id: "lender-2",
            name: "Árbol Finanzas",
            type: "other",
          },
          {
            id: "lender-3",
            name: "Casa Central",
            type: "family",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.type(screen.getByLabelText("Buscar prestador"), "BNCN");

    expect(
      screen.getAllByText((_, element) => element?.textContent === "Banco Nación"),
    ).not.toHaveLength(0);
    expect(
      screen.queryByText((_, element) => element?.textContent === "Árbol Finanzas"),
    ).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText("Buscar prestador"));
    await user.type(screen.getByLabelText("Buscar prestador"), "NACION");

    expect(
      screen.getAllByText((_, element) => element?.textContent === "Banco Nación"),
    ).not.toHaveLength(0);
  });

  it("highlights matching lender name parts while typing", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Nación",
            type: "bank",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.type(screen.getByLabelText("Buscar prestador"), "NACION");

    const lenderOption = screen.getByRole("button", {
      name: /Nación\s*Banco/i,
    });

    const highlightedText = Array.from(
      lenderOption.querySelectorAll("mark"),
      (element) => element.textContent ?? "",
    ).join("");

    expect(highlightedText).toBe("Nación");
  });

  it("shows lender notes in each option", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Adrián Saúl Modarelli",
            notes: "Tío de la familia",
            type: "family",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));

    expect(
      screen.getByText((_, element) => element?.textContent === "Tío de la familia"),
    ).toBeInTheDocument();
  });

  it("filters by lender notes with fuzzy accent-insensitive matching and highlights note matches", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Adrián Saúl Modarelli",
            notes: "Crédito ágil mensual",
            type: "family",
          },
          {
            id: "lender-2",
            name: "Banco Norte",
            notes: "Cuenta corriente",
            type: "bank",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.type(screen.getByLabelText("Buscar prestador"), "AGIL");

    const lenderOption = screen.getByRole("button", {
      name: /Adrián Saúl Modarelli/i,
    });
    const notesElement = screen.getByText(
      (_, element) => element?.textContent === "Crédito ágil mensual",
    );
    const highlightedText = Array.from(
      notesElement.querySelectorAll("mark"),
      (element) => element.textContent ?? "",
    ).join("");

    expect(lenderOption).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Banco Norte/i }),
    ).not.toBeInTheDocument();
    expect(highlightedText).toBe("ágil");
  });

  it("filters by lender type with fuzzy matching and highlights type matches", async () => {
    const user = userEvent.setup();

    render(
      <LenderPicker
        onAddLender={jest.fn()}
        onSelect={jest.fn()}
        options={[
          {
            id: "lender-1",
            name: "Lucía Pérez",
            type: "family",
          },
          {
            id: "lender-2",
            name: "Banco Sur",
            type: "bank",
          },
        ]}
        selectedLenderId=""
        selectedLenderName=""
      />,
    );

    await user.click(screen.getByRole("button", { name: "Seleccioná un prestador" }));
    await user.type(screen.getByLabelText("Buscar prestador"), "FMLR");

    const lenderOption = screen.getByRole("button", {
      name: /Lucía Pérez/i,
    });
    const typeElement = lenderOption.lastElementChild;

    expect(typeElement).not.toBeNull();

    if (typeElement === null) {
      throw new Error("Expected lender type element");
    }

    const highlightedText = Array.from(
      typeElement.querySelectorAll("mark"),
      (element) => element.textContent ?? "",
    ).join("");

    expect(
      screen.queryByRole("button", { name: /Banco Sur/i }),
    ).not.toBeInTheDocument();
    expect(highlightedText).toBe("Fmlr");
  });
});
