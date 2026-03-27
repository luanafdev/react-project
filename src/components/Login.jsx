import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/SupabaseAuthContext.jsx';
import { useToast } from '@/components/ui/use-toast';
import { Helmet } from 'react-helmet';

const Login = () => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        variant: "destructive",
        title: "Campos obrigatórios",
        description: "Por favor, preencha o e-mail e a senha.",
      });
      return;
    }
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      // O toast de erro já é tratado no useAuth
      console.error("Login failed:", error.message);
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Login - Flex Vistorias</title>
        <meta name="description" content="Acesse o sistema de gestão Flex Vistorias." />
      </Helmet>
      <div className="min-h-screen w-full bg-slate-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-800">
                  Flex Vistorias
                </h1>
                <p className="text-slate-500 mt-2">Bem-vindo(a) de volta!</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-mail"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Senha"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-base" disabled={loading}>
                  {loading ? (
                    'Entrando...'
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>
            </div>
            <div className="bg-slate-50 p-4 text-center text-sm text-slate-500 border-t">
              Esqueceu sua senha? Entre em contato com o suporte.
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;