import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: "", description: "" });
  const { toast } = useToast();

  // 🔹 Carregar categorias do banco
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setCategories(data);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", description: "" });
    setEditingCategory(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Erro",
        description: "O nome da categoria é obrigatório.",
        variant: "destructive",
      });
      return;
    }

    if (editingCategory) {
      // Atualizar categoria existente
      const { error } = await supabase
        .from("categories")
        .update({
          name: formData.name,
          description: formData.description || null,
        })
        .eq("id", editingCategory.id);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Categoria atualizada!" });
        fetchCategories();
        resetForm();
      }
    } else {
      // Criar nova categoria
      const { error } = await supabase
        .from("categories")
        .insert([{ name: formData.name, description: formData.description || null }]);

      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: "Categoria criada!" });
        fetchCategories();
        resetForm();
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({ name: category.name, description: category.description || "" });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Removido", description: "Categoria removida." });
      fetchCategories();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Categorias de Serviços</h1>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="main-card p-6"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-4">
            {editingCategory ? "Editar Categoria" : "Nova Categoria"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nome da categoria *"
              className="w-full p-2 border rounded-md"
            />
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descrição (opcional)"
              className="w-full p-2 border rounded-md"
              rows="3"
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {editingCategory ? "Atualizar" : "Salvar"}
              </Button>
              <Button type="button" onClick={resetForm} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Nome</th>
                <th className="p-3 text-left text-sm font-semibold">Descrição</th>
                <th className="p-3 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <motion.tr
                  key={category.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="p-3 text-slate-800 font-medium">{category.name}</td>
                  <td className="p-3 text-slate-600">{category.description || "-"}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md"
                      >
                        <Edit className="w-4 h-4 text-slate-700" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 bg-red-500 hover:bg-red-600 rounded-md"
                      >
                        <Trash className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma categoria cadastrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Categories;