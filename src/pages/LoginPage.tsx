import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { AuthCard } from '../components/auth/AuthCard';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { getHttpErrorMessage } from '../lib/http-error';
import { showError } from '../lib/toast';

const schema = z.object({
  email: z.email('Ingresá un correo válido.'),
  password: z.string().min(1, 'Ingresá tu contraseña.'),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({ resolver: zodResolver(schema) });

  const submit = handleSubmit(async ({ email, password }) => {
    try {
      const user = await login(email, password);
      navigate(user.mustChangePassword ? '/cambiar-clave' : user.role === 'admin' ? '/admin' : '/colegio', { replace: true });
    } catch (error) { showError(getHttpErrorMessage(error)); }
  });

  return (
    <AuthCard title="Iniciar sesión" description="Ingresá con el correo institucional asociado a tu cuenta.">
      <form className="mt-7 space-y-5" onSubmit={submit} noValidate>
        <label className="block text-sm font-semibold text-[#1F2937]">Correo institucional
          <input {...register('email')} autoComplete="email" className="mt-2 w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 outline-none focus:border-[#3CB4E5] focus:ring-2 focus:ring-[#3CB4E5]/25" type="email" />
          {errors.email && <span className="mt-1 block text-sm text-[#DC2626]">{errors.email.message}</span>}
        </label>
        <label className="block text-sm font-semibold text-[#1F2937]">Contraseña
          <span className="relative mt-2 block">
            <input {...register('password')} autoComplete="current-password" className="w-full rounded-lg border border-[#E5E7EB] px-3 py-2.5 pr-11 outline-none focus:border-[#3CB4E5] focus:ring-2 focus:ring-[#3CB4E5]/25" type={showPassword ? 'text' : 'password'} />
            <button aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute inset-y-0 right-0 px-3 text-[#6B7280]" onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
          {errors.password && <span className="mt-1 block text-sm text-[#DC2626]">{errors.password.message}</span>}
        </label>
        <div className="text-right"><Link className="text-sm font-semibold text-[#000F9F] hover:underline" to="/recuperar-clave">¿Olvidaste tu contraseña?</Link></div>
        <Button className="w-full" disabled={isSubmitting} icon={<LogIn size={18} />} type="submit">{isSubmitting ? 'Ingresando…' : 'Ingresar'}</Button>
      </form>
    </AuthCard>
  );
}
