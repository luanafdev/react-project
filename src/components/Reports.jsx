import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Filter, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useToast } from "@/components/ui/use-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "@/lib/supabaseClient";

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [filters, setFilters] = useState({
    dateFrom: "",
    dateTo: "",
    client: "",
    service: "",
    status: "",
  });
  const { toast } = useToast();

  // Buscar vendas do Supabase
  useEffect(() => {
    const fetchSales = async () => {
      const { data, error } = await supabase
        .from("sales")
        .select(
          `
          id,
          date,
          total,
          status,
          payment_method,
          notes,
          vehicle,
          plate,
          clients (
            name,
            document
          ),
          services (
            name
          )
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
        setSales(data || []);
      }
    };

    fetchSales();
  }, [toast]);

  // Filtro aplicado
  const filteredSales = sales.filter((sale) => {
    const clientName = sale.clients?.name?.toLowerCase() || "";
    const serviceName = sale.services?.name?.toLowerCase() || "";
    const status = sale.status || "";

    return (
      (filters.dateFrom ? sale.date >= filters.dateFrom : true) &&
      (filters.dateTo ? sale.date <= filters.dateTo : true) &&
      (filters.client
        ? clientName.includes(filters.client.toLowerCase())
        : true) &&
      (filters.service
        ? serviceName.includes(filters.service.toLowerCase())
        : true) &&
      (filters.status ? status === filters.status : true)
    );
  });

  // Cálculos
  const totalSales = filteredSales.length;
  const totalValue = filteredSales.reduce(
    (sum, sale) => sum + (sale.total || 0),
    0,
  );
  const totalReceived = filteredSales
    .filter((s) => s.status === "Pago")
    .reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalPending = totalValue - totalReceived;
  const averageTicket = totalSales > 0 ? totalValue / totalSales : 0;

  const formatCurrency = (value) =>
    `R$ ${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  // Exportar Excel
  const exportToExcel = () => {
    try {
      const exportData = filteredSales.map((sale) => ({
        Data: new Date(sale.date).toLocaleDateString("pt-BR"),
        Cliente: sale.clients?.name || "",
        Documento: sale.clients?.document || "",
        Serviço: sale.services?.name || "",
        Valor: sale.total || 0,
        Status: sale.status,
        "Forma de Pagamento": sale.payment_method || "Não informado",
        Observações: sale.notes || "",
      }));

      const summaryData = [
        {},
        {
          Data: "RESUMO",
          Cliente: "",
          Serviço: "",
          Valor: "",
          Status: "",
          "Forma de Pagamento": "",
          Observações: "",
        },
        { Data: "Total de Vendas", Cliente: totalSales },
        { Data: "Valor Total", Cliente: formatCurrency(totalValue) },
        { Data: "Total Recebido", Cliente: formatCurrency(totalReceived) },
        { Data: "Pendente", Cliente: formatCurrency(totalPending) },
        { Data: "Ticket Médio", Cliente: formatCurrency(averageTicket) },
      ];

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet([...exportData, ...summaryData]);
      XLSX.utils.book_append_sheet(wb, ws, "Relatório de Vendas");
      const fileName = `relatorio_vendas_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "✅ Excel Exportado!",
        description: `Relatório salvo como ${fileName}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erro na Exportação",
        description: "Não foi possível exportar para Excel",
      });
    }
  };

  // Exportar PDF
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text("Relatório de Vendas - Flex Vistorias", 14, 15);
      doc.setFontSize(10);
      doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

      const summaryData = [
        ["Total de Vendas:", totalSales.toString()],
        ["Total Recebido:", formatCurrency(totalReceived)],
      ];

      doc.autoTable({
        startY: 35,
        head: [["Item", "Valor"]],
        body: summaryData,
        theme: "grid",
        headStyles: { fillColor: [255, 107, 53] },
        styles: { fontSize: 10 },
      });

      const tableData = filteredSales.map((sale) => [
        new Date(sale.date).toLocaleDateString("pt-BR"),
        sale.clients?.name || "",
        sale.clients?.document || "",
        sale.services?.name || "",
        formatCurrency(sale.total),
        sale.status,
      ]);

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [["Data", "Cliente", "Documento", "Serviço", "Valor", "Status"]],
        body: tableData,
        theme: "grid",
        styles: { fontSize: 8 },
      });

      const fileName = `relatorio_vendas_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "✅ PDF Exportado!",
        description: `Relatório salvo como ${fileName}`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "❌ Erro na Exportação",
        description: "Não foi possível exportar para PDF",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800">Relatórios</h1>
        <div className="flex gap-2">
          <Button onClick={exportToPDF} variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Exportar em PDF
          </Button>
          <Button
            onClick={exportToExcel}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar para Excel
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="main-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">Filtros</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) =>
              setFilters({ ...filters, dateFrom: e.target.value })
            }
            className="p-2 border rounded-md"
          />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            className="p-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Cliente"
            value={filters.client}
            onChange={(e) => setFilters({ ...filters, client: e.target.value })}
            className="p-2 border rounded-md"
          />
          <input
            type="text"
            placeholder="Serviço"
            value={filters.service}
            onChange={(e) =>
              setFilters({ ...filters, service: e.target.value })
            }
            className="p-2 border rounded-md"
          />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="p-2 border rounded-md bg-white"
          >
            <option value="">Todos os Status</option>
            <option value="Pago">Pago</option>
            <option value="Pendente">Pendente</option>
            <option value="Não Pago">Não Pago</option>
          </select>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-center">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-slate-500">Total de Vendas</p>
          <p className="text-2xl font-bold text-slate-800">{totalSales}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-sm text-slate-500">Total Recebido</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalReceived)}
          </p>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <p className="text-sm text-slate-500">Pendente</p>
        <p className="text-2xl font-bold text-orange-600">
          {formatCurrency(totalPending)}
        </p>
      </div>
      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 p-6">
          Tabela de Vendas Filtradas
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#1a1a1a] text-white">
              <tr>
                <th className="p-3 text-left text-sm font-semibold">Data</th>
                <th className="p-3 text-left text-sm font-semibold">Cliente</th>
                <th className="p-3 text-left text-sm font-semibold">Serviço</th>
                <th className="p-3 text-left text-sm font-semibold">Veículo</th>
                <th className="p-3 text-left text-sm font-semibold">Placa</th>
                <th className="p-3 text-left text-sm font-semibold">Valor</th>
                <th className="p-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="border-b border-slate-200 hover:bg-slate-50"
                >
                  <td className="p-3 text-slate-600">
                    {new Date(sale.date).toLocaleDateString("pt-BR")}
                  </td>

                  <td className="p-3 text-slate-800 font-medium">
                    {sale.clients?.name || "—"}
                  </td>

                  <td className="p-3 text-slate-600">
                    {sale.services?.name || "—"}
                  </td>

                  <td className="p-3 text-slate-600">{sale.vehicle || "—"}</td>

                  <td className="p-3 text-slate-600">{sale.plate || "—"}</td>

                  <td className="p-3 text-slate-800 font-medium">
                    {formatCurrency(sale.total)}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        sale.status === "Pago"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-500">
                Nenhuma venda encontrada com os filtros aplicados.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
