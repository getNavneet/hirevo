import { Button } from "@/components/ui/button"; 
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const Pricing = () => (
  <section className="py-20 bg-gray-100">
    <h2 className="text-3xl font-bold text-center mb-12">Pricing</h2>
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6">
      <Card className="p-6 rounded-2xl shadow-lg">
        <CardContent>
          <h3 className="text-xl font-semibold mb-4">Free Plan</h3>
          <p className="mb-4 text-gray-600">Perfect to get started.</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> 5 mock interviews
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Basic feedback
            </li>
          </ul>
          <Button className="mt-6 w-full">Start Free</Button>
        </CardContent>
      </Card>

      <Card className="p-6 rounded-2xl shadow-lg border-indigo-600 border-2">
        <CardContent>
          <h3 className="text-xl font-semibold mb-4">Pro Plan</h3>
          <p className="mb-4 text-gray-600">₹99 / $5 monthly</p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Unlimited interviews
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Advanced feedback
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="text-green-500 w-5 h-5" /> Resume-tailored questions
            </li>
          </ul>
          <Button className="mt-6 w-full bg-indigo-600 text-white">Upgrade</Button>
        </CardContent>
      </Card>
    </div>
  </section>
);

export default Pricing;