import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from '../api/axios';
import {
  User,
  Settings,
  Database,
  Users,
  LogOut,
  Moon,
  Sun,
  ChevronDown,
  Bell,
  AlertTriangle,
  ShieldCheck,
  AlertCircle,
  Ban,
  Wallet,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import Clock from './Clock';

interface LayoutProps {
  children: React.ReactNode;
}

// Definimos explícitamente el tipo para evitar el error de "undefined" en el path
interface MenuItem {
  name: string;
  path?: string;
  roles: string[];
  children?: MenuItem[];
}

export default function Layout({ children }: LayoutProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data.data);
      } catch (error) {
        console.error('Error fetching notifications', error);
      }
    };

    fetchNotifs();
    // Se actualiza cada 45 segundos
    const interval = setInterval(fetchNotifs, 45000);
    return () => clearInterval(interval);
  }, [user?.role, location.pathname]); // Se actualiza si cambia de página

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  // Cerrar menú móvil y dropdowns al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
    setOpenDropdown(null);
  }, [location.pathname]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;
  const getInitials = (name?: string) =>
    name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || '?';

  const menu: MenuItem[] = [
    { name: 'Dashboard', path: '/', roles: ['ADMIN', 'MANAGER'] },
    { name: 'POS', path: '/pos', roles: ['ADMIN', 'MANAGER', 'USER'] },
    {
      name: 'Operaciones',
      roles: ['ADMIN', 'MANAGER', 'USER'],
      children: [
        { name: 'Ventas', path: '/sales', roles: ['ADMIN', 'MANAGER', 'USER'] },
        { name: 'Registrar Compra', path: '/purchases', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Historial Compras', path: '/purchases/history', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Clientes', path: '/clients', roles: ['ADMIN', 'MANAGER', 'USER'] },
      ],
    },
    {
      name: 'Finanzas',
      roles: ['ADMIN', 'MANAGER'],
      children: [
        { name: 'Tesorería', path: '/treasury', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Historial de Caja', path: '/cash-history', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Bitácora', path: '/audit-logs', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Utilidades (P&G)', path: '/profit-loss', roles: ['ADMIN', 'MANAGER'] },
      ],
    },
    { name: 'Inventario', path: '/inventory', roles: ['ADMIN', 'MANAGER'] },
  ];

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
    }`;

  // Aplanar el menú para móvil
  const mobileMenu: MenuItem[] = [
    ...menu.filter((m) => m.path && user?.role && m.roles.includes(user.role)),
    ...menu.flatMap((m) =>
      m.children ? m.children.filter((c) => user?.role && c.roles.includes(user.role)) : []
    ),
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
      <nav className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* LADO IZQUIERDO: Logo y Menú */}
            <div className="flex items-center space-x-4 md:space-x-8">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-600 dark:text-slate-300"
              >
                {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
              </button>

              <Link
                to="/"
                className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-lg"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm">
                  M
                </div>
                <span className="hidden sm:inline">Modexastock</span>
              </Link>

              <div className="hidden md:flex items-center space-x-1">
                {user &&
                  menu.map((item) => {
                    if (!item.roles.includes(user.role)) return null;

                    if (item.children) {
                      return (
                        <div key={item.name} className="relative">
                          <button
                            onClick={() =>
                              setOpenDropdown(openDropdown === item.name ? null : item.name)
                            }
                            className="px-3 py-2 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center"
                          >
                            {item.name}
                            <ChevronDown className="w-4 h-4 ml-1" />
                          </button>
                          {openDropdown === item.name && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() => setOpenDropdown(null)}
                              ></div>
                              <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 z-20 py-1">
                                {item.children
                                  .filter((child) => child.roles.includes(user.role))
                                  .map((child) => (
                                    <NavLink
                                      key={child.path}
                                      to={child.path!}
                                      onClick={() => setOpenDropdown(null)}
                                      className={({ isActive }) =>
                                        `block px-4 py-2 text-sm ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`
                                      }
                                    >
                                      {child.name}
                                    </NavLink>
                                  ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    }

                    return (
                      <NavLink key={item.path} to={item.path!} className={linkClass}>
                        {item.name}
                      </NavLink>
                    );
                  })}
              </div>
            </div>

            {/* LADO DERECHO: Notificaciones, Reloj y Perfil */}
            <div className="flex items-center space-x-4 md:space-x-6">
              {/* ✅ CENTRO DE NOTIFICACIONES */}
              <div className="relative">
                <button
                  onClick={() => setShowNotif(!showNotif)}
                  className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotif && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-100 dark:border-slate-700 z-20 overflow-hidden">
                      <div className="flex justify-between items-center p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Centro de Mensajes
                        </p>
                        <button
                          onClick={() => setShowNotif(false)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-8 text-center text-sm text-slate-400">
                            No tienes notificaciones nuevas. 🟢
                          </p>
                        ) : (
                          notifications.map((n, idx) => {
                            const Icon =
                              n.icon === 'AlertTriangle'
                                ? AlertTriangle
                                : n.icon === 'AlertCircle'
                                  ? AlertCircle
                                  : n.icon === 'Ban'
                                    ? Ban
                                    : Wallet;
                            const colorClass =
                              n.color === 'amber' ? 'text-amber-500' : 'text-red-500';
                            return (
                              <div
                                key={idx}
                                className="p-3 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer"
                              >
                                <div className="flex gap-3">
                                  <Icon size={20} className={`${colorClass} shrink-0 mt-0.5`} />
                                  <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                      {n.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {n.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <Clock />

              {/* MENÚ DE USUARIO */}
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'userPanel' ? null : 'userPanel')}
                  className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                    {getInitials(user?.name)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-slate-900 dark:text-white leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 capitalize mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> {user?.role}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${openDropdown === 'userPanel' ? 'rotate-180' : ''}`}
                  />
                </button>

                {openDropdown === 'userPanel' && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpenDropdown(null)}></div>
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 z-20 py-2 overflow-hidden">
                      <div className="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-lg ring-4 ring-indigo-50 dark:ring-indigo-500/10">
                          {getInitials(user?.name)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {user?.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user?.email}
                          </p>
                          <span className="mt-1 flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span> Sesión
                            Activa
                          </span>
                        </div>
                      </div>

                      <div className="py-2">
                        <NavLink
                          to="/profile"
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <User className="w-5 h-5 mr-3 text-slate-400" /> Mi Perfil
                        </NavLink>
                      </div>

                      {user && (user.role === 'ADMIN' || user.role === 'MANAGER') && (
                        <div className="py-2 border-t border-slate-100 dark:border-slate-700">
                          <p className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Administración
                          </p>
                          <NavLink
                            to="/settings"
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <Settings className="w-5 h-5 mr-3 text-slate-400" /> Configuración y
                            Catálogos
                          </NavLink>
                          <NavLink
                            to="/data-center"
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <Database className="w-5 h-5 mr-3 text-slate-400" /> Centro de Datos
                          </NavLink>
                        </div>
                      )}

                      {user && user.role === 'ADMIN' && (
                        <div className="py-2 border-t border-slate-100 dark:border-slate-700">
                          <NavLink
                            to="/users"
                            onClick={() => setOpenDropdown(null)}
                            className="flex items-center px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <Users className="w-5 h-5 mr-3 text-slate-400" /> Gestión de Usuarios
                          </NavLink>
                        </div>
                      )}

                      <div className="py-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={toggleTheme}
                          className="w-full flex items-center justify-between px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex items-center">
                            {isDark ? (
                              <Moon className="w-5 h-5 mr-3 text-slate-400" />
                            ) : (
                              <Sun className="w-5 h-5 mr-3 text-slate-400" />
                            )}
                            Modo Oscuro
                          </div>
                          <span
                            className={`relative inline-flex items-center h-5 w-9 rounded-full transition-colors ${isDark ? 'bg-indigo-600' : 'bg-slate-200'}`}
                          >
                            <span
                              className={`inline-block h-3 w-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-5' : 'translate-x-1'}`}
                            />
                          </span>
                        </button>
                      </div>

                      <div className="py-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="w-5 h-5 mr-3" /> Cerrar Sesión
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Menú Móvil Desplegable */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {mobileMenu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path!}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 w-full max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        {children}
      </main>

      <footer className="w-full max-w-screen-2xl mx-auto py-4 px-4 sm:px-6 lg:px-8 border-t border-slate-100 dark:border-slate-700 mt-auto">
        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          © {new Date().getFullYear()} Modexastock v2.0. Desarrollado por{' '}
          <span className="font-semibold text-slate-600 dark:text-slate-400">
            El Profeclei & IA
          </span>
          . Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
