'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserStore, useUserStore } from '@/store/user-store';
import { LayoutDashboardIcon, MapPinIcon, PackageIcon, ShoppingBagIcon, ShoppingCartIcon, TagsIcon, UserIcon, UsersIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const MenuItems = ({ onNavigate }: { onNavigate?: () => void }) => {   
    const pathname = usePathname();
    const user = useUserStore((state: UserStore) => state.user);
    const userMenuItems = [
        {
            label: "Dashboard",
            href: "/user/dashboard",
            icon: <LayoutDashboardIcon className="size-4" />
        },
        {
            label:"Products",
            href: "/user/products",
            icon: <PackageIcon className="size-4" />
        },
        {
            label: "Cart",
            href: "/user/cart",
            icon: <ShoppingCartIcon className="size-4" />
        },
        {
            label: "Address",
            href: "/user/address",
            icon: <MapPinIcon className="size-4" />
        },
        {
            label: "My Orders",
            href: "/user/orders",
            icon: <ShoppingBagIcon className="size-4" />
        },
        {
            label: "My Profile",
            href: "/user/profile",
            icon: <UserIcon className="size-4" />
        }
        
        
    ]
    const adminMenuItems = [
        {
            label: "Dashboard",
            href: "/admin/dashboard",
            icon: <LayoutDashboardIcon className="size-4" />
        },
        {
            label: "Users",
            href: "/users",
            icon: <UsersIcon className="size-4" />
        },
        {
            label: "Orders",
            href: "/orders",
            icon: <ShoppingBagIcon className="size-4" />
        },
        {
            label: "Products",
            href: "/products",
            icon: <PackageIcon className="size-4" />
        },
        {
            label : "Categories",
            href: "/categories",
            icon: <TagsIcon className="size-4" />
        }
    ]
    const menuItems = user?.role === "admin" ? adminMenuItems : userMenuItems;
  return (
    <nav className="flex flex-col gap-1 px-2">
        {menuItems.map((item) => (
            <Link
              href={item.href}
              key={item.label}
              onClick={onNavigate}
              className={cn(
                "cursor-pointer rounded-md px-3 py-5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`) ||
                (item.href === "/admin/dashboard" && pathname === "/dashboard") ||
                (item.href === "/users" && pathname === "/admin/users")
                  ? "bg-accent text-accent-foreground"
                  : "text-foreground"
              )}
            >
                <div className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                </div>
            </Link>
        ))}
    </nav>
  );
}

export default MenuItems
