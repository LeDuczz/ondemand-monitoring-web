import type { Language } from '../../../shared/i18n'
import { helpContentEn } from './helpArticles.en'
import { helpContentVi } from './helpArticles.vi'

export type TopicId = 'ORDERS' | 'MISSIONS' | 'RESULTS' | 'MEDIA' | 'SCHEDULING' | 'ACCOUNT'

export type ArticleId =
    | 'ord-1' | 'ord-2' | 'ord-3' | 'ord-4'
    | 'msn-1' | 'msn-2' | 'msn-3' | 'msn-4'
    | 'res-1' | 'res-2' | 'res-3' | 'res-4'
    | 'med-1' | 'med-2' | 'med-3'
    | 'sch-1'
    | 'acc-1'

/** Language-specific copy. `helpArticles.vi.ts` and `helpArticles.en.ts` share this shape. */
export type HelpContent = {
    topics: Record<TopicId, { title: string; description: string }>
    articles: Record<ArticleId, { question: string; answer: string; keywords: string[] }>
}

export type FAQArticle = {
    id: ArticleId
    category: TopicId
    categoryLabel: string
    question: string
    answer: string
    keywords: string[]
    relatedArticleIds?: ArticleId[]
}

export type PopularTopic = {
    id: TopicId
    title: string
    description: string
    articleCount: number
}

/** Language-independent structure: which topic an article belongs to and its related articles. */
const ARTICLE_META: { id: ArticleId; category: TopicId; related: ArticleId[] }[] = [
    { id: 'ord-1', category: 'ORDERS', related: ['ord-3', 'msn-1'] },
    { id: 'ord-2', category: 'ORDERS', related: ['ord-1', 'sch-1'] },
    { id: 'ord-3', category: 'ORDERS', related: ['sch-1'] },
    { id: 'ord-4', category: 'ORDERS', related: ['ord-3'] },
    { id: 'msn-1', category: 'MISSIONS', related: ['msn-2'] },
    { id: 'msn-2', category: 'MISSIONS', related: ['msn-3'] },
    { id: 'msn-3', category: 'MISSIONS', related: ['msn-2', 'ord-1'] },
    { id: 'msn-4', category: 'MISSIONS', related: ['msn-1'] },
    { id: 'res-1', category: 'RESULTS', related: ['res-2', 'res-3'] },
    { id: 'res-2', category: 'RESULTS', related: ['res-1'] },
    { id: 'res-3', category: 'RESULTS', related: ['res-1'] },
    { id: 'res-4', category: 'RESULTS', related: ['res-2'] },
    { id: 'med-1', category: 'MEDIA', related: ['med-2'] },
    { id: 'med-2', category: 'MEDIA', related: ['med-1'] },
    { id: 'med-3', category: 'MEDIA', related: ['med-1'] },
    { id: 'sch-1', category: 'SCHEDULING', related: ['ord-3'] },
    { id: 'acc-1', category: 'ACCOUNT', related: [] },
]

const TOPIC_ORDER: TopicId[] = ['ORDERS', 'MISSIONS', 'RESULTS', 'MEDIA', 'SCHEDULING', 'ACCOUNT']

const CONTENT: Record<Language, HelpContent> = { vi: helpContentVi, en: helpContentEn }

export function getFaqArticles(lang: Language): FAQArticle[] {
    const content = CONTENT[lang]
    return ARTICLE_META.map((meta) => ({
        id: meta.id,
        category: meta.category,
        categoryLabel: content.topics[meta.category].title,
        ...content.articles[meta.id],
        relatedArticleIds: meta.related,
    }))
}

export function getPopularTopics(lang: Language): PopularTopic[] {
    const content = CONTENT[lang]
    return TOPIC_ORDER.map((id) => ({
        id,
        ...content.topics[id],
        articleCount: ARTICLE_META.filter((a) => a.category === id).length,
    }))
}

export function searchHelpArticles(query: string, lang: Language): FAQArticle[] {
    const articles = getFaqArticles(lang)
    const q = query.toLowerCase().trim()
    if (!q) return articles

    const words = q.split(/\s+/).filter((w) => w.length > 1)

    return articles.filter((article) => {
        const textToSearch = `${article.question} ${article.answer} ${article.categoryLabel} ${article.keywords.join(' ')}`.toLowerCase()
        return words.some((word) => textToSearch.includes(word))
    })
}
