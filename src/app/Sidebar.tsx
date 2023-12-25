import DocumentList from "@/components/organisms/DocumentList";
import UserLinks from "@/components/organisms/UserLinks";

export default function Sidebar() {
  return (
    <div className="flex flex-col h-full">
      <DocumentList />
      <UserLinks />
    </div>
  );
}
