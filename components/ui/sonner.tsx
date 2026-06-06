"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-500" />
        ),
        info: (
          <InfoIcon className="size-4 text-sky-500" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-500" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-orange-500" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-sky-500" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#090d1f",
          "--normal-border": "#f1f5f9",
          "--border-radius": "16px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-white group-[.toaster]:text-slate-900 group-[.toaster]:border-slate-100 group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl p-4 font-sans border border-slate-100/50 backdrop-blur-md",
          title: "group-[.toast]:text-slate-900 group-[.toast]:font-bold group-[.toast]:text-sm",
          description: "group-[.toast]:text-slate-500 group-[.toast]:text-xs",
          actionButton: "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-slate-100 group-[.toast]:text-slate-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
