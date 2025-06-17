import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Bell, 
  FileSpreadsheet, 
  LogOut,
  UserX
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Empleados", href: "/employees", icon: Users },
  { name: "Baja Empresa", href: "/company-leaves", icon: UserX },
  { name: "Notificaciones", href: "/notifications", icon: Bell, superAdminOnly: true },
  { name: "Carga Masiva", href: "/bulk-upload", icon: FileSpreadsheet, superAdminOnly: true },
];

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();

  const canAccess = (item: any) => {
    if (item.superAdminOnly) {
      return user?.role === "super_admin";
    }
    return true;
  };

  const sidebarContent = (
    <div className="flex-1 flex flex-col min-h-0 pt-16">
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          if (!canAccess(item)) return null;
          
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "sidebar-link",
                  isActive && "active"
                )}
                onClick={onMobileClose}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
                {item.name === "Notificaciones" && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                )}
              </div>
            </Link>
          );
        })}
        
        <div className="mt-8 pt-4 border-t border-gray-200">
          <a
            href="/api/logout"
            className="sidebar-link text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-5 h-5 mr-3" />
            <span>Cerrar Sesión</span>
          </a>
        </div>
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:bg-white lg:border-r lg:border-gray-200 z-30">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
          
          {/* Sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-50 lg:hidden transform transition-transform duration-200 ease-in-out">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}
