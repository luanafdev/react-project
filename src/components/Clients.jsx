import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Clients = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClient, setEditingClient] = useState(null);
  const [canEditDocument, setCanEditDocument] = useState(false);
  const [formData, setFormData] = useState({ name: "", document: "" });
  const { toast } = useToast();

  const fetchClients = async () => {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Erro ao carregar clientes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setClients(data);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const formatDocument = (value) => {
    const cleaned = value.replace(/\D/g, "");

    if (cleaned.length <= 11) {
      return cleaned
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      return cleaned
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "document") {
      setFormData((prev) => ({
        ...prev,
        document: formatDocument(value),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const resetForm = () => {
    setFormData({ name: "", document: "" });
    setEditingClient(null);
    setCanEditDocument(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.document) {
      toast({
        title: "Erro",
        description: "Nome completo e CPF/CNPJ são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    let error;

    if (editingClient) {
      const { error: updateError } = await supabase
        .from("clients")
        .update({
          name: formData.name,
          document: formData.document,
        })
        .eq("id", editingClient.id);

      error = updateError;

      if (!error) {
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso!",
        });
      }
    } else {
      const { error: insertError } = await supabase
        .from("clients")
        .insert([formData]);

      error = insertError;

      if (!error) {
        toast({
          title: "Sucesso",
          description: "Cliente adicionado com sucesso!",
        });
      } else if (error.code === "23505") {
        toast({
          title: "Erro",
          description: "Já existe um cliente com este CPF/CNPJ.",
          variant: "destructive",
        });
        return;
      }
    }

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    resetForm();
    fetchClients();
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      document: client.document,
    });
    setCanEditDocument(false);
  };

  // ✅ OPÇÃO 1: checar agendamentos antes de deletar
  const handleDelete = async (id) => {
    const { data: schedulings, error: schedError } = await supabase
      .from("schedulings")
      .select("id")
      .eq("client_id", id)
      .limit(1);

    if (schedError) {
      toast({
        title: "Erro",
        description: schedError.message,
        variant: "destructive",
      });
      return;
    }

    if (schedulings && schedulings.length > 0) {
      toast({
        title: "Não é possível remover",
        description: "Este cliente possui agendamentos vinculados.",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("clients").delete().eq("id", id);

    if (error) {
      toast({
        title: "Erro ao deletar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removido",
        description: "Cliente removido com sucesso.",
      });
      fetchClients();
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.document.includes(searchTerm),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Clientes</h1>

      <div className="main-card p-6">
        <h2 className="text-xl font-bold mb-4">
          {editingClient ? "Editar Cliente" : "Adicionar Novo Cliente"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
        >
          <div>
            <label className="block text-sm font-medium mb-1">
              Nome completo *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">CPF/CNPJ *</label>
            <input
              type="text"
              name="document"
              maxLength={18}
              value={formData.document}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md"
              disabled={editingClient && !canEditDocument}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="bg-orange-500 text-white w-full">
              <Plus className="w-4 h-4 mr-2" />
              {editingClient ? "Atualizar" : "Adicionar"}
            </Button>

            {editingClient && (
              <Button variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>

          {editingClient && !canEditDocument && (
            <div className="md:col-span-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCanEditDocument(true)}
              >
                Editar CPF/CNPJ
              </Button>
            </div>
          )}
        </form>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou CPF/CNPJ..."
          className="w-full p-2 pl-10 border rounded-md"
        />
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#1a1a1a] text-white">
            <tr>
              <th className="text-left p-3">Nome</th>
              <th className="text-left p-3">CPF/CNPJ</th>
              <th className="text-center p-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <motion.tr
                key={client.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b hover:bg-slate-50"
              >
                <td className="p-3">{client.name}</td>
                <td className="p-3">{client.document}</td>
                <td className="p-3 text-center">
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 bg-slate-200 rounded-md"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 bg-red-500 rounded-md"
                    >
                      <Trash className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {filteredClients.length === 0 && (
          <div className="text-center py-10 text-slate-500">
            Nenhum cliente encontrado.
          </div>
        )}
      </div>
    </div>
  );
};

export default Clients;
