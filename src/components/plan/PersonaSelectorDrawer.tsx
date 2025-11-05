import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { User } from "lucide-react";
import PersonaSelector from "./PersonaSelector";
import type { PersonaType } from "@/domain/plan/models";

interface PersonaSelectorDrawerProps {
  selected: PersonaType[];
  onChange: (personas: PersonaType[]) => void;
}

export default function PersonaSelectorDrawer({ selected, onChange }: PersonaSelectorDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          size="icon"
          variant="default"
          className="fixed bottom-20 right-4 z-30 h-12 w-12 rounded-full shadow-lg sm:hidden"
          aria-label="Select travel style"
        >
          <User className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[60vh]">
        <DrawerHeader className="pb-3">
          <DrawerTitle>Travel Style</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
          <PersonaSelector selected={selected} onChange={onChange} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}





