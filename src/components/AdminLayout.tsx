import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="dark -mx-4 sm:-mx-6 lg:-mx-8 min-h-[calc(100dvh-5rem)] bg-background text-foreground">
      <div className="mx-4 sm:mx-6 lg:mx-8">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
