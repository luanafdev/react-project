import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, PlusCircle, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";

/* ==========================
   COMPONENTE DE RESUMO
   Recebe:
   - serviceValue: preço original do serviço (base)
   - finalValue: valor que o usuário editou (valor final a pagar)
   - discount: calculado (base - final)
========================== */
const SaleCalculator = ({ serviceValue = 0, finalValue = 0, discount = 0 }) => {
  const serviceNum = parseFloat(serviceValue) || 0;
  const finalNum = parseFloat(finalValue) || 0;
  const discountNum = parseFloat(discount) || 0;

  // VALOR FINAL = finalValue (o usuário já editou para o valor a pagar)
  const total = useMemo(() => finalNum, [finalNum]);

  const formatCurrency = (v) =>
    `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 space-y-4">
      <h3 className="text-lg font-semibold text-slate-800 flex items-center">
        <Calculator className="w-5 h-5 mr-2 text-orange-500" />
        Resumo do Cálculo
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600">Valor do Serviço</span>
          <span className="font-medium text-slate-800">
            {formatCurrency(serviceNum)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-600">Desconto (-)</span>
          <span className="font-medium text-red-600">
            {formatCurrency(discountNum)}
          </span>
        </div>

        <div className="border-t border-slate-200 my-2"></div>

        <div className="flex justify-between text-lg">
          <span className="font-bold text-slate-900">VALOR FINAL</span>
          <span className="font-bold text-orange-600">
            {formatCurrency(total)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ==========================
      FORMULÁRIO
========================== */
const SaleForm = ({ onFinish }) => {
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [baseValue, setBaseValue] = useState(0); // valor original do serviço

  const [formData, setFormData] = useState({
    client_id: "",
    service_id: "",
    vehicle: "",
    plate: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "Dinheiro",
    status: "Não Pago",
    taxes: 0, // VALOR FINAL QUE O USUÁRIO EDITA
    discount: 0, // calculado automaticamente
    notes: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: clientsData } = await supabase
        .from("clients")
        .select("id, name");
      setClients(clientsData || []);

      const { data: servicesData } = await supabase
        .from("services")
        .select("id, name, price");
      setServices(servicesData || []);
    };
    fetchData();
  }, []);

  /* SERVIÇO SELECIONADO */
  const selectedService = services.find(
    (s) => String(s.id) === String(formData.service_id),
  );

  useEffect(() => {
    if (selectedService) {
      setBaseValue(Number(selectedService.price) || 0);

      setFormData((prev) => ({
        ...prev,
        taxes: selectedService.price, // preenche com o preço do serviço
        discount: 0,
      }));
    }
  }, [selectedService]);

  /* CALCULAR DESCONTO AUTOMÁTICO:
     desconto = baseValue - userValue (mínimo 0)
  */
  useEffect(() => {
    const userValue = parseFloat(formData.taxes) || 0;

    if (baseValue > 0) {
      const calcDiscount = Math.max(baseValue - userValue, 0);

      // Atualiza somente o campo discount (evitando loop modificando taxes)
      setFormData((prev) => {
        // evita re-render infinito se o desconto já estiver correto
        if (Number(prev.discount) === calcDiscount) return prev;
        return { ...prev, discount: calcDiscount };
      });
    } else {
      // sem base (serviço não selecionado), zera desconto
      setFormData((prev) => ({ ...prev, discount: 0 }));
    }
  }, [formData.taxes, baseValue]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // garantir que taxes seja um número válido (string no input é ok)
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.client_id ||
      !formData.service_id ||
      !formData.vehicle ||
      !formData.plate
    ) {
      toast({
        title: "Erro",
        description: "Cliente, serviço, veículo e placa são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    // total deve ser o valor final (o que o usuário editou)
    const total = parseFloat(formData.taxes || 0);

    const dataToSave = {
      ...formData,
      taxes: parseFloat(formData.taxes || 0),
      discount: parseFloat(formData.discount || 0),
      total,
    };

    const { data, error } = await supabase
      .from("sales")
      .insert([dataToSave])
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao registrar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const client = clients.find((c) => c.id === data.client_id);
      onFinish({ ...data, clientName: client ? client.name : "N/A" });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CLIENTE */}
          <div>
            <Label htmlFor="client_id">Cliente *</Label>
            <select
              id="client_id"
              name="client_id"
              value={formData.client_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Selecione um cliente</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* SERVIÇO */}
          <div>
            <Label htmlFor="service_id">Serviço *</Label>
            <select
              id="service_id"
              name="service_id"
              value={formData.service_id}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="">Selecione um serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* VEICULO */}
          <div>
            <Label htmlFor="vehicle">Veículo *</Label>
            <Input
              id="vehicle"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleInputChange}
              placeholder="Ex: Fiat Uno"
            />
          </div>

          {/* PLACA */}
          <div>
            <Label htmlFor="plate">Placa *</Label>
            <Input
              id="plate"
              name="plate"
              value={formData.plate}
              onChange={handleInputChange}
              placeholder="ABC-1234"
            />
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label htmlFor="payment_method">Forma de Pagamento</Label>
            <select
              id="payment_method"
              name="payment_method"
              value={formData.payment_method}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option>Dinheiro</option>
              <option>Cartão de Crédito</option>
              <option>Cartão de Débito</option>
              <option>PIX</option>
              <option>Boleto</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md bg-white"
            >
              <option value="Não Pago">Não Pago</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="notes">Observações</Label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md"
            rows="4"
          />
        </div>
      </div>

      {/* COLUNA DIREITA */}
      <div className="space-y-6">
        <div>
          <Label htmlFor="taxes">Valor Final (R$)</Label>
          <Input
            id="taxes"
            name="taxes"
            type="number"
            step="0.01"
            value={formData.taxes}
            onChange={handleInputChange}
          />
        </div>

        {/* Passamos serviceValue (base), finalValue (taxes) e discount */}
        <SaleCalculator
          serviceValue={baseValue}
          finalValue={formData.taxes}
          discount={formData.discount}
        />

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white text-base py-3"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Finalizar Venda
        </Button>
      </div>
    </form>
  );
};

/* ==========================
        PÁGINA FINAL
========================== */
const NewSale = () => {
  const [view, setView] = useState("form");
  const [lastData, setLastData] = useState(null);
  const { toast } = useToast();

  const handleFinish = (data) => {
    setLastData(data);
    setView("summary");
    toast({ title: "Sucesso!", description: "Venda registrada com sucesso." });
  };

  const resetForm = () => {
    setView("form");
    setLastData(null);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">
        {view === "summary" ? "Registro Concluído" : "Nova Venda"}
      </h1>

      {view === "summary" && lastData ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-lg shadow-md text-center"
        >
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">
            Venda Registrada!
          </h2>
          <p className="text-slate-600 mt-2">
            Venda registrada para{" "}
            <span className="font-bold">{lastData.clientName}</span> no valor de
            <span className="font-bold">
              {" "}
              R${" "}
              {lastData.total.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}
            </span>
            .
          </p>

          <Button
            onClick={resetForm}
            className="mt-8 bg-orange-500 hover:bg-orange-600 text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Registrar Nova Venda
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <SaleForm onFinish={handleFinish} />
        </motion.div>
      )}
    </div>
  );
};

export default NewSale;
