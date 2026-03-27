import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const AccountsPayable = () => {
  const [payables, setPayables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPayable, setEditingPayable] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    supplier: '',
    amount: '',
    due_date: '',
    status: 'Não pago'
  });
  const { toast } = useToast();

  const getAutoStatus = useCallback((dueDate, currentStatus) => {
    if (currentStatus === 'Pago') return 'Pago';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate + 'T00:00:00');
    if (due < today) return 'Atrasado';
    return 'Não pago';
  }, []);

  const fetchPayables = useCallback(async () => {
    const { data, error } = await supabase.from('accounts_payable').select('*').order('due_date');
    if (error) {
      toast({ title: "Erro ao buscar contas", description: error.message, variant: 'destructive' });
    } else {
      const updated = data.map(p => ({ ...p, status: getAutoStatus(p.due_date, p.status) }));
      setPayables(updated);
    }
  }, [toast, getAutoStatus]);

  useEffect(() => {
    fetchPayables();
  }, [fetchPayables]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({ description: '', supplier: '', amount: '', due_date: '', status: 'Não pago' });
    setEditingPayable(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.amount || !formData.due_date) {
      toast({ title: "Erro", description: "Descrição, valor e vencimento são obrigatórios.", variant: "destructive" });
      return;
    }

    const payableData = {
      ...formData,
      amount: parseFloat(formData.amount),
      status: getAutoStatus(formData.due_date, formData.status)
    };

    let error;
    if (editingPayable) {
      const { error: updateError } = await supabase.from('accounts_payable').update(payableData).eq('id', editingPayable.id);
      error = updateError;
      if (!error) toast({ title: "Sucesso", description: "Conta atualizada com sucesso!" });
    } else {
      const { error: insertError } = await supabase.from('accounts_payable').insert([payableData]);
      error = insertError;
      if (!error) toast({ title: "Sucesso", description: "Conta cadastrada com sucesso!" });
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    fetchPayables();
    resetForm();
  };

  const handleMarkAsPaid = async (id) => {
    const { error } = await supabase.from('accounts_payable').update({ status: 'Pago' }).eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } else {
      fetchPayables();
      toast({ title: "Sucesso", description: "Conta marcada como paga!" });
    }
  };

  const handleEdit = (payable) => {
    setEditingPayable(payable);
    setFormData({
      description: payable.description,
      supplier: payable.supplier || '',
      amount: payable.amount,
      due_date: payable.due_date,
      status: payable.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('accounts_payable').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } else {
      fetchPayables();
      toast({ title: "Removido", description: "Conta removida com sucesso." });
    }
  };

  const getStatusPill = (status) => {
    switch (status) {
      case 'Pago': return <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">Pago</span>;
      case 'Não pago': return <span className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-100 rounded-full">Não pago</span>;
      case 'Atrasado': return <span className="px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">Atrasado</span>;
      default: return <span className="px-2 py-1 text-xs font-medium text-slate-800 bg-slate-100 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Contas a Pagar</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conta
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="main-card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{editingPayable ? 'Editar Conta' : 'Nova Conta'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Descrição *</label>
              <input type="text" name="description" value={formData.description} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Fornecedor</label>
              <input type="text" name="supplier" value={formData.supplier} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Valor *</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Vencimento *</label>
              <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="w-full p-2 border rounded-md" />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white w-full">{editingPayable ? 'Atualizar' : 'Cadastrar'}</Button>
              <Button type="button" onClick={resetForm} variant="outline" className="w-full">Cancelar</Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Descrição</th>
                <th className="p-3 text-left text-sm font-semibold">Fornecedor</th>
                <th className="p-3 text-left text-sm font-semibold">Valor</th>
                <th className="p-3 text-left text-sm font-semibold">Vencimento</th>
                <th className="p-3 text-left text-sm font-semibold">Status</th>
                <th className="p-3 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {payables.map((payable) => (
                <motion.tr key={payable.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 text-slate-800 font-medium">{payable.description}</td>
                  <td className="p-3 text-slate-600">{payable.supplier || '-'}</td>
                  <td className="p-3 text-slate-800 font-medium">R$ {payable.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="p-3 text-slate-600">{new Date(payable.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-3">{getStatusPill(payable.status)}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      {payable.status !== 'Pago' && (
                        <button onClick={() => handleMarkAsPaid(payable.id)} className="p-2 bg-green-100 hover:bg-green-200 rounded-md" title="Marcar como pago">
                          <CheckCircle className="w-4 h-4 text-green-700" />
                        </button>
                      )}
                      <button onClick={() => handleEdit(payable)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md">
                        <Edit className="w-4 h-4 text-slate-700" />
                      </button>
                      <button onClick={() => handleDelete(payable.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-md">
                        <Trash className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {payables.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhuma conta a pagar cadastrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountsPayable;