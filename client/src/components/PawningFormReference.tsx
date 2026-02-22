import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Info } from "lucide-react";
import sampleImage from "@/../../assests/Image.jpeg";

export function PawningFormReference() {
  const [showReference, setShowReference] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowReference(true)}
        className="text-muted-foreground"
      >
        <Info className="h-4 w-4 mr-2" />
        View Form Reference
      </Button>

      <Dialog open={showReference} onOpenChange={setShowReference}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Pawning Form Reference</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto">
            <img
              src={sampleImage}
              alt="Pawning form reference"
              className="w-full h-auto rounded-lg border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

