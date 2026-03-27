import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const Profile = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.name || '',
    phone: user?.user_metadata?.phone || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const { toast } = useToast();

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    
    // Atualiza metadados (nome, telefone)
    const { data, error } = await supabase.auth.updateUser({
        data: { name: formData.name, phone: formData.phone }
    });

    if (error) {
        toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
        return;
    }
    
    // Atualiza senha, se preenchido
    if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
            toast({ title: "Erro", description: "As novas senhas não coincidem.", variant: "destructive" });
            return;
        }
        const { error: passwordError } = await supabase.auth.updateUser({ password: formData.newPassword });
        if (passwordError) {
            toast({ title: "Erro ao atualizar senha", description: passwordError.message, variant: "destructive" });
            return;
        }
    }
    
    toast({ title: "Sucesso!", description: "Seu perfil foi atualizado." });
    setFormData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Meu Perfil</h1>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="main-card p-6">
        <div className="flex flex-col md:flex-row items-center gap-6 mb-8 pb-6 border-b">
          <div className="w-24 h-24 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-4xl shadow-md">
            {(user?.user_metadata?.name || user?.email)?.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 text-center md:text-left">{user?.user_metadata?.name}</h2>
            <p className="text-slate-600 text-center md:text-left">{user?.email}</p>
            <p className="text-sm text-purple-600 font-semibold capitalize text-center md:text-left">{user?.user_metadata?.role === 'admin' ? 'Supervisor' : user?.user_metadata?.role}</p>
          </div>
        </div>

        <form onSubmit={handleUpdateUser} className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800">Informações Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo *</label>
              <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Telefone</label>
              <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full p-2 border rounded-md" />
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="text-xl font-bold text-slate-800">Alterar Senha</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
               <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Nova Senha</label>
                <input type="password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full p-2 border rounded-md" placeholder='Deixe em branco para não alterar' />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Confirmar Nova Senha</label>
                <input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full p-2 border rounded-md" />
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Profile;