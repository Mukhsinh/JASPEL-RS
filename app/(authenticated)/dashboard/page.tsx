import { DashboardContent } from './DashboardContent'
export default function DashboardPage({ searchParams }: { searchParams: { unit_id?: string, period?: string, year?: string } }) {
  return <DashboardContent
    unitId={searchParams.unit_id}
    period={searchParams.period}
    year={searchParams.year}
  />
}
