import { useEffect, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string; make: string; model: string; year: number;
  title: string; body: string; rating: number; author: string;
  pros: string[] | null; cons: string[] | null; hero_image: string | null;
  created_at: string;
}

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("vehicle_reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      setReviews((data as Review[]) ?? []);
      setLoading(false);
    })();
  }, []);

  return (
    <Layout>
      <Seo title="Expert Vehicle Reviews — AurumMotors" description="In-depth expert reviews to help you choose the right vehicle." path="/reviews" />
      <div className="container py-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-2">Expert reviews</h1>
        <p className="text-muted-foreground mb-10">Honest takes from our editorial team.</p>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <Card className="p-12 text-center bg-card/40 border-border/60">
            <p className="text-muted-foreground">No reviews published yet — check back soon.</p>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <Card key={r.id} className="overflow-hidden bg-card/60 border-border/60 hover:border-primary/40 transition-smooth">
                {r.hero_image && (
                  <div className="aspect-[16/9] bg-secondary overflow-hidden">
                    <img src={r.hero_image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      {r.year} {r.make} {r.model}
                    </Badge>
                    <div className="flex items-center gap-1 text-primary">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-medium">{Number(r.rating).toFixed(1)}</span>
                    </div>
                  </div>
                  <h3 className="font-serif text-2xl mb-2">{r.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{r.body}</p>
                  {(r.pros && r.pros.length > 0) && (
                    <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                      <div>
                        <div className="text-primary font-medium mb-1">Pros</div>
                        <ul className="space-y-0.5 text-muted-foreground">{r.pros.slice(0, 3).map((p) => <li key={p}>+ {p}</li>)}</ul>
                      </div>
                      {r.cons && (
                        <div>
                          <div className="text-destructive font-medium mb-1">Cons</div>
                          <ul className="space-y-0.5 text-muted-foreground">{r.cons.slice(0, 3).map((c) => <li key={c}>- {c}</li>)}</ul>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">By {r.author}</div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reviews;
