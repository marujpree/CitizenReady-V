import { ExternalLink } from 'lucide-react'
import { RESOURCE_SECTIONS, type ResourceSection } from '@/resources/links'
import { useTestSettings } from '@/quiz/useQuiz'

// Official USCIS study material, grouped by test. Your own test is shown first.
export default function ResourcesPage() {
  const { data: settings } = useTestSettings()

  // Put the section for the user's own test version ahead of the other version.
  const sections = [...RESOURCE_SECTIONS].sort((a, b) => rank(a, settings?.testVersion) - rank(b, settings?.testVersion))

  function badge(section: ResourceSection): string | null {
    if (settings?.testVersion && section.version === settings.testVersion) return 'Your test'
    if (settings?.special && section.special) return 'On for you'
    return null
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Resources</h1>
      <p className="mt-2 text-muted-foreground">
        Official study material from USCIS. These links open on uscis.gov in a new tab.
      </p>

      <div className="mt-8 flex flex-col gap-4">
        {sections.map((section) => {
          const tag = badge(section)
          return (
            <section key={section.id} aria-labelledby={section.id} className="rounded-3xl bg-white p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <h2 id={section.id} className="text-xl font-semibold tracking-tight">
                  {section.title}
                </h2>
                {tag && (
                  <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-brand-red">{tag}</span>
                )}
              </div>
              {section.intro && <p className="mt-2 text-muted-foreground">{section.intro}</p>}

              <ul className="mt-4 divide-y divide-border">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start justify-between gap-4 py-4 hover:text-brand-red"
                    >
                      <span>
                        <span className="block font-semibold">
                          {link.title}
                          <span className="ml-2 rounded bg-muted px-1.5 py-0.5 align-middle text-xs font-medium text-muted-foreground">
                            {link.format}
                          </span>
                        </span>
                        <span className="mt-1 block text-sm text-muted-foreground">{link.description}</span>
                      </span>
                      <ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground group-hover:text-brand-red" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        CitizenReady is an independent study tool and is not affiliated with USCIS. Test details and
        some answers change, so check uscis.gov for the latest.
      </p>
    </main>
  )
}

// The user's own test first, the other version last, everything else in the written order.
function rank(section: ResourceSection, mine?: number): number {
  if (!section.version) return 1
  return section.version === mine ? 0 : 2
}
