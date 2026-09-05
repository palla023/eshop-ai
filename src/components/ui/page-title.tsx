import React from 'react'

const PageTitle = ({ title }: { title: string }) => {
  return (
    <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold! text-primary">{title}</h1>
    </div>
  )
}

export default PageTitle