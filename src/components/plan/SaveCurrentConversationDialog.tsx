import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SaveCurrentConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndProceed: () => void;
  onDiscardAndProceed: () => void;
}

export function SaveCurrentConversationDialog({
  open,
  onOpenChange,
  onSaveAndProceed,
  onDiscardAndProceed,
}: SaveCurrentConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save Current Conversation?</DialogTitle>
          <DialogDescription>
            You have an active conversation. Would you like to save it before proceeding?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDiscardAndProceed();
              onOpenChange(false);
            }}
          >
            Discard
          </Button>
          <Button
            onClick={() => {
              onSaveAndProceed();
              onOpenChange(false);
            }}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}









