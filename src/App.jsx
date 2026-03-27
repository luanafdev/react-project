import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users as UsersIcon, Briefcase, ShoppingCart, 
  DollarSign, CreditCard, Calendar, FolderOpen, 
  UserCog, FileText, User, LogOut, Menu, X, Plane
} from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { AuthProvider } from '@/contexts/SupabaseAuthContext.jsx';
import Login from '@/components/Login';
import Dashboard from '@/components/Dashboard';
import Clients from '@/components/Clients';
import Services from '@/components/Services';
import NewSale from '@/components/NewSale';
import Sales from '@/components/Sales';
import AccountsReceivable from '@/components/AccountsReceivable';
import AccountsPayable from '@/components/AccountsPayable';
import Schedulings from '@/components/Schedulings';
import Categories from '@/components/Categories';
import UsersComponent from '@/components/Users';
import HumanResources from '@/components/HumanResources';
import FeriasEGozos from '@/components/FeriasEGozos';
import Reports from '@/components/Reports';
import Profile from '@/components/Profile';

// Componente principal da aplicação (DENTRO do AuthProvider)
function AppContent() {
  const { session, user, signOut, loading } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1024);
  const [isLg, setIsLg] = useState(window.innerWidth > 1024);

  useEffect(() => {
    const handleResize = () => {
      const isLarge = window.innerWidth > 1024;
      setIsLg(isLarge);
      if (isLarge) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Verifica se o usuário é admin
  const isAdmin = user?.user_metadata?.role === 'admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', label: 'Clientes', icon: UsersIcon },
    { id: 'services', label: 'Serviços', icon: Briefcase },
    { id: 'newSale', label: 'Nova Venda', icon: ShoppingCart },
    { id: 'sales', label: 'Vendas', icon: DollarSign },
    { id: 'receivable', label: 'Contas a Receber', icon: DollarSign },
    { id: 'payable', label: 'Contas a Pagar', icon: CreditCard },
    { id: 'schedulings', label: 'Agendamentos', icon: Calendar },
    { id: 'categories', label: 'Categorias', icon: FolderOpen },
    // Item "Usuários" só aparece para administradores
    ...(isAdmin ? [{ id: 'users', label: 'Usuários', icon: UserCog }] : []),
    { id: 'hr', label: 'Recursos Humanos', icon: UsersIcon },
    { id: 'ferias', label: 'Férias e Gozos', icon: Plane },
    { id: 'reports', label: 'Relatórios', icon: FileText },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard setActiveSection={setActiveSection} />;
      case 'clients': return <Clients />;
      case 'services': return <Services />;
      case 'newSale': return <NewSale />;
      case 'sales': return <Sales />;
      case 'receivable': return <AccountsReceivable />;
      case 'payable': return <AccountsPayable />;
      case 'schedulings': return <Schedulings />;
      case 'categories': return <Categories />;
      case 'users': return isAdmin ? <UsersComponent /> : <Dashboard setActiveSection={setActiveSection} />;
      case 'hr': return <HumanResources />;
      case 'ferias': return <FeriasEGozos />;
      case 'reports': return <Reports />;
      case 'profile': return <Profile />;
      default: return <Dashboard setActiveSection={setActiveSection} />;
    }
  };

  const Sidebar = () => (
    <div className="fixed lg:relative top-0 left-0 h-full w-72 bg-[#1a1a1a] text-white z-50 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Flex Vistorias</h1>
          {!isLg && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg transition-colors text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setActiveSection(item.id);
                if (!isLg) setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${isActive ? 'bg-orange-500 text-white font-semibold' : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'}`}
            >
              <Icon className={`w-5 h-5 ${isActive ? '' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="mb-2 px-2">
          <p className="text-xs text-slate-400">
            Logado como: <span className="text-orange-400 capitalize">{user?.user_metadata?.role || 'user'}</span>
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={signOut}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-red-600 hover:text-white transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </motion.button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return <Login />;
  }

  return (
    <>
      <Helmet>
        <title>Flex Vistorias - Sistema de Gestão</title>
        <meta name="description" content="Sistema completo de gestão para empresas de vistorias veiculares" />
      </Helmet>
      <div className="min-h-screen w-full bg-slate-100 dark:bg-slate-900 lg:flex">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              key="sidebar"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={`${isLg ? 'lg:relative' : 'fixed inset-y-0 left-0 z-50'}`}
            >
              <Sidebar />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex-1 flex flex-col min-h-screen w-full">
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-700 px-6 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </button>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{user?.user_metadata?.name || user?.email}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    {user?.user_metadata?.role === 'admin' ? 'Administrador' : user?.user_metadata?.role || 'Usuário'}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shadow-md">
                  {(user?.user_metadata?.name || user?.email)?.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-y-auto">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderSection()}
            </motion.div>
          </main>
        </div>
        <Toaster />
      </div>
    </>
  );
}

// Componente App principal que envolve com AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;