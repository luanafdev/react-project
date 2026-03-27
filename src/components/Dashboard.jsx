import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Briefcase,
  AlertCircle,
  Wallet,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = ({ setActiveSection }) => {
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    monthlySalesCount: 0,
    accountsReceivableCount: 0,
    accountsReceivableValue: 0,
    activeClients: 0,
    activeServices: 0,
    payableCount: 0,
    payableValue: 0,
  });

  const [salesData, setSalesData] = useState([]);
  const [serviceDistribution, setServiceDistribution] = useState([]);
  const { toast } = useToast();

  const fetchDashboardData = async () => {
    try {
      const [
        { data: sales },
        { data: clients },
        { data: services },
        { data: accountsPayable },
      ] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("clients").select("*"),
        supabase.from("services").select("*"),
        supabase.from("accounts_payable").select("*"),
      ]);

      if (!sales || !clients || !services) {
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados.",
          variant: "destructive",
        });
        return;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      // Vendas do mês
      const monthlySales = sales.filter((sale) => {
        const d = new Date(sale.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      });

      const monthlyRevenue = monthlySales.reduce(
        (sum, sale) => sum + (sale.total || 0),
        0,
      );

      // Contas a receber
      const accountsReceivable = sales.filter((s) => s.status !== "Pago");
      const accountsReceivableValue = accountsReceivable.reduce(
        (sum, s) => sum + (s.total || 0),
        0,
      );

      // Clientes ativos = clientes que compraram no mês
      const clientsInMonth = new Set(monthlySales.map((s) => s.client_id));

      // Serviços ativos = serviços vendidos no mês
      const servicesInMonth = new Set(monthlySales.map((s) => s.service_id));

      // Contas a pagar
      const payable = accountsPayable || [];
      const payablePending = payable.filter((p) => p.status !== "Pago");
      const payableValue = payablePending.reduce(
        (sum, p) => sum + (p.value || 0),
        0,
      );

      setStats({
        monthlyRevenue,
        monthlySalesCount: monthlySales.length,
        accountsReceivableCount: accountsReceivable.length,
        accountsReceivableValue,
        activeClients: clientsInMonth.size,
        activeServices: servicesInMonth.size,
        payableCount: payablePending.length,
        payableValue,
      });

      // Gráfico: últimos 6 meses
      const last6Months = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);

        const monthName = date.toLocaleString("pt-BR", { month: "short" });

        const monthSales = sales.filter((sale) => {
          const d = new Date(sale.date);
          return (
            d.getMonth() === date.getMonth() &&
            d.getFullYear() === date.getFullYear()
          );
        });

        const total = monthSales.reduce(
          (sum, sale) => sum + (sale.total || 0),
          0,
        );

        last6Months.push({
          month: monthName,
          Vendas: total,
        });
      }

      setSalesData(last6Months);

      // Distribuição por serviço
      const serviceCount = {};
      sales.forEach((sale) => {
        const serviceName = sale.serviceName || "Outros";
        serviceCount[serviceName] = (serviceCount[serviceName] || 0) + 1;
      });

      const distribution = Object.keys(serviceCount).map((name) => ({
        name,
        value: serviceCount[name],
      }));

      setServiceDistribution(distribution);
    } catch (error) {
      toast({
        title: "Erro ao carregar dashboard",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    subLabel,
    color,
    onClick,
  }) => (
    <motion.div
      whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.1)" }}
      className="bg-white rounded-lg shadow-md p-5 flex items-center justify-between cursor-pointer"
      onClick={onClick}
    >
      <div>
        <p className="text-sm text-slate-500 font-medium uppercase">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        <div className="flex items-center text-xs text-slate-500 mt-2">
          <p>{subValue}</p>
          <p className="ml-2">{subLabel}</p>
        </div>
      </div>
      <div
        className={`w-14 h-14 rounded-full flex items-center justify-center ${color}`}
      >
        <Icon className="w-7 h-7 text-white" />
      </div>
    </motion.div>
  );

  const COLORS = ["#ff6b35", "#ff8c42", "#ffa600", "#ffbe0b", "#fb5607"];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>

      {/* Métricas */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={DollarSign}
          label="Faturamento Mensal"
          value={`R$ ${stats.monthlyRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          subValue={`${stats.monthlySalesCount} vendas`}
          subLabel="no mês"
          color="bg-orange-500"
          onClick={() => setActiveSection("reports")}
        />

        <StatCard
          icon={AlertCircle}
          label="Contas a Receber"
          value={stats.accountsReceivableCount}
          subValue="Em aberto"
          subLabel={`R$ ${stats.accountsReceivableValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="bg-red-500"
          onClick={() => setActiveSection("receivable")}
        />

        <StatCard
          icon={Users}
          label="Clientes Ativos"
          value={stats.activeClients}
          subValue="No mês"
          subLabel="Compraram"
          color="bg-green-500"
          onClick={() => setActiveSection("clients")}
        />

        <StatCard
          icon={Briefcase}
          label="Serviços Ativos"
          value={stats.activeServices}
          subValue="Vendidos no mês"
          subLabel="Ativos"
          color="bg-cyan-500"
          onClick={() => setActiveSection("services")}
        />

        <StatCard
          icon={Wallet}
          label="Contas a Pagar"
          value={stats.payableCount}
          subValue="Em aberto"
          subLabel={`R$ ${stats.payableValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          color="bg-purple-500"
          onClick={() => setActiveSection("payable")}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div className="lg:col-span-2 main-card p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            Vendas Mensais
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                formatter={(v) =>
                  `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="Vendas"
                stroke="#ff6b35"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="main-card p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4">
            Distribuição por Serviço
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {serviceDistribution.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value} vendas`, name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
