import { InputOTPDemo } from "./input-otp-demo"

export default function InputOTPPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Input OTP</h1>
        <p className="text-sm text-muted-foreground">
          A one-time code entered one character per box, with paste and autofill.
        </p>
      </div>

      <InputOTPDemo />
    </div>
  )
}
