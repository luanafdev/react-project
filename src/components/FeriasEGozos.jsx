import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const Vacations = () => {
  const [vacations, setVacations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingVacation, setEditingVacation] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reference_year: new Date().getFullYear(),
    status: 'Scheduled',
    notes: ''
  });

  const { toast } = useToast();

  // 📦 Buscar férias
  const fetchVacations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_vacations')
      .select('*, employees(name)')
      .order('start_date', { ascending: false });

    if (error) {
      toast({ title: 'Erro ao carregar férias', description: error.message, variant: 'destructive' });
    } else {
      setVacations(data);
    }
    setLoading(false);
  };

  // 👤 Buscar funcionários
  const fetchEmployees = async () => {
    const { data, error } = await supabase.from('employees').select('id, name').order('name');
    if (error) {
      toast({ title: 'Erro ao carregar funcionários', description: error.message, variant: 'destructive' });
    } else {
      setEmployees(data);
    }
  };

  useEffect(() => {
    fetchVacations();
    fetchEmployees();
  }, []);

  // 📄 Form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      employee_id: '',
      start_date: '',
      end_date: '',
      reference_year: new Date().getFullYear(),
      status: 'Scheduled',
      notes: ''
    });
    setEditingVacation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.employee_id || !formData.start_date || !formData.end_date) {
      toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }

    const dataToSave = {
      employee_id: formData.employee_id,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: formData.status,
      notes: formData.notes
    };

    let error;
    if (editingVacation) {
      const { error: updateError } = await supabase
        .from('employee_vacations')
        .update(dataToSave)
        .eq('id', editingVacation.id);
      error = updateError;
      if (!error) toast({ title: 'Sucesso', description: 'Férias atualizadas com sucesso!' });
    } else {
      const { error: insertError } = await supabase.from('employee_vacations').insert([dataToSave]);
      error = insertError;
      if (!error) toast({ title: 'Sucesso', description: 'Férias adicionadas com sucesso!' });
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }

    fetchVacations();
    resetForm();
  };

  const handleEdit = (vacation) => {
    setEditingVacation(vacation);
    setFormData({
      employee_id: vacation.employee_id,
      start_date: vacation.start_date,
      end_date: vacation.end_date,
      reference_year: new Date(vacation.start_date).getFullYear(),
      status: vacation.status,
      notes: vacation.notes || ''
    });
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('employee_vacations').delete().eq('id', id);
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Removido', description: 'Registro excluído com sucesso.' });
      fetchVacations();
    }
  };

  const filteredVacations = vacations.filter(vac =>
    vac.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vac.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(vac.start_date).getFullYear().toString().includes(searchTerm)
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Férias e Gozos</h1>

      {/* Formulário */}
      <div className="main-card p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">
          {editingVacation ? 'Editar Registro de Férias' : 'Adicionar Novo Registro'}
        </h2>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Funcionário *</label>
            <select
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Selecione...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data Início *</label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Data Término *</label>
            <input type="date" name="end_date" value={formData.end_date} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded-md bg-white">
              <option value="Scheduled">Agendado</option>
              <option value="Ongoing">Em andamento</option>
              <option value="Completed">Concluído</option>
            </select>
          </div>

          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Observações</label>
            <textarea name="notes" value={formData.notes} onChange={handleInputChange} placeholder="Adicionar observações..." className="w-full p-2 border rounded-md" />
          </div>

          <div className="flex items-center h-full">
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white w-full">
              <Plus className="w-4 h-4 mr-2" />
              {editingVacation ? 'Atualizar Registro' : 'Adicionar Registro'}
            </Button>
            {editingVacation && (
              <Button variant="outline" onClick={resetForm} className="ml-2">
                Cancelar
              </Button>
            )}
          </div>

          <div className="lg:col-span-4">
            <label className="block text-sm font-medium text-slate-600 mb-1">Buscar Registros</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, status ou ano..."
                className="w-full p-2 pl-10 border rounded-md"
              />
            </div>
          </div>
        </form>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-semibold">Funcionário</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Data Início</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Data Fim</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Ano Ref.</th>
                <th className="text-left py-3 px-4 text-sm font-semibold">Status</th>
                <th className="text-center py-3 px-4 text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500">Carregando...</td></tr>
              ) : filteredVacations.length > 0 ? (
                filteredVacations.map(vac => (
                  <motion.tr
                    key={vac.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-800 font-medium">{vac.employees?.name || 'Funcionário não encontrado'}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(vac.start_date)}</td>
                    <td className="py-3 px-4 text-slate-600">{formatDate(vac.end_date)}</td>
                    <td className="py-3 px-4 text-slate-600">{new Date(vac.start_date).getFullYear()}</td>
                    <td className="py-3 px-4 text-slate-600">{vac.status}</td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(vac)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md">
                          <Edit className="w-4 h-4 text-slate-700" />
                        </button>
                        <button onClick={() => handleDelete(vac.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-md">
                          <Trash className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr><td colSpan="6" className="text-center py-12 text-slate-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Vacations;