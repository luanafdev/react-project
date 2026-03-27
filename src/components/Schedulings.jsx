import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const Schedulings = () => {
  const [schedulings, setSchedulings] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingScheduling, setEditingScheduling] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    service_id: '',
    date: '',
    time: '',
    notes: ''
  });
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());

  const fetchSchedulings = useCallback(async () => {
    const { data, error } = await supabase.from('schedulings').select('*, clients(name), services(name)');
    if (error) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } else {
      const formatted = data.map(s => ({
        ...s,
        clientName: s.clients?.name || 'Cliente Removido',
        serviceName: s.services?.name || 'Serviço Removido'
      }));
      setSchedulings(formatted);
    }
  }, [toast]);

  const fetchClientsAndServices = useCallback(async () => {
    const { data: clientsData, error: clientsError } = await supabase.from('clients').select('id, name');
    if (clientsError) toast({ title: "Erro", description: clientsError.message, variant: 'destructive' });
    else setClients(clientsData);

    const { data: servicesData, error: servicesError } = await supabase.from('services').select('id, name');
    if (servicesError) toast({ title: "Erro", description: servicesError.message, variant: 'destructive' });
    else setServices(servicesData);
  }, [toast]);

  useEffect(() => {
    fetchSchedulings();
    fetchClientsAndServices();
  }, [fetchSchedulings, fetchClientsAndServices]);

  const resetForm = () => {
    setFormData({ client_id: '', service_id: '', date: '', time: '', notes: '' });
    setEditingScheduling(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.client_id || !formData.service_id || !formData.date || !formData.time) {
      toast({ title: "Erro", description: "Todos os campos com * são obrigatórios.", variant: "destructive" });
      return;
    }
    
    const dataToSave = {
      client_id: formData.client_id,
      service_id: formData.service_id,
      date: formData.date,
      time: formData.time,
      notes: formData.notes,
    };

    let error;
    if (editingScheduling) {
      const { error: updateError } = await supabase.from('schedulings').update(dataToSave).eq('id', editingScheduling.id);
      error = updateError;
      if (!error) toast({ title: "Sucesso", description: "Agendamento atualizado!" });
    } else {
      const { error: insertError } = await supabase.from('schedulings').insert([dataToSave]);
      error = insertError;
      if (!error) toast({ title: "Sucesso", description: "Agendamento criado!" });
    }

    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      return;
    }
    fetchSchedulings();
    resetForm();
  };

  const handleEdit = (scheduling) => {
    setEditingScheduling(scheduling);
    setFormData({
      client_id: scheduling.client_id,
      service_id: scheduling.service_id,
      date: scheduling.date,
      time: scheduling.time,
      notes: scheduling.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('schedulings').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: 'destructive' });
    } else {
      fetchSchedulings();
      toast({ title: "Removido", description: "Agendamento removido." });
    }
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const changeMonth = (offset) => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const schedulingsByDay = schedulings.reduce((acc, s) => {
    const sDate = new Date(s.date + 'T00:00:00');
    const day = sDate.getDate();
    const sMonth = sDate.getMonth();
    const sYear = sDate.getFullYear();
    if (sYear === year && sMonth === month) {
      if (!acc[day]) acc[day] = [];
      acc[day].push(s);
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Agendamentos</h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-orange-500 hover:bg-orange-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="main-card p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-4">{editingScheduling ? 'Editar Agendamento' : 'Novo Agendamento'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select name="client_id" value={formData.client_id} onChange={(e) => setFormData({...formData, client_id: e.target.value})} className="p-2 border rounded-md bg-white">
              <option value="">Selecione o Cliente *</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select name="service_id" value={formData.service_id} onChange={(e) => setFormData({...formData, service_id: e.target.value})} className="p-2 border rounded-md bg-white">
              <option value="">Selecione o Serviço *</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" name="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="p-2 border rounded-md" required />
            <input type="time" name="time" value={formData.time} onChange={(e) => setFormData({...formData, time: e.target.value})} className="p-2 border rounded-md" required />
            <textarea name="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Observações" className="md:col-span-2 p-2 border rounded-md" rows="3"></textarea>
            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">{editingScheduling ? 'Atualizar' : 'Agendar'}</Button>
              <Button type="button" onClick={resetForm} variant="outline">Cancelar</Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="main-card p-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft /></Button>
          <h2 className="text-xl font-bold text-slate-800">{monthNames[month]} de {year}</h2>
          <Button variant="ghost" size="icon" onClick={() => changeMonth(1)}><ChevronRight /></Button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysOfWeek.map(day => <div key={day} className="text-center font-medium text-slate-500 text-sm py-2">{day}</div>)}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`} className="border border-slate-100" />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;
            return (
              <div key={day} className={`border border-slate-200 h-28 p-2 ${isToday ? 'bg-orange-50' : ''}`}>
                <div className={`font-semibold ${isToday ? 'text-orange-600' : 'text-slate-700'}`}>{day}</div>
                <div className="text-xs space-y-1 mt-1 overflow-y-auto max-h-20">
                  {schedulingsByDay[day]?.map(s => (
                    <div key={s.id} className="bg-orange-100 text-orange-800 p-1 rounded truncate" title={`${s.time} - ${s.clientName}`}>{s.time} - {s.clientName}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-bold text-slate-800 p-6">Próximos Agendamentos</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Cliente</th>
                <th className="p-3 text-left text-sm font-semibold">Serviço</th>
                <th className="p-3 text-left text-sm font-semibold">Data</th>
                <th className="p-3 text-left text-sm font-semibold">Hora</th>
                <th className="p-3 text-center text-sm font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {schedulings.sort((a, b) => new Date(a.date) - new Date(b.date)).map((s) => (
                <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-slate-200 hover:bg-slate-50">
                  <td className="p-3 text-slate-800 font-medium">{s.clientName}</td>
                  <td className="p-3 text-slate-600">{s.serviceName}</td>
                  <td className="p-3 text-slate-600">{new Date(s.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-3 text-slate-600">{s.time}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(s)} className="p-2 bg-slate-200 hover:bg-slate-300 rounded-md"><Edit className="w-4 h-4 text-slate-700" /></button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 bg-red-500 hover:bg-red-600 rounded-md"><Trash className="w-4 h-4 text-white" /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {schedulings.length === 0 && <div className="text-center py-12"><p className="text-slate-500">Nenhum agendamento encontrado.</p></div>}
        </div>
      </div>
    </div>
  );
};

export default Schedulings;