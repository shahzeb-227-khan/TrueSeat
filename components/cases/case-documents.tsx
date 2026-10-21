import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DOC_TYPE_LABELS } from "@/lib/cases/labels";
import type { CaseDocument } from "@/lib/schemas";

export function CaseDocuments({ documents }: { documents: CaseDocument[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Uploaded letters</CardTitle>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No letters uploaded yet.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {documents.map((d) => (
              <li key={d.id} className="flex flex-wrap justify-between gap-2 border-b pb-2 last:border-0">
                <span className="font-medium">{d.originalName}</span>
                <span className="text-muted-foreground">
                  {DOC_TYPE_LABELS[d.docType]} · {Math.round(d.sizeBytes / 1024)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
