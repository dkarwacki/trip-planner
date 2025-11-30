import { MessageSquare, MapPin, Sparkles } from "lucide-react";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    title: "AI Planning",
    description: "Chat with AI to find the perfect starting point for your journey",
  },
  {
    icon: MapPin,
    title: "Interactive Map",
    description: "Explore attractions and restaurants near your chosen hub",
  },
  {
    icon: Sparkles,
    title: "Personalization",
    description: "Recommendations based on your unique traveler persona",
  },
];

export function FeatureGrid() {
  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="flex flex-col items-center text-center p-6 rounded-xl">
                <div className="w-16 h-16 mb-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
                  <Icon className="w-8 h-8" strokeWidth={2} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
