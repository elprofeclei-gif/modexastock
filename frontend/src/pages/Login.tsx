import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/authSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-6">
      <div className="w-full max-w-md space-y-5">
        {/* Cabecera Minimalista */}
        <div className="text-center">
          <img
            src="/logo.svg"
            alt="Logo Modexastock"
            className="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-md dark:drop-shadow-[0_0_15px_rgba(79,70,229,0.4)]"
          />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            ModexaStock v1.0
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Panel de administración y punto de venta
          </p>
        </div>

        {/* Tarjeta de Formulario Premium */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 space-y-4"
        >
          {/* CAMPO EMAIL */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Mail className={`w-5 h-5 ${errors.email ? 'text-red-400' : 'text-slate-400'}`} />
              </div>
              <input
                type="email"
                {...register('email')}
                className={`w-full pl-11 pr-4 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all text-sm ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                placeholder="admin@modexastock.com"
                autoComplete="email"
              />
            </div>
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* CAMPO CONTRASEÑA */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock
                  className={`w-5 h-5 ${errors.password ? 'text-red-400' : 'text-slate-400'}`}
                />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                className={`w-full pl-11 pr-11 py-3 rounded-xl border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-all text-sm ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* BOTÓN DE SUBMIT */}
          <button
            type="submit"
            disabled={loading || !isValid}
            className="w-full py-3 mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* FOOTER DE SEGURIDAD Y CREDENCIALES */}
        <div className="text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500">
            <ShieldCheck size={12} />
            <span>Conexión segura y encriptada (JWT)</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            ¿Primera vez? Usa:{' '}
            <span className="font-mono font-medium text-slate-600 dark:text-slate-400">
              admin@modexastock.com / password123
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
