'use client'

import { useTranslations } from 'next-intl'

interface PageHeaderProps {
  titleKey: string
  subtitleKey?: string
  namespace?: string
  count?: number
}

export function PageHeader({ titleKey, subtitleKey, namespace = 'dashboard', count }: PageHeaderProps) {
  const t = useTranslations(namespace)

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
        {t(titleKey)}
      </h1>
      {subtitleKey && (
        <p className="text-sm text-gray-500 mt-0.5">
          {t(subtitleKey, { count })}
        </p>
      )}
    </div>
  )
}

