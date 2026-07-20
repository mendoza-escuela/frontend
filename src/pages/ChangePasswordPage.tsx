import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/auth/AuthCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { getHttpErrorMessage } from '../lib/http-error';
import { showError, showSuccess } from '../lib/toast';
import { strongPasswordSchema } from '../lib/validation';
import { authService } from '../services/auth.service';

const schema = z.object({ currentPassword: z.string().min(1, 'Ingresá tu contraseña actual.'), newPassword: strongPasswordSchema, confirmation: z.string() }).refine((values) => values.newPassword === values.confirmation, { path: ['confirmation'], message: 'Las contraseñas no coinciden.' });

export function ChangePasswordPage() {
  const { user, refreshUser } = useAuth(); const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async ({ currentPassword, newPassword }) => {
    try { await authService.changePassword(currentPassword, newPassword); await refreshUser(); showSuccess('Contraseña actualizada. Se cerraron las sesiones anteriores.'); navigate(user?.role === 'admin' ? '/admin' : '/colegio', { replace: true }); }
    catch (error) { showError(getHttpErrorMessage(error)); }
  });
  return <AuthCard title={user?.mustChangePassword ? 'Cambio de contraseña obligatorio' : 'Cambiar contraseña'} description="Por seguridad, la nueva clave debe cumplir la política indicada y ser distinta de la actual."><form className="mt-7 space-y-5" onSubmit={submit} noValidate>
    {(['currentPassword', 'newPassword', 'confirmation'] as const).map((name, index) => <label className="block text-sm font-semibold" key={name}>{['Contraseña actual', 'Nueva contraseña', 'Repetir contraseña'][index]}<input {...register(name)} autoComplete={index === 0 ? 'current-password' : 'new-password'} className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#3CB4E5] focus:ring-2 focus:ring-[#3CB4E5]/25" type="password" />{errors[name] && <span className="mt-1 block text-sm text-[#DC2626]">{errors[name]?.message}</span>}</label>)}
    <Button className="w-full" disabled={isSubmitting} icon={<KeyRound size={18} />} type="submit">Actualizar contraseña</Button>
  </form></AuthCard>;
}
