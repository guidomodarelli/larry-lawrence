"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

function InputGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "relative flex w-full items-center rounded-md border border-input bg-transparent shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50 dark:bg-input/30",
        className,
      )}
      data-slot="input-group"
      {...props}
    />
  );
}

function InputGroupPrefix({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-full shrink-0 items-center px-3 text-sm font-medium text-muted-foreground",
        className,
      )}
      data-slot="input-group-prefix"
      {...props}
    />
  );
}

function InputGroupInput({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-9 w-full min-w-0 bg-transparent pr-3 py-1 text-base outline-none selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      data-slot="input-group-input"
      type={type}
      {...props}
    />
  );
}

export { InputGroup, InputGroupInput, InputGroupPrefix };
