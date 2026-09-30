"use client"

import { MailPlusIcon } from "lucide-react"

import { HpxButton } from "@/components/ui/button"

import { useHpxInbox } from "./sidebar-shell"

export function HpxReceiveMessage() {
  const { receive } = useHpxInbox()
  return (
    <HpxButton variant="outline" size="sm" onClick={receive}>
      <MailPlusIcon />
      Receive a message
    </HpxButton>
  )
}
