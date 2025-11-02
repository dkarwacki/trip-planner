import { Badge } from "@/components/ui/badge";
import { getAllPersonas, type PersonaType } from "@/domain/models";
import { Compass, MapPin, Palette, TreePine } from "lucide-react";

interface PersonaSelectorProps {
  selected: PersonaType[];
  onChange: (personas: PersonaType[]) => void;
}

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case "map-pin":
      return MapPin;
    case "tree-pine":
      return TreePine;
    case "compass":
      return Compass;
    case "palette":
      return Palette;
    default:
      return MapPin;
  }
};

export default function PersonaSelector({ selected, onChange }: PersonaSelectorProps) {
  const personas = getAllPersonas();

  const togglePersona = (persona: PersonaType) => {
    const isSelected = selected.includes(persona);

    if (isSelected) {
      // Remove persona
      const newSelection = selected.filter((p) => p !== persona);
      // Ensure at least one is selected (default to general tourist)
      onChange(newSelection.length > 0 ? newSelection : personas.slice(0, 1).map((p) => p.type));
    } else {
      // Add persona
      onChange([...selected, persona]);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">Travel Style</h3>
      <div className="flex flex-wrap gap-2">
        {personas.map((persona) => {
          const isSelected = selected.includes(persona.type);
          const Icon = getIconComponent(persona.icon);

          return (
            <Badge
              key={persona.type}
              variant={isSelected ? "default" : "outline"}
              className="cursor-pointer px-3 py-2 transition-all hover:scale-105"
              onClick={() => togglePersona(persona.type)}
            >
              <Icon className="mr-1.5 h-3.5 w-3.5" />
              {persona.label}
            </Badge>
          );
        })}
      </div>
    </div>
  );
}
