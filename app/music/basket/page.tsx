import { BasketView } from "@/components/music/basket-view"

export const metadata = {
  title: "Your basket — EQHO Music",
  description: "Review the licences in your EQHO Music basket.",
}

export default function BasketPage() {
  return (
    <div className="flex flex-col gap-6 pb-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-white">Your basket</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-white/55">
          Every price is recalculated on the server when you review your basket, so what you see is always the real
          total.
        </p>
      </header>

      <BasketView />
    </div>
  )
}
