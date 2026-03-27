import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
const Services = () => {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    price: '',
    cost: '',
    duration: '',
    category_id: ''
  });
  const {
    toast
  } = useToast();
  const fetchServices = async () => {
    const {
      data,
      error
    } = await supabase.from('services').select('*').order('name');
    if (error) {
      toast({
        title: "Erro ao carregar serviços",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setServices(data);
    }
  };
  const fetchCategories = async () => {
    const {
      data,
      error
    } = await supabase.from('categories').select('*').order('name');
    if (error) {
      toast({
        title: "Erro ao carregar categorias",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setCategories(data);
    }
  };
  useEffect(() => {
    fetchServices();
    fetchCategories();
  }, []);
  const handleInputChange = e => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      price: '',
      cost: '',
      duration: '',
      category_id: ''
    });
    setEditingService(null);
  };
  const handleSubmit = async e => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.code) {
      toast({
        title: "Erro",
        description: "Nome, preço e código são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    const dataToSave = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      cost: parseFloat(formData.cost) || null,
      duration: parseInt(formData.duration) || null,
      category_id: formData.category_id ? formData.category_id : null
    };
    let error;
    if (editingService) {
      const {
        error: updateError
      } = await supabase.from('services').update(dataToSave).eq('id', editingService.id);
      error = updateError;
      if (!error) toast({
        title: "Sucesso",
        description: `Serviço atualizado com sucesso!`
      });
    } else {
      const {
        error: insertError
      } = await supabase.from('services').insert([dataToSave]);
      error = insertError;
      if (!error) toast({
        title: "Sucesso",
        description: `Serviço adicionado com sucesso!`
      });
    }
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
      return;
    }
    fetchServices();
    resetForm();
  };
  const handleEdit = service => {
    setEditingService(service);
    setFormData({
      code: service.code || '',
      name: service.name || '',
      price: service.price || '',
      cost: service.cost || '',
      duration: service.duration || '',
      category_id: service.category_id || ''
    });
  };
  const handleDelete = async id => {
    const {
      error
    } = await supabase.from('services').delete().eq('id', id);
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Removido",
        description: "Serviço removido com sucesso."
      });
      fetchServices();
    }
  };
  const filteredServices = services.filter(service => service.name.toLowerCase().includes(searchTerm.toLowerCase()) || service.code && service.code.toLowerCase().includes(searchTerm.toLowerCase()));
  const formatCurrency = value => `R$ ${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2
  })}`;
  const getCategoryName = categoryId => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };
  return <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Serviços</h1>

      <div className="main-card p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">{editingService ? 'Editar Serviço' : 'Adicionar Novo Serviço'}</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Código *</label>
            <input type="text" name="code" value={formData.code} onChange={handleInputChange} placeholder="Ex: 001" className="w-full p-2 border rounded-md" />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-600 mb-1">Nome do serviço *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder="Nome do serviço" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Preço (R$) *</label>
            <input type="number" step="0.01" name="price" value={formData.price} onChange={handleInputChange} placeholder="Preço" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Custo (R$)</label>
            <input type="number" step="0.01" name="cost" value={formData.cost} onChange={handleInputChange} placeholder="Custo" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Duração (min)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleInputChange} placeholder="Duração" className="w-full p-2 border rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Categoria</label>
            <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
              <option value="">Selecione uma categoria</option>
              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div className="flex items-center h-full">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white w-full">
              <Plus className="w-4 h-4 mr-2" />
              {editingService ? 'Atualizar Serviço' : 'Adicionar Serviço'}
            </Button>
            {editingService && <Button variant="outline" onClick={resetForm} className="ml-2">Cancelar</Button>}
          </div>
          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Buscar Serviços</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por código ou nome..." className="w-full p-2 pl-10 border rounded-md" />
            </div>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Código</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Nome</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Preço</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Custo</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Lucro</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Duração</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Categoria</th>
                <th className="text-center py-3 px-4 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map(service => {
              const profit = parseFloat(service.price || 0) - parseFloat(service.cost || 0);
              return <motion.tr key={service.id} initial={{
                opacity: 0
              }} animate={{
                opacity: 1
              }} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-600">{service.code}</td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{service.name}</td>
                    <td className="py-3 px-4 text-slate-600">{formatCurrency(service.price)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatCurrency(service.cost)}</td>
                    <td className={`py-3 px-4 font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(profit)}</td>
                    <td className="py-3 px-4 text-slate-600">{service.duration ? `${service.duration} min` : '-'}</td>
                    <td className="py-3 px-4 text-slate-600">{getCategoryName(service.category_id)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleEdit(service)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md">
                          <Edit className="w-4 h-4 text-slate-700" />
                        </button>
                        <button onClick={() => handleDelete(service.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-md">
                          <Trash className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>;
            })}
            </tbody>
          </table>
          {filteredServices.length === 0 && <div className="text-center py-12">
              <p className="text-slate-500">Nenhum serviço encontrado.</p>
            </div>}
        </div>
      </div>
    </div>;
};
export default Services;