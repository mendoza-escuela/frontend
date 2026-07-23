import { zodResolver } from '@hookform/resolvers/zod';
import { Mail } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { AuthCard } from '../components/auth/AuthCard';
import { Button } from '../components/ui/Button';
import { getHttpErrorMessage } from '../lib/http-error';
import { showError, showSuccess } from '../lib/toast';
import { authService } from '../services/auth.service';

const schema = z.object({ email: z.email('Ingresá un correo válido.') });

export function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const submit = handleSubmit(async ({ email }) => {
    try { showSuccess((await authService.forgotPassword(email)).message); }
    catch (error) { showError(getHttpErrorMessage(error)); }
  });
  return <AuthCard title="Recuperar contraseña" description="Si el correo está registrado, enviaremos un enlace temporal de un solo uso.">
    <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
      <label className="block text-sm font-semibold">Correo institucional<input {...register('email')} autoComplete="email" className="mt-2 w-full rounded-lg border border-mendoza-border px-3 py-2.5 outline-none focus:border-mendoza-sky focus:ring-2 focus:ring-mendoza-sky/25" type="email" />{errors.email && <span className="mt-1 block text-sm text-mendoza-error">{errors.email.message}</span>}</label>
      <Button className="w-full" disabled={isSubmitting} icon={<Mail size={18} />} type="submit">Enviar enlace</Button>
    </form>
  </AuthCard>;
}
