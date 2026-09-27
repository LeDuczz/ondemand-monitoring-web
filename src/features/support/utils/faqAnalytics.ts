import { FAQ_ARTICLES } from '../data/helpArticles'

const STORAGE_KEY = 'omss_faq_helpful_votes_v2'

export function getArticleVotes(): Record<string, number> {
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (!stored) {
            return {}
        }
        return JSON.parse(stored)
    } catch {
        return {}
    }
}

export function recordArticleVote(articleId: string, helpful: boolean): Record<string, number> {
    const votes = getArticleVotes()
    if (helpful) {
        votes[articleId] = (votes[articleId] || 0) + 1
    } else if (votes[articleId] && votes[articleId] > 0) {
        votes[articleId] = votes[articleId] - 1
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(votes))
    } catch {
        // ignore
    }
    return votes
}

export function getTotalHelpfulVotes(): number {
    const votes = getArticleVotes()
    return Object.values(votes).reduce((sum, count) => sum + count, 0)
}

export function getTopHelpfulArticles(limit = 3) {
    const votes = getArticleVotes()
    const articlesWithVotes = FAQ_ARTICLES.map((article) => ({
        ...article,
        votesCount: votes[article.id] || 0,
    }))

    articlesWithVotes.sort((a, b) => b.votesCount - a.votesCount)
    return articlesWithVotes.slice(0, limit)
}
