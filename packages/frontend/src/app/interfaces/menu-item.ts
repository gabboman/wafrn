import { IconDefinition } from '@fortawesome/free-solid-svg-icons'

export interface MenuItem {
  label: string
  icon?: IconDefinition
  title: string
  visible?: boolean
  badge?: number
  items?: MenuItem[]
  routerLink?: string
  url?: string
  command?: () => void
  divider?: boolean
}
