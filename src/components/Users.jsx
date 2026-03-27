import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext.jsx";

const UsersComponent = () => {
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  // 🔹 Buscar usuários (public.users)
  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao buscar usuários",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setUsers(data || []);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      role: "user",
    });
    setEditingUser(null);
    setShowForm(false);
    setLoading(false);
  };

  // 🔹 Criar ou editar usuário
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!formData.name || !formData.email) {
      toast({
        title: "Erro",
        description: "Nome e e-mail são obrigatórios.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (!editingUser && !formData.password) {
      toast({
        title: "Erro",
        description: "Senha obrigatória para novo usuário.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // ✏️ EDITAR USUÁRIO (somente public.users)
      if (editingUser) {
        const { error } = await supabase
          .from("users")
          .update({
            name: formData.name,
            role: formData.role,
          })
          .eq("id", editingUser.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });

        fetchUsers();
        resetForm();
        return;
      }

      // ➕ CRIAR USUÁRIO (Auth apenas)
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      toast({
        title: "Usuário criado",
        description:
          "Usuário criado com sucesso. Verifique o e-mail para confirmação.",
      });

      // Aguarda trigger criar o registro em public.users
      setTimeout(fetchUsers, 800);
      resetForm();
    } catch (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowForm(true);
  };

  // 🔹 Remover usuário (apenas public.users)
  const handleDelete = async (id) => {
    if (id === currentUser?.id) {
      toast({
        title: "Ação bloqueada",
        description: "Você não pode excluir seu próprio usuário.",
        variant: "destructive",
      });
      return;
    }

    const confirm = window.confirm(
      "Deseja remover este usuário? A conta Auth deve ser removida manualmente no Supabase.",
    );

    if (!confirm) return;

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário removido",
        description: "Registro removido com sucesso.",
      });
      fetchUsers();
    }
  };

  const getRoleLabel = (role) =>
    ({
      admin: "Administrador",
      manager: "Gerente",
      user: "Usuário",
    })[role] || "N/A";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Usuários</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="main-card p-6"
        >
          <h2 className="text-xl font-bold mb-4">
            {editingUser ? "Editar Usuário" : "Novo Usuário"}
          </h2>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              type="text"
              placeholder="Nome completo *"
              className="p-2 border rounded"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              disabled={loading}
            />

            <input
              type="email"
              placeholder="E-mail *"
              className="p-2 border rounded"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              disabled={!!editingUser || loading}
            />

            <input
              type="password"
              placeholder={editingUser ? "Nova senha (opcional)" : "Senha *"}
              className="p-2 border rounded"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              disabled={loading}
            />

            <select
              className="p-2 border rounded bg-white"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
              disabled={loading}
            >
              <option value="user">Usuário</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>

            <div className="md:col-span-2 flex gap-2">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={loading}
              >
                {loading ? "Salvando..." : editingUser ? "Atualizar" : "Salvar"}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={loading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] text-white">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">E-mail</th>
              <th className="p-3 text-left">Perfil</th>
              <th className="p-3 text-center">Ações</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b hover:bg-slate-50">
                <td className="p-3 font-medium">{user.name}</td>
                <td className="p-3 text-slate-600">{user.email}</td>
                <td className="p-3">
                  <span className="px-2 py-1 text-xs rounded-full bg-slate-100">
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td className="p-3 flex justify-center gap-2">
                  <button
                    onClick={() => handleEdit(user)}
                    className="p-2 bg-slate-200 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="p-2 bg-red-500 text-white rounded"
                  >
                    <Trash size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhum usuário encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersComponent;
