import { describe, expect, it } from 'vitest'

import { getFaqArticles, getPopularTopics, searchHelpArticles } from './helpArticles'

const VI_CHARS = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i

describe('helpArticles', () => {
  it('has the same articles and topics in both languages', () => {
    expect(getFaqArticles('en').map((a) => a.id)).toEqual(getFaqArticles('vi').map((a) => a.id))
    expect(getPopularTopics('en').map((t) => t.id)).toEqual(getPopularTopics('vi').map((t) => t.id))
  })

  it('English copy has no Vietnamese and is not a copy of the Vietnamese text', () => {
    const vi = getFaqArticles('vi')
    for (const article of getFaqArticles('en')) {
      expect(VI_CHARS.test(`${article.question} ${article.answer} ${article.categoryLabel} ${article.keywords.join(' ')}`)).toBe(false)
      expect(article.answer).not.toBe(vi.find((a) => a.id === article.id)?.answer)
    }
    for (const topic of getPopularTopics('en')) {
      expect(VI_CHARS.test(`${topic.title} ${topic.description}`)).toBe(false)
    }
  })

  it('counts the real articles per topic and only links to existing articles', () => {
    const articles = getFaqArticles('en')
    const total = getPopularTopics('en').reduce((sum, t) => sum + t.articleCount, 0)
    expect(total).toBe(articles.length)
    const ids = new Set(articles.map((a) => a.id))
    for (const article of articles) {
      for (const related of article.relatedArticleIds ?? []) expect(ids.has(related)).toBe(true)
    }
  })

  it('searches in the given language', () => {
    expect(searchHelpArticles('pending approval', 'en').map((a) => a.id)).toContain('ord-1')
    expect(searchHelpArticles('phê duyệt', 'vi').map((a) => a.id)).toContain('ord-1')
    expect(searchHelpArticles('phê duyệt', 'en')).toEqual([])
  })
})
