import { ReactNode } from "react";

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="dark w-full bg-background text-foreground">
      {children}
    </div>
  );
};

export default AdminLayout;
