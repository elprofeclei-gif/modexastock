import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/authSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react'; // Ícono de carga moderno

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid }, // ✅ isValid nos dirá si el botón debe activarse
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange', // ✅ Valida mientras escribes, no solo al enviar
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Cabecera Minimalista */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30 mb-6">
            <span className="text-white font-bold text-3xl">M</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Modexastock v2.0
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Ingresa tus credenciales para continuar
          </p>
        </div>

        {/* Tarjeta de Formulario */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 space-y-6"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-colors ${
                errors.email
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
              placeholder="admin@modexastock.com"
              autoComplete="email"
            />
            {errors.email && (
              <p className="mt-2 text-xs text-red-500 font-medium">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Contraseña
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full px-4 py-3 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-colors ${
                errors.password
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
              }`}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {errors.password && (
              <p className="mt-2 text-xs text-red-500 font-medium">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            // ✅ El botón se deshabilita si está cargando O si el formulario no es válido
            disabled={loading || !isValid}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Ingresando...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        {/* Credenciales de prueba */}
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">
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
