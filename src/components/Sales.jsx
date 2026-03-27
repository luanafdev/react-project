import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";
import { DollarSign, Calendar, Search, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [lastSale, setLastSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(""); // 🔥 NOVO ESTADO
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [currentSale, setCurrentSale] = useState(null);
  const { toast } = useToast();

  const formatCurrency = (value) =>
    `R$ ${Number(value || 0).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
    })}`;

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("pt-BR", { timeZone: "UTC" });

  // 🔥 FUNÇÃO COMPLETA COM FILTRO POR DATA
  const fetchSales = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("sales")
        .select(
          `
          *,
          clients ( name, document )
        `,
        )
        .order("date", { ascending: false });

      // 🔥 Se houver data selecionada, aplica filtro
      if (filterDate) {
        const start = `${filterDate} 00:00:00`;
        const end = `${filterDate} 23:59:59`;

        query = query.gte("date", start).lte("date", end);
      }

      const { data, error } = await query;

      if (error) throw error;

      setSales(data);
      if (data.length > 0) setLastSale(data[0]);
    } catch (error) {
      toast({
        title: "Erro ao buscar vendas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [filterDate]); // 🔥 Agora atualiza quando a data mudar

  const filteredSales = sales.filter(
    (sale) =>
      sale.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clients?.document
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      sale.vehicle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.plate?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEditClick = (sale) => {
    setCurrentSale({ ...sale });
    setShowEditDialog(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setCurrentSale((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    const { clients, ...saleToUpdate } = currentSale;
    const { error } = await supabase
      .from("sales")
      .update(saleToUpdate)
      .eq("id", currentSale.id);

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchSales();
      toast({
        title: "Sucesso!",
        description: "Venda atualizada com sucesso.",
      });
      setShowEditDialog(false);
    }
  };

  const handleDeleteSale = async (id) => {
    const { error } = await supabase.from("sales").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchSales();
      toast({
        title: "Sucesso!",
        description: "Venda removida com sucesso.",
      });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Histórico de Vendas</h1>

      {lastSale && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gradient-to-r from-orange-500 to-yellow-500 p-6 rounded-lg shadow-lg text-white"
        >
          <h2 className="text-lg font-semibold mb-2">Última Venda Realizada</h2>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">Valor</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(lastSale.total)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8" />
              <div>
                <p className="text-sm opacity-90">Data</p>
                <p className="text-2xl font-bold">
                  {formatDate(lastSale.date)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* 🔥 Campo de busca + filtro de data */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente, documento, veículo ou placa..."
            className="w-full p-3 pl-10 border rounded-md shadow-sm"
          />
        </div>

        {/* 🔥 Filtro por data */}
        <div>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="p-3 border rounded-md shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Cliente
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Veículo
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Placa
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Status
                </th>
                <th className="py-3 px-4 text-left text-sm font-semibold">
                  Data
                </th>
                <th className="py-3 px-4 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="py-3 px-4 text-center text-sm font-semibold">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    Carregando vendas...
                  </td>
                </tr>
              ) : filteredSales.length > 0 ? (
                filteredSales.map((sale) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    <td className="py-3 px-4 text-slate-800 font-medium">
                      {sale.clients?.name || "Cliente não encontrado"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{sale.vehicle}</td>
                    <td className="py-3 px-4 text-slate-600">{sale.plate}</td>
                    <td className="py-3 px-4 text-slate-600">{sale.status}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {formatDate(sale.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-800">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(sale)}
                        className="text-blue-500 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSale(sale.id)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500">
                    Nenhuma venda encontrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Venda</DialogTitle>
          </DialogHeader>
          {currentSale && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Cliente</Label>
                <Input
                  value={currentSale.clients?.name || "N/A"}
                  disabled
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Veículo</Label>
                <Input
                  name="vehicle"
                  value={currentSale.vehicle}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Placa</Label>
                <Input
                  name="plate"
                  value={currentSale.plate}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Total</Label>
                <Input
                  name="total"
                  type="number"
                  value={currentSale.total}
                  onChange={handleEditChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status</Label>
                <select
                  name="status"
                  value={currentSale.status}
                  onChange={handleEditChange}
                  className="col-span-3 w-full p-2 border rounded-md bg-white"
                >
                  <option value="Pago">Pago</option>
                  <option value="Não Pago">Não Pago</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              onClick={handleSaveEdit}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
