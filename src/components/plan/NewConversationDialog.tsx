import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface NewConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveAndStartNew: () => void;
  onDiscardAndStartNew: () => void;
}

export function NewConversationDialog({
  open,
  onOpenChange,
  onSaveAndStartNew,
  onDiscardAndStartNew,
}: NewConversationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start New Conversation?</DialogTitle>
          <DialogDescription>
            You have an active conversation. Would you like to save it before starting a new one?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onDiscardAndStartNew();
              onOpenChange(false);
            }}
          >
            Discard & Start New
          </Button>
          <Button
            onClick={() => {
              onSaveAndStartNew();
              onOpenChange(false);
            }}
          >
            Save & Start New
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
