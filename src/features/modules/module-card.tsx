import { Link } from 'react-router'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ModuleDefinition } from './modules'

export function ModuleCard({ module }: { module: ModuleDefinition }) {
  const Icon = module.icon

  const card = (
    <Card className={module.available ? undefined : 'opacity-60'}>
      <CardHeader>
        <Icon aria-hidden />
        <CardTitle>{module.title}</CardTitle>
        {!module.available && <Badge variant="secondary">In arrivo</Badge>}
      </CardHeader>
      <CardContent>
        <CardDescription>{module.description}</CardDescription>
      </CardContent>
    </Card>
  )

  if (!module.available) return <div aria-disabled="true">{card}</div>
  return <Link to={`/modulo/${module.slug}`}>{card}</Link>
}
