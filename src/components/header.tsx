import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserCheck } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b bg-white sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <UserCheck className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">RecruitPro</h1>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/candidates">
              <Button variant="ghost">求職者</Button>
            </Link>
            <Link href="/companies">
              <Button variant="ghost">企業</Button>
            </Link>
            <Link href="/stores">
              <Button variant="ghost">店舗</Button>
            </Link>
            <Link href="/jobs">
              <Button variant="ghost">求人</Button>
            </Link>
            <Link href="/domino/import">
              <Button variant="ghost">Domino連携</Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}