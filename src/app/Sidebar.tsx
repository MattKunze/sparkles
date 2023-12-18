import DocumentList from "@/components/organisms/DocumentList";

export default function Sidebar() {
  return (
    <>
      <input
        type="text"
        placeholder="Search"
        className="input input-ghost w-full"
      />
      <DocumentList />
    </>
  );
}
