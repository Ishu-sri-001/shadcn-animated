import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const invoices = [
  { invoice: "INV001", status: "Paid", method: "Credit Card", amount: 250 },
  { invoice: "INV002", status: "Pending", method: "PayPal", amount: 150 },
  { invoice: "INV003", status: "Unpaid", method: "Bank Transfer", amount: 350 },
  { invoice: "INV004", status: "Paid", method: "Credit Card", amount: 450 },
  { invoice: "INV005", status: "Paid", method: "PayPal", amount: 550 },
  { invoice: "INV006", status: "Pending", method: "Bank Transfer", amount: 200 },
  { invoice: "INV007", status: "Unpaid", method: "Credit Card", amount: 300 },
]

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const total = invoices.reduce((sum, row) => sum + row.amount, 0)

export default function TablePage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Table</h1>
        <p className="text-sm text-muted-foreground">
          A responsive table for rows of data, with a header, body and footer.
        </p>
      </div>

      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[20%]">Invoice</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((row) => (
            <TableRow key={row.invoice}>
              <TableCell className="font-medium">{row.invoice}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>{row.method}</TableCell>
              <TableCell className="text-right">{currency.format(row.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>Total</TableCell>
            <TableCell className="text-right">{currency.format(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  )
}
