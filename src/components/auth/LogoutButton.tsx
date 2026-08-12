import { LogOut } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { showError } from "../../lib/toast";
import { ConfirmDialog } from "../ui/ConfirmDialog";

export function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [isClosingSession, setIsClosingSession] = useState(false);

  const closeSession = async () => {
    setIsClosingSession(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      showError("No se pudo cerrar la sesión correctamente.");
      setIsClosingSession(false);
    }
  };

  return (
    <>
      <button
        className="inline-flex min-h-10 shrink-0 items-center gap-2 self-start rounded-lg border border-mendoza-blue px-4 text-sm font-semibold text-mendoza-blue transition hover:bg-mendoza-blue-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mendoza-blue sm:self-center"
        onClick={() => setConfirmationOpen(true)}
        type="button"
      >
        <LogOut aria-hidden="true" size={17} />
        Cerrar sesión
      </button>

      <ConfirmDialog
        confirmLabel="Cerrar sesión"
        description="Tu sesión actual se cerrará y tendrás que volver a ingresar con tu correo y contraseña."
        isProcessing={isClosingSession}
        onCancel={() => setConfirmationOpen(false)}
        onConfirm={closeSession}
        open={confirmationOpen}
        title="¿Cerrar sesión?"
      />
    </>
  );
}
