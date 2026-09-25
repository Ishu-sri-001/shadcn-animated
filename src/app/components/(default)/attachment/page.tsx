import { NotesDemo } from "./notes-demo"
import { UploadDemo } from "./upload-demo"

export default function AttachmentPage() {
  return (
    <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Attachment</h1>
        <p className="text-sm text-muted-foreground">
          File chips that show upload progress, errors and previews.
        </p>
      </div>

      <UploadDemo />

      <NotesDemo />
    </div>
  )
}
