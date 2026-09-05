'use client'
import React from 'react'
import { usePathname } from 'next/navigation'
import PrivateLayout from './private-layout'

const CustomLayout = ({children}: {children: React.ReactNode}) => {
  const pathname = usePathname()
  const isPubllicRoute = ["/", "/login", "/register"].includes(pathname)
  if(isPubllicRoute) {
    return children
  }
  return <PrivateLayout>{children}</PrivateLayout>
}

export default CustomLayout