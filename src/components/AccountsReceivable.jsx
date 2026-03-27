import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { DollarSign, Search, Calendar, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

const AccountsReceivable = () => {
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { toast } = useToast();

  const fetchSales = useCallback(async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        clients ( name, document ),
        services ( name )
      `,
      )
      .order("date", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao buscar vendas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const formattedData = data
        .map((sale) => ({
          ...sale,
          clientName: sale.clients?.name || "Cliente removido",
          clientDocument: sale.clients?.document || "—",
          serviceName: sale.services?.name || "Serviço removido",
        }))
        .filter(
          (sale) => sale.status !== "Pago", // <-- Filtra para mostrar apenas Não Pago e Pendentes
        );

      setSales(formattedData);
    }
  }, [toast]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const formatCurrency = (value) =>
    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // FILTROS: busca + datas
  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const matchesSearch =
          (sale.clientName?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          ) ||
          (sale.clientDocument?.toLowerCase() || "").includes(
            searchTerm.toLowerCase(),
          );

        const saleDate = new Date(sale.date);

        const matchesStartDate = startDate
          ? saleDate >= new Date(startDate)
          : true;
        const matchesEndDate = endDate ? saleDate <= new Date(endDate) : true;

        return matchesSearch && matchesStartDate && matchesEndDate;
      }),
    [sales, searchTerm, startDate, endDate],
  );

  const handleMarkAsPaid = async (id) => {
    const { error } = await supabase
      .from("sales")
      .update({ status: "Pago" })
      .eq("id", id);
    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      fetchSales();
      toast({ title: "Sucesso!", description: "Venda marcada como Paga." });
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
        <DollarSign className="w-8 h-8 text-orange-500" /> Contas a Receber
      </h1>

      <div className="main-card p-6">
        {/* FILTROS */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
          {/* Buscar por Cliente */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nome do cliente ou documento..."
              className="w-full p-2 pl-10 border rounded-md"
            />
          </div>

          {/* Data Inicial */}
          <label className="text-slate-600 mr-2">De:</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 pl-10 border rounded-md"
            />
          </div>

          {/* Data Final */}
          <label className="text-slate-600 mr-2">Até:</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 pl-10 border rounded-md"
            />
          </div>
        </div>

        {/* TABELA */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#1a1a1a] text-white">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Documento
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Serviço
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Veículo
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Placa
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredSales.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="text-center py-12 text-slate-500"
                    >
                      Nenhuma venda encontrada.
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <motion.tr
                      key={sale.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-slate-200 hover:bg-slate-50"
                    >
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {sale.clientName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.clientDocument}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.serviceName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.vehicle}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{sale.plate}</td>

                      <td className="py-3 px-4 text-slate-800 font-bold">
                        {formatCurrency(sale.total)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full
                            ${
                              sale.status === "Pendente"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {sale.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(sale.id)}
                          className="text-green-600 hover:bg-green-100"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" /> Pagar
                        </Button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountsReceivable;
