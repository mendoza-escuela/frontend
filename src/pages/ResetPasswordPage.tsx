import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, KeyRound } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/auth/AuthCard';
import { Button } from '../components/ui/Button';
import { getHttpErrorMessage } from '../lib/http-error';
import { showError, showSuccess } from '../lib/toast';
import { strongPasswordSchema } from '../lib/validation';
import { authService } from '../services/auth.service';

const schema = z.object({ newPassword: strongPasswordSchema, confirmation: z.string() }).refine((values) => values.newPassword === values.confirmation, { path: ['confirmation'], message: 'Las contraseñas no coinciden.' });

export function ResetPasswordPage() {
  const [params] = useSearchParams(); const navigate = useNavigate(); const token = params.get('token');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async ({ newPassword }) => {
    if (!token) return showError('El enlace no contiene un token válido.');
    try { await authService.resetPassword(token, newPassword); showSuccess('Contraseña actualizada. Ya podés ingresar.'); navigate('/login', { replace: true }); }
    catch (error) { showError(getHttpErrorMessage(error)); }
  });
  return <AuthCard title="Crear nueva contraseña" description="Usá al menos 12 caracteres, mayúscula, minúscula, número y símbolo."><form className="mt-7 space-y-5" onSubmit={submit} noValidate>
    <PasswordField label="Nueva contraseña" error={errors.newPassword?.message} registration={register('newPassword')} />
    <PasswordField label="Repetir contraseña" error={errors.confirmation?.message} registration={register('confirmation')} />
    <Button className="w-full" disabled={!token || isSubmitting} icon={<KeyRound size={18} />} type="submit">Guardar contraseña</Button>
  </form></AuthCard>;
}

function PasswordField({ label, error, registration }: { label: string; error?: string; registration: ReturnType<ReturnType<typeof useForm<z.infer<typeof schema>>>['register']> }) {
  const [showPassword, setShowPassword] = useState(false);

  return <label className="block text-sm font-semibold">{label}<span className="relative mt-2 block"><input {...registration} autoComplete="new-password" className="w-full rounded-lg border border-mendoza-border px-3 py-2.5 pr-11 outline-none focus:border-mendoza-sky focus:ring-2 focus:ring-mendoza-sky/25" type={showPassword ? 'text' : 'password'} /><button aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 rounded-r-lg px-3 text-mendoza-muted outline-none hover:text-mendoza-blue focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mendoza-sky" onClick={() => setShowPassword((current) => !current)} type="button">{showPassword ? <EyeOff aria-hidden="true" size={18} /> : <Eye aria-hidden="true" size={18} />}</button></span>{error && <span className="mt-1 block text-sm text-mendoza-error">{error}</span>}</label>;
}
