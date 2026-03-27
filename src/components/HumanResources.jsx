import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash, DollarSign, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabaseClient';

const HumanResources = () => {
  const [employees, setEmployees] = useState([]);
  const [activeTab, setActiveTab] = useState('list');
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [employeeForm, setEmployeeForm] = useState({});
  const [actionType, setActionType] = useState(null); 
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const { toast } = useToast();

  const fetchEmployees = useCallback(async () => {
    const { data, error } = await supabase.from('employees').select('*').order('name');
    if (error) {
      toast({ title: "Erro ao buscar funcionários", description: error.message, variant: "destructive" });
    } else {
      setEmployees(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleFormChange = (e) => {
    setEmployeeForm({ ...employeeForm, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setEmployeeForm({});
    setEditingEmployee(null);
    setActiveTab('list');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let error;

    const dataToSave = {
      ...employeeForm,
      salary: parseFloat(employeeForm.salary) || null,
      dependents: parseInt(employeeForm.dependents) || null,
    };
    
    if (editingEmployee) {
      const { error: updateError } = await supabase.from('employees').update(dataToSave).eq('id', editingEmployee.id);
      error = updateError;
      if(!error) toast({ title: `Funcionário atualizado com sucesso!` });
    } else {
      const { error: insertError } = await supabase.from('employees').insert([dataToSave]);
      error = insertError;
      if(!error) toast({ title: `Funcionário salvo com sucesso!` });
    }
    
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    fetchEmployees();
    resetForm();
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setEmployeeForm(employee);
    setActiveTab('form');
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if(error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Funcionário deletado com sucesso!` });
      fetchEmployees();
    }
  };

  const handleActionClick = (type, employee) => {
    setActionType(type);
    setSelectedEmployee(employee);
    toast({ title: "🚧 Funcionalidade em desenvolvimento!", description: "Você pode solicitar essa funcionalidade no próximo prompt! 🚀" });
  };
  
  const renderActionModalContent = () => {
    if (!selectedEmployee) return null;
    let title = "";
    if (actionType === 'advance') title = "Gerenciar Adiantamento";
    if (actionType === 'vacation') title = "Gerenciar Férias";
    if (actionType === 'termination') title = "Gerenciar Rescisão";
    
    return (
      <>
        <DialogHeader>
          <DialogTitle>{title} para {selectedEmployee.name}</DialogTitle>
        </DialogHeader>
        <div className="p-4">Funcionalidade em desenvolvimento...</div>
      </>
    );
  };

  const EmployeeForm = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Nome Completo</label><input name="name" value={employeeForm.name || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Data de Nascimento</label><input type="date" name="birth_date" value={employeeForm.birth_date || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">RG</label><input name="rg" value={employeeForm.rg || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">CPF</label><input name="cpf" value={employeeForm.cpf || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Endereço</label><input name="address" value={employeeForm.address || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Telefone</label><input name="phone" value={employeeForm.phone || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Email</label><input type="email" name="email" value={employeeForm.email || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Cargo</label><input name="role" value={employeeForm.role || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Data de Admissão</label><input type="date" name="admission_date" value={employeeForm.admission_date || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Salário</label><input type="number" name="salary" value={employeeForm.salary || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Dados Bancários</label><input name="bank_details" value={employeeForm.bank_details || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Benefícios</label><input name="benefits" value={employeeForm.benefits || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Departamento</label><input name="department" value={employeeForm.department || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Horário de Trabalho</label><input name="work_schedule" value={employeeForm.work_schedule || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
       <div><label className="block text-sm font-medium text-slate-600 mb-1">Dependentes</label><input type="number" name="dependents" value={employeeForm.dependents || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
        <Users className="w-8 h-8 text-orange-500" /> Recursos Humanos
      </h1>

      <div className="main-card p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">
            {activeTab === 'list' ? 'Lista de Funcionários' : editingEmployee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
          {activeTab === 'list' && (
            <Button onClick={() => { setActiveTab('form'); setEditingEmployee(null); setEmployeeForm({}); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo Funcionário
            </Button>
          )}
        </div>

        {activeTab === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] text-white">
                <tr>
                  <th className="p-3 text-left">Nome</th>
                  <th className="p-3 text-left">Cargo</th>
                  <th className="p-3 text-left">Telefone</th>
                  <th className="p-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id} className="border-b">
                    <td className="p-3">{emp.name}</td>
                    <td className="p-3">{emp.role}</td>
                    <td className="p-3">{emp.phone}</td>
                    <td className="p-3 text-center space-x-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => handleActionClick('advance', emp)}><DollarSign className="h-4 w-4"/></Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => handleActionClick('vacation', emp)}><Calendar className="h-4 w-4"/></Button>
                        </DialogTrigger>
                        <DialogTrigger asChild>
                           <Button variant="outline" size="sm" onClick={() => handleActionClick('termination', emp)}><FileText className="h-4 w-4"/></Button>
                        </DialogTrigger>
                         <DialogContent>{renderActionModalContent()}</DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}><Edit className="h-4 w-4 text-blue-500"/></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(emp.id)}><Trash className="h-4 w-4 text-red-500"/></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
             {employees.length === 0 && <div className="text-center py-12 text-slate-500">Nenhum funcionário cadastrado.</div>}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <EmployeeForm />
            <div className="flex justify-end gap-2 mt-6">
              <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">{editingEmployee ? 'Atualizar' : 'Salvar'}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default HumanResources;