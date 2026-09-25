"use client"

import { MailPlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

import { useInbox } from "./sidebar-shell"

/** Adds an unread message, so the Inbox badge in the sidebar rolls to its new count. */
export function ReceiveMessage() {
  const { receive } = useInbox()
  return (
    <Button variant="outline" size="sm" onClick={receive}>
      <MailPlusIcon />
      Receive a message
    </Button>
  )
}
