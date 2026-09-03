import AppRoutes from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <AppRoutes />
      {/* Este componente renderiza todas las notificaciones de react-hot-toast */}
      <Toaster
        position="top-right"
        containerStyle={{ zIndex: 999999 }}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            zIndex: 999999,
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
