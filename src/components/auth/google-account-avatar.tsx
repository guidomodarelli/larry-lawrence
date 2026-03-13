import { PlusIcon } from "lucide-react";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type GoogleAccountAvatarStatus = "authenticated" | "loading" | "unauthenticated";

interface GoogleAccountAvatarProps {
  onConnect: () => void;
  onDisconnect: () => void;
  status: GoogleAccountAvatarStatus;
  userImage: string | null;
  userName: string | null;
}

function getUserInitials(name: string | null): string {
  if (!name) {
    return "GG";
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "GG";
}

export function GoogleAccountAvatar({
  onConnect,
  onDisconnect,
  status,
  userImage,
  userName,
}: GoogleAccountAvatarProps) {
  const initials = getUserInitials(userName);
  const tooltipStatusLabel =
    status === "authenticated"
      ? "Google conectado"
      : status === "loading"
        ? "Verificando conexion de Google"
        : "Google desconectado";

  if (status === "authenticated") {
    return (
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Cuenta de Google conectada"
                type="button"
              >
                <Avatar>
                  {userImage ? <AvatarImage alt={userName ?? "Cuenta de Google"} src={userImage} /> : null}
                  <AvatarFallback>{initials}</AvatarFallback>
                  <AvatarBadge className="bg-green-600 dark:bg-green-800" />
                </Avatar>
              </button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault();
                onDisconnect();
              }}
            >
              Desconectar Google
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent className="mr-2" side="bottom" sideOffset={8}>{tooltipStatusLabel}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={
            status === "loading"
              ? "Verificando sesión de Google"
              : "Conectar cuenta de Google"
          }
          disabled={status === "loading"}
          onClick={onConnect}
          type="button"
        >
          <Avatar className="grayscale">
            {userImage ? <AvatarImage alt={userName ?? "Cuenta de Google"} src={userImage} /> : null}
            <AvatarFallback>{initials}</AvatarFallback>
            <AvatarBadge>
              <PlusIcon />
            </AvatarBadge>
          </Avatar>
        </button>
      </TooltipTrigger>
      <TooltipContent className="mr-2" side="bottom" sideOffset={8}>{tooltipStatusLabel}</TooltipContent>
    </Tooltip>
  );
}
