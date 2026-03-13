import styles from "./storage-playground.module.scss";

export interface StoragePlaygroundFormValues {
  content: string;
  mimeType: string;
  name: string;
}

export interface StoragePlaygroundStoredResource {
  id: string;
  mimeType: string;
  name: string;
  viewUrl?: string | null;
}

export interface StoragePlaygroundFormState {
  error: string | null;
  isSubmitting: boolean;
  result: StoragePlaygroundStoredResource | null;
  successMessage: string | null;
  values: StoragePlaygroundFormValues;
}

type StorageFieldName = keyof StoragePlaygroundFormValues;
type StorageFormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

interface StoragePlaygroundProps {
  applicationSettingsActionDisabled: boolean;
  applicationSettingsForm: StoragePlaygroundFormState;
  applicationSettingsHint: string;
  isAuthenticated: boolean;
  onApplicationSettingsFieldChange: (
    fieldName: StorageFieldName,
    value: string,
  ) => void;
  onApplicationSettingsSubmit: StorageFormSubmitHandler;
  onUserFileFieldChange: (fieldName: StorageFieldName, value: string) => void;
  onUserFileSubmit: StorageFormSubmitHandler;
  sessionMessage: string;
  sessionUserEmail: string | null;
  sessionUserName: string | null;
  userFilesActionDisabled: boolean;
  userFilesForm: StoragePlaygroundFormState;
  userFilesHint: string;
}

export function StoragePlayground(_props: StoragePlaygroundProps) {
  void _props;
  return <section className={styles.section} />;
}
