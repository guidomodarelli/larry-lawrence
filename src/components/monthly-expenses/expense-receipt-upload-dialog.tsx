import { useMemo, useState, type ChangeEvent, type DragEvent } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import styles from "./expense-receipt-upload-dialog.module.scss";

const FILE_ACCEPT = [
  "application/pdf",
  "image/heic",
  "image/heif",
  "image/jpeg",
  "image/png",
  "image/webp",
].join(",");

interface ExpenseReceiptUploadDialogProps {
  errorMessage: string | null;
  expenseDescription: string;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

function getDroppedFile(event: DragEvent<HTMLDivElement>): File | null {
  const droppedFile = event.dataTransfer.files?.[0];

  return droppedFile ?? null;
}

export function ExpenseReceiptUploadDialog({
  errorMessage,
  expenseDescription,
  isOpen,
  isSubmitting,
  onClose,
  onUpload,
}: ExpenseReceiptUploadDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const dropzoneLabel = useMemo(
    () =>
      expenseDescription.trim().length > 0
        ? `Comprobante para ${expenseDescription.trim()}`
        : "Comprobante del gasto",
    [expenseDescription],
  );

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedFile(null);
      setIsDraggingFile(false);
      onClose();
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setSelectedFile(nextFile);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingFile(false);
    setSelectedFile(getDroppedFile(event));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      return;
    }

    await onUpload(selectedFile);
  };

  return (
    <Dialog onOpenChange={handleDialogOpenChange} open={isOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir comprobante</DialogTitle>
          <DialogDescription>
            Subí un archivo del comprobante y lo vamos a guardar en Google Drive.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          <div
            aria-label={dropzoneLabel}
            className={cn(styles.dropzone, isDraggingFile && styles.dropzoneActive)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            role="region"
          >
            <p className={styles.dropzoneText}>
              Arrastrá y soltá el archivo acá, o seleccioná uno desde tu equipo.
            </p>
            <Input
              accept={FILE_ACCEPT}
              className={styles.fileInput}
              onChange={handleFileChange}
              type="file"
            />
          </div>

          {selectedFile ? (
            <p className={styles.selectedFile}>Archivo: {selectedFile.name}</p>
          ) : null}

          <p className={styles.supportedTypes}>
            Formatos permitidos: PDF, JPG, PNG, WEBP, HEIC, HEIF (hasta 5MB).
          </p>

          {errorMessage ? (
            <p className={styles.errorText} role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className={styles.actions}>
            <Button
              disabled={isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancelar
            </Button>
            <Button
              disabled={!selectedFile || isSubmitting}
              onClick={() => {
                void handleUpload();
              }}
              type="button"
            >
              {isSubmitting ? "Subiendo..." : "Subir comprobante"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
