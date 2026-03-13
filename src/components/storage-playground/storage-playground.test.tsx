import { render, screen } from "@testing-library/react";

import {
  StoragePlayground,
  type StoragePlaygroundFormState,
  type StoragePlaygroundFormValues,
} from "./storage-playground";

const DEFAULT_APPLICATION_SETTINGS_VALUES: StoragePlaygroundFormValues = {
  content: '{\n  "theme": "dark"\n}',
  mimeType: "application/json",
  name: "application-settings.json",
};

const DEFAULT_USER_FILE_VALUES: StoragePlaygroundFormValues = {
  content: "date,amount\n2026-03-08,32.5",
  mimeType: "text/csv",
  name: "expenses.csv",
};

function createStorageFormState(
  values: StoragePlaygroundFormValues,
): StoragePlaygroundFormState {
  return {
    error: null,
    isSubmitting: false,
    result: null,
    successMessage: null,
    values,
  };
}

describe("StoragePlayground", () => {
  it("does not render internal storage content", () => {
    const { container } = render(
      <StoragePlayground
        applicationSettingsActionDisabled={false}
        applicationSettingsForm={createStorageFormState(
          DEFAULT_APPLICATION_SETTINGS_VALUES,
        )}
        applicationSettingsHint={"hint"}
        isAuthenticated={true}
        onApplicationSettingsFieldChange={jest.fn()}
        onApplicationSettingsSubmit={jest.fn()}
        onUserFileFieldChange={jest.fn()}
        onUserFileSubmit={jest.fn()}
        sessionMessage={"Sesion"}
        sessionUserEmail={"gus@example.com"}
        sessionUserName={"Gus"}
        userFilesActionDisabled={false}
        userFilesForm={createStorageFormState(DEFAULT_USER_FILE_VALUES)}
        userFilesHint={"hint"}
      />,
    );

    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByText("Guardar configuración")).not.toBeInTheDocument();
    expect(screen.queryByText("Guardar archivo del usuario")).not.toBeInTheDocument();
  });
});
