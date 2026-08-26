import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginFormData } from '../schemas/authSchema';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    const success = await login(data.email, data.password);
    if (success) navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-slate-900">
      {/* Columna Izquierda: Formulario */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          <div className="flex items-center mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mr-3">
              M
            </div>
            <span className="text-2xl font-bold text-slate-900 dark:text-white">Modexastock</span>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Inicia sesión</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            Bienvenido de nuevo. Ingresa tus credenciales.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-colors ${
                  errors.email
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                placeholder="admin@modexastock.com"
                disabled={loading}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                {...register('password')}
                className={`w-full px-4 py-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:outline-none transition-colors ${
                  errors.password
                    ? 'border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:ring-offset-slate-900"
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Credenciales demo:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                admin@modexastock.com
              </span>{' '}
              /{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                password123
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Columna Derecha: Branding (Oculta en móvil) */}
      <div className="hidden lg:flex flex-1 bg-indigo-600 relative overflow-hidden">
        {/* CAMBIO AQUÍ: bg-gradient-to-br -> bg-linear-to-br */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-indigo-800"></div>
        <div
          className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        ></div>
        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            El control total de tu tienda en un solo lugar.
          </h1>
          <p className="text-indigo-200 text-lg">
            Gestión de inventario, punto de venta, tesorería y reportes en tiempo real.
          </p>
        </div>
      </div>
    </div>
  );
}
