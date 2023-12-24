import DocumentList from "@/components/organisms/DocumentList";
import UserLinks from "@/components/organisms/UserLinks";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <input
        type="text"
        placeholder="Search"
        className="input input-ghost w-full shrink-0"
      />
      <DocumentList />
      <UserLinks />
    </div>
  );
}
