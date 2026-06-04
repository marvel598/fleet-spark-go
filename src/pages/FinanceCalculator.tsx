import { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calculator } from "lucide-react";
import { calcMonthlyPayment, formatKES } from "@/lib/finance";

const FinanceCalculator = () => {
  const [price, setPrice] = useState(2500000);
  const [down, setDown] = useState(500000);
  const [tradeIn, setTradeIn] = useState(0);
  const [apr, setApr] = useState(13);
  const [term, setTerm] = useState(48);

  const result = useMemo(() => calcMonthlyPayment(price, down, tradeIn, apr, term), [price, down, tradeIn, apr, term]);

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );

  return (
    <Layout>
      <Seo title="Car Finance Calculator — AurumMotors" description="Estimate monthly car payments, total interest and full loan cost in seconds." path="/finance/calculator" />
      <div className="container max-w-5xl py-12">
        <div className="flex items-center gap-3 mb-2 text-primary"><Calculator className="w-5 h-5" /><span className="text-xs uppercase tracking-widest">Finance</span></div>
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Finance calculator</h1>
        <p className="text-muted-foreground mb-10">Adjust the inputs to see your estimated monthly payment.</p>

        <div className="grid lg:grid-cols-[1fr,360px] gap-8">
          <Card className="p-6 space-y-6 bg-card/60 border-border/60">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Vehicle price (KSh)</Label>
              <Input className="mt-2 text-lg" type="number" value={price} onChange={(e) => setPrice(Math.max(0, +e.target.value))} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Down payment (KSh)</Label>
              <Input className="mt-2 text-lg" type="number" value={down} onChange={(e) => setDown(Math.max(0, +e.target.value))} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Trade-in value (KSh)</Label>
              <Input className="mt-2 text-lg" type="number" value={tradeIn} onChange={(e) => setTradeIn(Math.max(0, +e.target.value))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Interest rate (APR)</Label>
                <span className="text-sm font-medium">{apr.toFixed(1)}%</span>
              </div>
              <Slider value={[apr]} onValueChange={(v) => setApr(v[0])} min={0} max={30} step={0.1} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Term (months)</Label>
                <span className="text-sm font-medium">{term} months</span>
              </div>
              <Slider value={[term]} onValueChange={(v) => setTerm(v[0])} min={12} max={84} step={6} />
            </div>
          </Card>

          <Card className="p-6 bg-gradient-gold-soft border-primary/30 h-fit sticky top-20">
            <div className="text-xs uppercase tracking-widest text-primary mb-2">Estimated monthly</div>
            <div className="font-serif text-5xl text-primary mb-4">{formatKES(result.monthly)}</div>
            <Row label="Loan amount" value={formatKES(result.principal)} />
            <Row label="Total interest" value={formatKES(result.totalInterest)} />
            <Row label="Total cost of loan" value={formatKES(result.totalCost)} />
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Estimates only. Actual rates and terms depend on lender approval, credit history and the specific vehicle.
            </p>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default FinanceCalculator;
