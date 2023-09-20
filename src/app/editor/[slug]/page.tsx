import { NotebookEditor } from "@/components/organisms/NotebookEditor";
import { getNotebookDocument } from "@/db";

export default async function Page({ params }: { params: { slug: string } }) {
  const document = await getNotebookDocument(params.slug);
  return (
    <div className="container mx-auto">
      <NotebookEditor document={document} />
    </div>
  );
}
