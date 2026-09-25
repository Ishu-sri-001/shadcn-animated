import { Separator } from "@/components/ui/separator"

import { NotesDemo } from "./notes-demo"
import { UploadDemo } from "./upload-demo"

export default function AttachmentPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-[2.4vw] font-semibold">Attachment</h1>
        <p className="text-sm text-muted-foreground">
          File chips that show upload progress, errors and previews.
        </p>
      </div>

      <UploadDemo />

      <Separator className='my-10 bg-black/30' />

      <NotesDemo />
    </div>
  )
}
