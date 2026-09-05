'use client'

import Link from 'next/link';
import { UserStore, useUserStore } from '@/store/user-store';
import { LayoutDashboardIcon, PackageIcon, ShoppingBagIcon, TagsIcon, UsersIcon } from 'lucide-react'

const MenuItems = ({ onNavigate }: { onNavigate?: () => void }) => {   
    const user = useUserStore((state: UserStore) => state.user);
    const userMenuItems = [
        {
            label:"Products",
            href: "/user/products",
            icon: <PackageIcon className="size-4" />
        },
        {
            label: "My Orders",
            href: "/user/orders",
            icon: <ShoppingBagIcon className="size-4" />
        },
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboardIcon className="size-4" />
        }
        
        
    ]
    const adminMenuItems = [
        {
            label: "Dashboard",
            href: "/dashboard",
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
              className="cursor-pointer rounded-md px-3 py-5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
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
