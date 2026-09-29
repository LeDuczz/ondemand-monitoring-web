import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useLanguage } from '../../../../../shared/i18n'
import { supportApi } from '../../../api/supportApi'
import { getFaqArticles, searchHelpArticles, type FAQArticle } from '../../../data/helpArticles'

/**
 * Search + topic filter for the help center. The BE FAQ list is Vietnamese
 * only, so it is used for `vi`; English always reads the bundled English copy.
 */
export function useHelpArticles() {
  const { lang } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')

  const faqQuery = useApiQuery(
    (signal) => supportApi.getFaqArticles(selectedCategory, searchQuery, signal),
    [selectedCategory, searchQuery],
  )

  const articles = useMemo<FAQArticle[]>(() => {
    if (lang === 'vi' && faqQuery.data && faqQuery.data.length > 0) {
      const local = getFaqArticles('vi')
      return faqQuery.data.map((a) => {
        const id = (a.articleId || a.id) as FAQArticle['id']
        return {
          id,
          category: a.category,
          categoryLabel: a.categoryLabel || a.category,
          question: a.question,
          answer: a.answer,
          keywords: a.keywords || [],
          relatedArticleIds: local.find((l) => l.id === id)?.relatedArticleIds,
        }
      })
    }
    const found = searchHelpArticles(searchQuery, lang)
    return selectedCategory === 'ALL' ? found : found.filter((a) => a.category === selectedCategory)
  }, [faqQuery.data, lang, searchQuery, selectedCategory])

  return { articles, searchQuery, setSearchQuery, selectedCategory, setSelectedCategory }
}
