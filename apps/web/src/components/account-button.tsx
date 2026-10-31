"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { UserRoundIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { accountsEnabled } from "@/components/account-provider";

export function AccountButton() {
  if (!accountsEnabled) return null;
  return <Account />;
}

function Account() {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <span aria-hidden className="size-10" />;
  if (isSignedIn) return <span className="flex size-10 items-center justify-center"><UserButton /></span>;
  return (
    <SignInButton mode="modal">
      <Button variant="ghost" size="icon" aria-label="Iniciar sesión para guardar tu progreso" title="Iniciar sesión para guardar tu progreso">
        <UserRoundIcon />
      </Button>
    </SignInButton>
  );
}
