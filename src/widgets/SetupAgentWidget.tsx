import { Fragment, FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import styled from 'styled-components'
import tw from 'twin.macro'
import {
  type AgentMessage,
  type AgentSetupDraft,
  useChatWithSetupAgentMutation,
  useGetAgentCapabilitiesQuery,
  useGetBowlsQuery,
  useGetBowlSetupTypesQuery,
  useGetCoalsQuery,
  useGetCoalPlacementsQuery,
  useGetKaloudsQuery,
  useGetTobaccosQuery,
  useTranscribeSetupVoiceMutation,
} from '../shared/api'
import { CatalogIcon, CheckIcon, CloseIcon, MicIcon, SendIcon } from '../shared/ui/Icons'
import { MIX_COLORS, type MixBowlItem } from '../shared/ui/mixBowlModel'

const ChatPanel = styled.section`
  ${tw`relative flex w-full overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]`}
  border-radius: 28px;
  box-shadow:
    0 34px 90px -48px rgba(83, 48, 31, 0.9),
    0 16px 42px -28px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.58);
  height: min(820px, calc(100vh - 9rem));
  min-height: 640px;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 14% 0%, rgba(222, 139, 87, 0.18), transparent 32%),
      radial-gradient(circle at 88% 18%, rgba(83, 48, 31, 0.11), transparent 28%),
      linear-gradient(180deg, rgba(255, 248, 241, 0.52), transparent 36%);
  }

  @media (max-width: 640px) {
    border-radius: 18px;
    height: calc(100vh - 8.5rem);
    min-height: 560px;
  }
`

const Header = tw.div`relative z-10 flex items-center justify-between gap-4 border-b border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))]/90 px-5 py-4 backdrop-blur-xl sm:px-6`
const HeaderMark = tw.div`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--color-surface-inverse))] text-[rgb(var(--color-text-inverse))] shadow-[0_18px_34px_-24px_rgba(83,48,31,0.9)]`
const Title = tw.h2`text-[17px] font-black leading-snug tracking-tight text-[rgb(var(--color-text))] sm:text-[19px]`
const Subtitle = tw.div`mt-1 max-w-2xl text-[12px] font-semibold leading-5 text-[rgb(var(--color-text-subtle))]`
const StatusPill = tw.div`hidden shrink-0 items-center gap-1.5 rounded-full border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))]/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-[rgb(var(--color-text-muted))] sm:inline-flex`
const PanelBody = tw.div`relative z-10 flex min-h-0 flex-1 flex-col`
const ScrollArea = tw.div`min-h-0 flex-1 overflow-y-auto`
const Messages = tw.div`flex min-h-full flex-col justify-end gap-3 px-3 py-4 sm:px-6 sm:py-5`
const Composer = tw.form`flex items-end gap-2 border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))]/95 p-3 backdrop-blur-xl sm:gap-3 sm:p-4`
const Textarea = tw.textarea`min-h-[3.25rem] max-h-32 flex-1 resize-none rounded-2xl border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-4 py-3 text-[14px] font-semibold leading-5 text-[rgb(var(--color-text))] outline-none transition placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_4px_rgba(139,74,43,0.12)] disabled:opacity-60`
const ToolButton = tw.button`inline-flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] shadow-[0_12px_24px_-22px_rgba(83,48,31,0.8)] transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-accent))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`
const SendButton = tw.button`inline-flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-2xl bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-inverse))] shadow-[0_18px_34px_-22px_rgba(83,48,31,1)] transition hover:bg-[rgb(var(--color-accent-hover))] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45`

const Bubble = styled.div<{ $mine?: boolean }>`
  ${tw`max-w-[86%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-[13px] font-semibold leading-5 shadow-[0_14px_28px_-26px_rgba(83,48,31,0.75)] sm:max-w-[74%] sm:text-[14px]`}
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  color: ${({ $mine }) => ($mine ? 'rgb(var(--color-text-inverse))' : 'rgb(var(--color-text))')};
  background: ${({ $mine }) => ($mine ? 'linear-gradient(135deg, rgb(var(--color-surface-inverse)), rgba(83, 48, 31, 0.88))' : 'rgba(255, 255, 255, 0.78)')};
  border: 1px solid ${({ $mine }) => ($mine ? 'rgba(255, 248, 241, 0.12)' : 'rgb(var(--color-border-muted))')};
  border-bottom-right-radius: ${({ $mine }) => ($mine ? '6px' : '1rem')};
  border-bottom-left-radius: ${({ $mine }) => ($mine ? '1rem' : '6px')};
`

const TypingBubble = tw.div`max-w-[86%] self-start rounded-2xl rounded-bl-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))]/80 px-4 py-3 text-[13px] font-semibold leading-5 text-[rgb(var(--color-text-subtle))] shadow-[0_14px_28px_-26px_rgba(83,48,31,0.75)] sm:max-w-[74%]`
const MissingChips = tw.div`mt-2 flex flex-wrap gap-1.5`
const MissingChip = tw.span`inline-flex h-6 items-center rounded-full border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2.5 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftShell = tw.div`w-full max-w-[720px] self-start rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 p-3 shadow-[0_18px_42px_-32px_rgba(83,48,31,0.85)] backdrop-blur`
const DraftHeader = tw.div`flex items-start justify-between gap-3`
const DraftTitle = tw.div`min-w-0`
const DraftName = tw.div`truncate text-[13px] font-black text-[rgb(var(--color-text))]`
const DraftLabel = tw.div`mt-0.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DraftBadge = tw.span`inline-flex shrink-0 items-center gap-1 rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2.5 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftLine = tw.div`mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[rgb(var(--color-text-muted))]`
const DraftToken = tw.span`inline-flex max-w-full items-center gap-1 rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1`
const PublishButton = tw.button`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-[rgb(var(--color-accent))] px-3 text-[12px] font-black text-[rgb(var(--color-text-inverse))] shadow-[0_18px_34px_-24px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50`
const MissingText = tw.div`text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`
const DraftMixGrid = tw.div`mt-2 grid gap-1`
const DraftMixRow = tw.div`grid grid-cols-[30px_minmax(0,1fr)_auto] items-center gap-2 rounded-md bg-[rgb(var(--color-surface-muted))] p-1`
const DraftMiniPhoto = tw.div`h-[30px] w-[30px] overflow-hidden rounded-md bg-[rgb(var(--color-surface))]`
const DraftMixName = tw.div`truncate text-[12px] font-black text-[rgb(var(--color-text))]`
const DraftMixMeta = tw.div`truncate text-[10px] font-semibold text-[rgb(var(--color-text-subtle))]`
const DraftPercent = tw.div`rounded-md bg-[rgb(var(--color-surface))] px-1.5 py-0.5 text-[11px] font-black text-[rgb(var(--color-accent))] tabular-nums`
const DraftSpecGrid = tw.div`mt-1.5 flex flex-wrap gap-1`
const DraftSpec = tw.div`grid max-w-full grid-cols-[24px_minmax(0,1fr)] items-center gap-1.5 rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-1.5 py-1`
const DraftSpecPhoto = tw.div`h-6 w-6 overflow-hidden rounded bg-[rgb(var(--color-surface-muted))]`
const DraftSpecText = tw.div`min-w-0`
const DraftSpecLabel = tw.div`text-[9px] font-bold uppercase leading-3 text-[rgb(var(--color-text-subtle))]`
const DraftSpecValue = tw.div`max-w-[118px] truncate text-[11px] font-black leading-3 text-[rgb(var(--color-text))]`
const ChoiceShell = tw.div`w-full max-w-[760px] self-start rounded-2xl border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))]/95 p-3 shadow-[0_18px_42px_-32px_rgba(83,48,31,0.85)] backdrop-blur`
const ChoiceHeader = tw.div`mb-2 flex items-start justify-between gap-3`
const ChoiceTitle = tw.div`text-[13px] font-black text-[rgb(var(--color-text))]`
const ChoiceHint = tw.div`mt-0.5 text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`
const ChoiceGrid = tw.div`grid gap-2 sm:grid-cols-2`
const ChoiceCard = tw.button`grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 rounded-xl border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-2 text-left shadow-[0_12px_26px_-24px_rgba(83,48,31,0.75)] transition hover:-translate-y-0.5 hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:shadow-[0_18px_32px_-26px_rgba(83,48,31,0.9)] disabled:cursor-not-allowed disabled:opacity-60`
const ChoicePhoto = tw.div`h-[52px] w-[52px] overflow-hidden rounded-xl bg-[rgb(var(--color-surface-muted))]`
const ChoiceBody = tw.div`min-w-0`
const ChoiceName = tw.div`truncate text-[12px] font-black text-[rgb(var(--color-text))]`
const ChoiceMeta = tw.div`mt-0.5 truncate text-[10px] font-semibold leading-3 text-[rgb(var(--color-text-subtle))]`

type SetupAgentWidgetProps = {
  initialDraft?: AgentSetupDraft | null
  onDraftChange?: (draft: AgentSetupDraft) => void
}

type CatalogKind = 'tobacco' | 'bowl' | 'kaloud' | 'coal' | 'placement' | 'setupType'

type CatalogChoiceSnapshot = {
  kind: CatalogKind
  title: string
  hint: string
  items: any[]
  missing?: string[]
}

type TimelineMessage = AgentMessage & {
  id: string
  draftSnapshot?: AgentSetupDraft | null
  missingSnapshot?: string[]
  choiceSnapshot?: CatalogChoiceSnapshot
}

type LocalChatResolution = {
  draft?: AgentSetupDraft | null
  trailingMessages?: TimelineMessage[]
}

const createInitialTimelineMessages = (content: string): TimelineMessage[] => ([{
  id: 'initial-0',
  role: 'assistant',
  content,
}])

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`
const agentSessionStorageKey = 'shisha-guid-agent-session'

const readAgentSession = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(agentSessionStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { messages?: TimelineMessage[]; draft?: AgentSetupDraft | null }
    if (!Array.isArray(parsed.messages)) return null
    return parsed
  } catch {
    return null
  }
}

const writeAgentSession = (messages: TimelineMessage[], draft: AgentSetupDraft | null) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(agentSessionStorageKey, JSON.stringify({ messages, draft }))
  } catch {
    // Chat persistence is an optimization only.
  }
}

const clearAgentSession = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(agentSessionStorageKey)
  } catch {
    // Nothing to clear when storage is unavailable.
  }
}

const compactApiMessages = (messages: TimelineMessage[]): AgentMessage[] => (
  messages
    .filter((message) => message.role === 'user' || message.content.trim())
    .map(({ role, content }) => ({ role, content }))
    .slice(-20)
)

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

const normalizeText = (value: string) => (
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}%]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

const transliterateRu = (value: string) => {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ж: 'zh', з: 'z', и: 'i', й: 'y',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u',
    ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya',
    ь: '', ъ: '',
  }
  return normalizeText(value).split('').map((char) => map[char] || char).join('')
}

const searchableText = (value: string) => `${normalizeText(value)} ${transliterateRu(value)}`

const searchForms = (value: string) => {
  const base = normalizeText(value)
  const transliterated = transliterateRu(value)
  return Array.from(new Set([
    base,
    transliterated,
    base.replace(/\s+/g, ''),
    transliterated.replace(/\s+/g, ''),
  ].filter(Boolean)))
}

const weakValueTokens = new Set([
  'the',
  'and',
  'with',
  'для',
  'без',
  'или',
  '100',
  '1',
  'кг',
  'г',
  'гр',
  'medium',
  'light',
  'strong',
])

const isExplicitValue = (value: string | null | undefined, userCorpus: string) => {
  const normalizedValue = normalizeText(value || '')
  if (!normalizedValue) return false
  if (userCorpus.includes(normalizedValue)) return true

  const tokens = normalizedValue
    .split(' ')
    .filter((token) => token.length >= 3 && !weakValueTokens.has(token))

  return tokens.some((token) => userCorpus.includes(token))
}

const hasExplicitPercent = (messages: TimelineMessage[]) => (
  messages
    .filter((message) => message.role === 'user')
    .some((message) => /%|\bпроцент|\bpercent|\bдол[яи]\b/i.test(message.content))
)

const userCorpusFrom = (messages: TimelineMessage[]) => normalizeText(
  messages
    .filter((message) => message.role === 'user')
    .map((message) => message.content)
    .join(' ')
)

const hasDraftValue = (draft: AgentSetupDraft | null | undefined) => Boolean(
  draft?.name ||
  draft?.description ||
  draft?.bowl_name ||
  draft?.bowl_id ||
  draft?.kaloud_name ||
  draft?.kaloud_id ||
  draft?.coal_name ||
  draft?.coal_id ||
  draft?.coal_placement_name ||
  draft?.coal_placement_id ||
  draft?.bowl_setup_type_name ||
  draft?.bowl_setup_type_id ||
  draft?.tobaccos?.length
)

const sanitizeAssistantReply = (reply: string) => {
  const clean = reply
    .replace(/^Черновик обновлен\.\s*/i, '')
    .replace(/\s*Напиши только это,? и я дополню\.?/i, '')
    .replace(/\s*Напиши только эти пункты одним сообщением,? и агент обновит черновик\.?/i, '')
    .trim()

  return clean
}

const labelByKind: Record<CatalogKind, string> = {
  tobacco: 'табак',
  bowl: 'чашу',
  kaloud: 'калауд',
  coal: 'уголь',
  placement: 'раскладку углей',
  setupType: 'тип забивки',
}

const questionPatterns: Array<{ kind: CatalogKind; words: string[] }> = [
  { kind: 'tobacco', words: ['табак', 'табаки', 'тютюн', 'тютюни'] },
  { kind: 'bowl', words: ['чаша', 'чаши', 'чашу'] },
  { kind: 'kaloud', words: ['калауд', 'калауды', 'kaloud'] },
  { kind: 'coal', words: ['уголь', 'угли', 'угольки', 'coal'] },
  { kind: 'placement', words: ['раскладка', 'расположение', 'углей'] },
  { kind: 'setupType', words: ['тип', 'забивки'] },
]

const catalogQuestionWords = ['какие', 'какой', 'какая', 'что есть', 'есть', 'покажи', 'показать', 'список', 'варианты', 'выбрать']
const metaQuestionWords = ['что это', 'че это', 'зачем', 'кто ты', 'что умеешь', 'как работает', 'помоги', 'help']
const stateQuestionWords = [
  'что я уже выбрал',
  'что уже выбрано',
  'что выбрано',
  'мой выбор',
  'покажи выбор',
  'покажи черновик',
  'что в черновике',
  'скинь json',
  'покажи json',
  'json',
]

const getKindFromText = (text: string) => {
  const normalized = normalizeText(text)
  return questionPatterns.find((entry) => entry.words.some((word) => normalized.includes(normalizeText(word))))?.kind || null
}

const isCatalogQuestion = (text: string) => {
  const normalized = normalizeText(text)
  const kind = getKindFromText(text)
  if (!kind) return false
  return catalogQuestionWords.some((word) => normalized.includes(normalizeText(word)))
}

const stripKindWords = (text: string, kind: CatalogKind) => {
  const kindWords = questionPatterns.find((entry) => entry.kind === kind)?.words || []
  const stopWords = [
    ...kindWords,
    ...catalogQuestionWords,
    'я',
    'мне',
    'хочу',
    'добавь',
    'добавить',
    'выбери',
    'выбрать',
    'надо',
    'нужно',
  ].map(normalizeText)

  return normalizeText(text)
    .split(' ')
    .filter((token) => token.length > 2 && !stopWords.includes(token))
    .join(' ')
}

const isMetaQuestion = (text: string) => {
  const normalized = normalizeText(text)
  return metaQuestionWords.some((word) => normalized.includes(normalizeText(word)))
}

const isPercentQuestion = (text: string) => {
  const normalized = normalizeText(text)
  return /(?:процент|проценты|%|доли|доля)/i.test(normalized) &&
    ['какие', 'какой', 'как', 'что', 'сколько', 'есть'].some((word) => normalized.includes(word))
}

const isMissingQuestion = (text: string) => {
  const normalized = normalizeText(text)
  return ['чего не хватает', 'что не хватает', 'что осталось', 'что еще', 'дальше'].some((word) => (
    normalized.includes(normalizeText(word))
  ))
}

const isAgentAutofillRequest = (text: string) => {
  const normalized = normalizeText(text)
  return [
    'забей сам',
    'собери сам',
    'сделай сам',
    'сам выбери',
    'сам выбрать',
    'можешь сам',
    'можешь собрать',
    'собери мне',
    'сделай мне',
    'заполни сам',
    'заполнить сам',
    'заполни все',
    'заполнить все',
    'подбери сам',
    'подобрать сам',
    'для теста',
    'тестово',
    'демо',
    'рандом',
    'рандомно',
    'случайно',
    'случайную',
    'любую',
    'любой',
    'любое',
    'выбери мне',
    'на твой вкус',
    'как хочешь',
    'который ты хочешь',
    'которую ты хочешь',
    'как ты знаешь',
  ].some((word) => normalized.includes(normalizeText(word)))
}

const isPositiveConfirmation = (text: string) => {
  const normalized = normalizeText(text)
  return [
    'да',
    'ага',
    'угу',
    'ок',
    'окей',
    'хорошо',
    'подтверждаю',
    'верно',
    'правильно',
    'согласен',
    'пойдет',
    'го',
    'давай',
    'двавай',
    'делай',
    'сделай',
  ].includes(normalized)
}

const isStateQuestion = (text: string) => {
  const normalized = normalizeText(text)
  return stateQuestionWords.some((word) => normalized.includes(normalizeText(word)))
}

const isShortTobaccoSearch = (text: string) => {
  const normalized = normalizeText(text)
  const wordCount = normalized.split(' ').filter(Boolean).length
  if (!normalized || wordCount > 3) return false
  if (isMetaQuestion(text) || getKindFromText(text)) return false
  if (/^\d+%?$/.test(normalized)) return false
  return true
}

const getItemText = (item: any) => searchableText(`${item?.name || ''} ${item?.description || ''}`)

const getItemPhoto = (item: any) => (
  item?.photo_urls?.[0] ||
  item?.photo_url ||
  item?.image_url ||
  item?.image ||
  null
)

const getCatalogItem = (items: any[], id?: string | null, name?: string | null) => {
  const normalizedName = normalizeText(name || '')
  return items.find((item) => item.id && id && item.id === id) ||
    items.find((item) => normalizedName && normalizeText(item.name || '') === normalizedName) ||
    null
}

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) return 0
  if (!left.length) return right.length
  if (!right.length) return left.length

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  const current = Array.from({ length: right.length + 1 }, () => 0)

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost,
      )
    }
    previous.splice(0, previous.length, ...current)
  }

  return previous[right.length]
}

const consonantSignature = (value: string) => transliterateRu(value).replace(/[aeiouy\s\d%]+/g, '')

const fuzzyTokenScore = (queryToken: string, itemToken: string) => {
  if (queryToken.length < 4 || itemToken.length < 4) return 0

  const distance = levenshteinDistance(queryToken, itemToken)
  const maxLength = Math.max(queryToken.length, itemToken.length)
  const similarity = 1 - distance / maxLength
  if (similarity >= 0.72) return Math.round(similarity * queryToken.length) + 2

  const querySignature = consonantSignature(queryToken)
  const itemSignature = consonantSignature(itemToken)
  if (querySignature.length >= 3 && querySignature === itemSignature) return queryToken.length + 3

  return 0
}

const scoreCatalogItem = (item: any, query: string) => {
  const itemText = getItemText(item)
  const itemJoined = itemText.replace(/\s+/g, '')
  const itemTokens = Array.from(new Set(itemText.split(' ').filter((token) => token.length > 1)))

  return searchForms(query).reduce((best, form) => {
    const tokens = form.split(' ').filter((token) => token.length > 1)
    const joined = form.replace(/\s+/g, '')
    let score = 0

    if (joined.length > 2 && itemJoined.includes(joined)) score += joined.length + 8
    if (form.length > 2 && itemText.includes(form)) score += form.length + 6
    tokens.forEach((token) => {
      if (itemText.includes(token)) score += token.length
      score += itemTokens.reduce((tokenBest, itemToken) => Math.max(tokenBest, fuzzyTokenScore(token, itemToken)), 0)
    })

    return Math.max(best, score)
  }, 0)
}

const searchCatalog = (items: any[], query: string) => {
  return items
    .map((item) => {
      const score = scoreCatalogItem(item, query)
      return { item, score, hasPhoto: Boolean(getItemPhoto(item)) }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.hasPhoto) - Number(a.hasPhoto))
    .map((entry) => entry.item)
    .slice(0, 9)
}

const splitCatalogQueries = (text: string) => {
  const normalized = normalizeText(text)
  const phrases = normalized
    .replace(/\b(?:давай|давй|добавь|добавить|возьми|выбери|хочу|табак|табаки)\b/g, ' ')
    .split(/\s+(?:и|and|\+)\s+|[,;/]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length > 1)

  return phrases.length ? phrases : [normalized].filter(Boolean)
}

const findMentionedCatalogItems = (items: any[], text: string) => {
  const used = new Set<string>()
  const matches = splitCatalogQueries(text)
    .map((query) => {
      const best = items
        .map((item) => ({ item, score: scoreCatalogItem(item, query) }))
        .filter((entry) => entry.score >= 4)
        .sort((a, b) => b.score - a.score)[0]

      return best
    })
    .filter(Boolean)
    .map((entry) => entry!.item)
    .filter((item) => {
      const key = item.id || normalizeText(item.name || '')
      if (used.has(key)) return false
      used.add(key)
      return true
    })

  return matches
}

const buildChoiceSnapshot = (kind: CatalogKind, items: any[], hint?: string, missing?: string[]): CatalogChoiceSnapshot | null => {
  if (!items.length) return null

  const sortedItems = [...items].sort((a, b) => Number(Boolean(getItemPhoto(b))) - Number(Boolean(getItemPhoto(a))))

  return {
    kind,
    title: `Выбери ${labelByKind[kind]}`,
    hint: hint || 'Нажми на вариант.',
    items: sortedItems.slice(0, 9),
    missing,
  }
}

const getCatalogItems = (kind: CatalogKind, catalogs: Record<CatalogKind, any[]>) => catalogs[kind] || []

const getMissingCatalogKind = (missing: string[]): CatalogKind | null => {
  if (missing[0] === 'проценты табаков') return null

  return missing.includes('табак')
    ? 'tobacco'
    : missing.includes('чаша')
      ? 'bowl'
      : missing.includes('калауд')
        ? 'kaloud'
        : missing.includes('уголь')
          ? 'coal'
          : missing.includes('раскладка углей')
            ? 'placement'
            : missing.includes('тип забивки')
              ? 'setupType'
              : null
}

const buildMissingChoice = (missing: string[], catalogs: Record<CatalogKind, any[]>) => {
  const missingKind = getMissingCatalogKind(missing)

  return missingKind
    ? buildChoiceSnapshot(missingKind, getCatalogItems(missingKind, catalogs), 'Выбери ниже. Карточка останется в чате.', missing)
    : null
}

const compactCatalogForAgent = (items: any[]) => (
  items.slice(0, 20).map((item) => ({
    id: item?.id || null,
    name: item?.name || null,
    price: typeof item?.price === 'number' ? item.price : null,
    currency: item?.price_currency || null,
    description: item?.description || null,
    has_photo: Boolean(getItemPhoto(item)),
  }))
)

const buildAgentContextMessage = (
  nextDraft: AgentSetupDraft | null,
  nextMissing: string[],
  catalogs: Record<CatalogKind, any[]>,
): AgentMessage => {
  const autoName = buildAutoDraftName(nextDraft)
  const context = {
    current_draft: nextDraft || null,
    auto_name: autoName,
    missing_fields: nextMissing,
    catalogs: {
      tobaccos: compactCatalogForAgent(catalogs.tobacco),
      bowls: compactCatalogForAgent(catalogs.bowl),
      kalouds: compactCatalogForAgent(catalogs.kaloud),
      coals: compactCatalogForAgent(catalogs.coal),
      coal_placements: compactCatalogForAgent(catalogs.placement),
      setup_types: compactCatalogForAgent(catalogs.setupType),
    },
  }

  return {
    role: 'user',
    content: [
      'Скрытые инструкции интерфейса ShishaGuid для следующего ответа. Это не сообщение пользователя, а runtime context для агента.',
      'Веди себя как гибкий агент, а не форма: отвечай на вопрос пользователя, учитывай всю историю и текущий черновик.',
      'Не своди ответ к списку недостающих полей. Сначала ответь по смыслу последнего сообщения пользователя, потом предложи один полезный следующий шаг.',
      'Если последнее сообщение пользователя является приветствием, small talk, вопросом о чате или непонятным коротким вводом, не перечисляй missing_fields и не обновляй черновик; ответь разговорно и мягко направь к описанию забивки.',
      'Перечисляй missing_fields только когда пользователь уже описывает забивку, явно спрашивает что осталось выбрать или просит продолжить сборку.',
      'Если пользователь спрашивает, что уже выбрал, перечисли current_draft и при просьбе JSON покажи компактный JSON.',
      'Если пользователь пишет мусор или один непонятный символ, скажи, что не понял ввод, и попроси уточнить; не делай вид, что это параметр забивки.',
      'Название забивки не требуй, если выбраны табаки: оно автогенерируется из названий табаков через " + ".',
      'Если пользователь просит тебя самому выбрать/заполнить всё для теста или демо, выбери конкретные позиции из catalogs, верни полный draft с id/name/процентами и попроси проверить карточку.',
      'Фразы вроде "забей сам", "собери сам", "сделай сам", "любой", "на твой вкус" означают, что нужно самому выбрать позиции из catalogs и вернуть их в draft.',
      'Если пользователь подтверждает твой предложенный набор, верни подтвержденные значения в draft. Нельзя текстом говорить, что черновик готов, если draft пустой или неполный.',
      'Каждый конкретный выбранный тобой параметр, который ты называешь в ответе, обязан быть в STATE_JSON-compatible draft, иначе интерфейс не сможет показать карточку.',
      'Используй только варианты из catalogs. Если пользователь пишет с опечатками, сопоставляй смысл с текущими названиями из catalogs без выдумывания новых позиций.',
      'Фронт после твоего текста покажет карточку черновика и варианты выбора, если они нужны.',
      `STATE_JSON: ${JSON.stringify(context)}`,
    ].join('\n'),
  }
}

const cleanTitle = (text: string) => (
  text
    .replace(/^\s*(?:название|назови|имя)\s*[:\-]?\s*/i, '')
    .replace(/^[«"“'`]+|[»"”'`]+$/g, '')
    .trim()
)

const isTitleCommand = (text: string) => /^\s*(?:название|назови|имя)\b/i.test(text)

const shouldUseAsTitle = (draft: AgentSetupDraft | null, missing: string[], text: string) => {
  const normalized = normalizeText(text)
  if (!draft || (!missing.includes('название') && !isTitleCommand(text))) return false
  if (isMetaQuestion(text) || isCatalogQuestion(text) || getKindFromText(text)) return false
  if (isPercentQuestion(text) || isMissingQuestion(text)) return false
  if (['какие', 'какой', 'какая', 'как', 'что', 'почему', 'зачем', 'сколько'].some((word) => normalized.includes(word))) return false
  if (/^\d+%?$/.test(normalized)) return false
  return cleanTitle(text).length > 0 && cleanTitle(text).length <= 80
}

const explicitDraftFromResponse = (
  previousDraft: AgentSetupDraft | null,
  responseDraft: AgentSetupDraft | null | undefined,
  messages: TimelineMessage[],
  allowAgentChoices = false,
): AgentSetupDraft | null => {
  if (!responseDraft) return previousDraft

  if (allowAgentChoices) {
    return hasDraftValue(responseDraft) ? withAutoDraftName(responseDraft, previousDraft) : previousDraft
  }

  const userCorpus = userCorpusFrom(messages)
  const nextDraft: AgentSetupDraft = { ...(previousDraft || {}) }
  const percentWasExplicit = hasExplicitPercent(messages)

  const copyNamedField = (
    nameKey: keyof AgentSetupDraft,
    idKey: keyof AgentSetupDraft,
  ) => {
    const responseName = responseDraft[nameKey] as string | null | undefined
    if (!isExplicitValue(responseName, userCorpus)) return
    ;(nextDraft[nameKey] as string | null | undefined) = responseName || null
    ;(nextDraft[idKey] as string | null | undefined) = (responseDraft[idKey] as string | null | undefined) || null
  }

  if (isExplicitValue(responseDraft.name, userCorpus) && normalizeText(responseDraft.name || '') !== normalizeText('Новая забивка')) {
    nextDraft.name = responseDraft.name || null
  }

  if (responseDraft.description && isExplicitValue(responseDraft.description, userCorpus)) {
    nextDraft.description = responseDraft.description
  }

  copyNamedField('bowl_name', 'bowl_id')
  copyNamedField('kaloud_name', 'kaloud_id')
  copyNamedField('coal_name', 'coal_id')
  copyNamedField('coal_placement_name', 'coal_placement_id')
  copyNamedField('bowl_setup_type_name', 'bowl_setup_type_id')

  const previousTobaccos = previousDraft?.tobaccos || []
  const explicitTobaccos = (responseDraft.tobaccos || [])
    .filter((item) => isExplicitValue(item.tobacco_name, userCorpus))
    .map((item) => ({
      ...item,
      percentage: percentWasExplicit ? item.percentage : null,
    }))

  const mergedTobaccos = [...previousTobaccos]
  explicitTobaccos.forEach((item) => {
    const existingIndex = mergedTobaccos.findIndex((existing) => (
      existing.tobacco_id && item.tobacco_id
        ? existing.tobacco_id === item.tobacco_id
        : normalizeText(existing.tobacco_name || '') === normalizeText(item.tobacco_name || '')
    ))

    if (existingIndex >= 0) {
      mergedTobaccos[existingIndex] = {
        ...mergedTobaccos[existingIndex],
        ...item,
        percentage: percentWasExplicit ? item.percentage : mergedTobaccos[existingIndex].percentage,
      }
      return
    }

    mergedTobaccos.push(item)
  })

  if (mergedTobaccos.length) {
    nextDraft.tobaccos = mergedTobaccos.length === 1
      ? [{ ...mergedTobaccos[0], percentage: 100 }]
      : mergedTobaccos
  }

  return hasDraftValue(nextDraft) ? withAutoDraftName(nextDraft, previousDraft) : null
}

const applyPercentMessage = (draft: AgentSetupDraft | null, text: string): AgentSetupDraft | null => {
  if (!draft?.tobaccos?.length) return null
  const normalized = normalizeText(text)

  if (draft.tobaccos.length > 1 && ['поровну', 'ровно', 'равно', 'пополам'].some((word) => normalized.includes(word))) {
    const base = Math.floor(100 / draft.tobaccos.length)
    const remainder = 100 - base * draft.tobaccos.length
    return {
      ...draft,
      tobaccos: draft.tobaccos.map((item, index) => ({
        ...item,
        percentage: base + (index === 0 ? remainder : 0),
      })),
    }
  }

  const percentages = [...text.matchAll(/(\d{1,3})\s*%/g)].map((match) => Number(match[1]))
  if (!percentages.length) return null

  if (draft.tobaccos.length === 1) {
    const value = Math.min(100, Math.max(1, percentages[0]))
    return { ...draft, tobaccos: [{ ...draft.tobaccos[0], percentage: value }] }
  }

  if (percentages.length !== draft.tobaccos.length) return null
  const total = percentages.reduce((sum, value) => sum + value, 0)
  if (total !== 100) return null

  return {
    ...draft,
    tobaccos: draft.tobaccos.map((item, index) => ({ ...item, percentage: percentages[index] })),
  }
}

const getMissingFields = (draft: AgentSetupDraft | null) => {
  if (!draft) return []

  const tobaccoTotal = draft.tobaccos?.reduce((sum, item) => sum + Number(item.percentage || 0), 0) || 0

  return [
    draft.name ? null : 'название',
    draft.tobaccos?.length ? null : 'табак',
    !draft.tobaccos?.length || draft.tobaccos.length === 1 || tobaccoTotal === 100 ? null : 'проценты табаков',
    draft.bowl_name || draft.bowl_id ? null : 'чаша',
    draft.kaloud_name || draft.kaloud_id ? null : 'калауд',
    draft.coal_name || draft.coal_id ? null : 'уголь',
    draft.coal_placement_name || draft.coal_placement_id ? null : 'раскладка углей',
    draft.bowl_setup_type_name || draft.bowl_setup_type_id ? null : 'тип забивки',
  ].filter(Boolean) as string[]
}

const buildAutoDraftName = (draft: AgentSetupDraft | null | undefined) => {
  const names = draft?.tobaccos?.map((item) => item.tobacco_name).filter(Boolean) || []
  return names.length ? names.join(' + ') : null
}

const withAutoDraftName = (
  nextDraft: AgentSetupDraft | null,
  previousDraft?: AgentSetupDraft | null,
): AgentSetupDraft | null => {
  if (!nextDraft?.tobaccos?.length) return nextDraft

  const autoName = buildAutoDraftName(nextDraft)
  if (!autoName) return nextDraft

  const previousAutoName = buildAutoDraftName(previousDraft)
  const currentName = normalizeText(nextDraft.name || '')
  const canReplaceName = !currentName ||
    currentName === normalizeText('Новая забивка') ||
    (!!previousAutoName && currentName === normalizeText(previousAutoName))

  return canReplaceName ? { ...nextDraft, name: autoName } : nextDraft
}

const compactSummary = (draft: AgentSetupDraft) => {
  const tobaccos = draft.tobaccos?.map((item) => (
    item.percentage ? `${item.tobacco_name} ${item.percentage}%` : item.tobacco_name
  )).filter(Boolean).join(', ')

  return [
    tobaccos || null,
    draft.bowl_name || null,
    draft.kaloud_name || null,
    draft.coal_name || null,
    draft.coal_placement_name || null,
    draft.bowl_setup_type_name || null,
  ].filter(Boolean) as string[]
}

const buildDraftMixItems = (draft: AgentSetupDraft, tobaccoCatalog: any[]): MixBowlItem[] => (
  draft.tobaccos?.map((item, index) => {
    const tobacco = getCatalogItem(tobaccoCatalog, item.tobacco_id, item.tobacco_name)

    return {
      id: item.tobacco_id || tobacco?.id || `${item.tobacco_name || 'tobacco'}-${index}`,
      name: tobacco?.name || item.tobacco_name || `Табак ${index + 1}`,
      percentage: Number(item.percentage || 0),
      color: MIX_COLORS[index % MIX_COLORS.length],
      photo_url: getItemPhoto(tobacco),
    }
  }) || []
)

const DraftPreview = ({
  draft,
  missing,
  onPublish,
  publishing,
  catalogs,
}: {
  draft: AgentSetupDraft
  missing: string[]
  onPublish?: () => void
  publishing: boolean
  catalogs: Record<CatalogKind, any[]>
}) => {
  const { t } = useTranslation()
  const ready = missing.length === 0
  const summary = compactSummary(draft)
  const mixItems = buildDraftMixItems(draft, catalogs.tobacco)
  const specs = [
    { icon: 'bowl' as const, label: t('agent.kind.bowl'), value: draft.bowl_name, item: getCatalogItem(catalogs.bowl, draft.bowl_id, draft.bowl_name) },
    { icon: 'kaloud' as const, label: t('agent.kind.kaloud'), value: draft.kaloud_name, item: getCatalogItem(catalogs.kaloud, draft.kaloud_id, draft.kaloud_name) },
    { icon: 'coal' as const, label: t('agent.kind.coal'), value: draft.coal_name, item: getCatalogItem(catalogs.coal, draft.coal_id, draft.coal_name) },
    { icon: 'placement' as const, label: t('agent.kind.placement'), value: draft.coal_placement_name, item: getCatalogItem(catalogs.placement, draft.coal_placement_id, draft.coal_placement_name) },
    { icon: 'setupType' as const, label: t('agent.kind.setupType'), value: draft.bowl_setup_type_name, item: getCatalogItem(catalogs.setupType, draft.bowl_setup_type_id, draft.bowl_setup_type_name) },
  ].filter((item) => item.value)
  const hasVisualDraftContent = mixItems.length > 0 || specs.length > 0

  return (
    <DraftShell>
      <DraftHeader>
        <DraftTitle>
          <DraftName>{draft.name || t('agent.draft.noName')}</DraftName>
          <DraftLabel>{t('agent.draft.label')}</DraftLabel>
        </DraftTitle>
        <DraftBadge>
          <CatalogIcon name="feed" size={12} />
          {ready ? t('agent.draft.ready') : t('agent.draft.collecting')}
        </DraftBadge>
      </DraftHeader>

      {hasVisualDraftContent ? (
        <>
          {mixItems.length > 0 && (
            <DraftMixGrid>
              {mixItems.map((item) => (
                <DraftMixRow key={item.id}>
                  <DraftMiniPhoto>
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.name} tw="h-full w-full object-cover" />
                    ) : (
                      <div tw="flex h-full w-full items-center justify-center text-[rgb(var(--color-text-subtle))]">
                        <CatalogIcon name="tobacco" size={18} />
                      </div>
                    )}
                  </DraftMiniPhoto>
                  <div tw="min-w-0">
                    <DraftMixName>{item.name}</DraftMixName>
                    <DraftMixMeta>{t('agent.kind.tobacco')}</DraftMixMeta>
                  </div>
                  <DraftPercent>{item.percentage}%</DraftPercent>
                </DraftMixRow>
              ))}
            </DraftMixGrid>
          )}

          {specs.length > 0 && (
            <DraftSpecGrid>
              {specs.map((item) => (
                <DraftSpec key={item.label}>
                  <DraftSpecPhoto>
                    {getItemPhoto(item.item) ? (
                      <img src={getItemPhoto(item.item)!} alt={item.value || ''} tw="h-full w-full object-cover" />
                    ) : (
                      <div tw="flex h-full w-full items-center justify-center text-[rgb(var(--color-text-subtle))]">
                        <CatalogIcon name={item.icon} size={14} />
                      </div>
                    )}
                  </DraftSpecPhoto>
                  <DraftSpecText>
                    <DraftSpecLabel>{item.label}</DraftSpecLabel>
                    <DraftSpecValue>{item.value}</DraftSpecValue>
                  </DraftSpecText>
                </DraftSpec>
              ))}
            </DraftSpecGrid>
          )}
        </>
      ) : (
        <DraftLine>
          {summary.length ? summary.map((item) => (
            <DraftToken key={item}>{item}</DraftToken>
          )) : (
            <span>{t('agent.draft.empty')}</span>
          )}
        </DraftLine>
      )}

      {!ready && <MissingText tw="mt-2">{t('agent.draft.missing', { fields: missing.join(', ') })}</MissingText>}

      {onPublish && (
        <PublishButton type="button" onClick={onPublish} disabled={!ready || publishing} tw="mt-2">
          <CheckIcon size={14} />
          {publishing ? t('agent.publishing') : t('agent.publish')}
        </PublishButton>
      )}
    </DraftShell>
  )
}

const ChoicePreview = ({
  choice,
  onSelect,
  disabled,
}: {
  choice: CatalogChoiceSnapshot
  onSelect: (kind: CatalogKind, item: any) => void
  disabled: boolean
}) => {
  const { t } = useTranslation()

  return (
  <ChoiceShell>
    <ChoiceHeader>
      <div tw="min-w-0">
        <ChoiceTitle>{t('agent.choiceTitle', { label: t(`agent.kind.${choice.kind}`) })}</ChoiceTitle>
        <ChoiceHint>{t('agent.choiceHint')}</ChoiceHint>
        {choice.missing?.length ? (
          <MissingChips>
            {choice.missing.map((field) => (
              <MissingChip key={field}>{field}</MissingChip>
            ))}
          </MissingChips>
        ) : null}
      </div>
      <span tw="shrink-0 rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]">
        {choice.items.length}
      </span>
    </ChoiceHeader>
    <ChoiceGrid>
      {choice.items.map((item) => {
        const photo = getItemPhoto(item)
        const meta = [
          item?.description,
          typeof item?.price === 'number' ? `${item.price} ${item.price_currency || 'UAH'}` : null,
          typeof item?.capacity_grams === 'number' ? t('agent.grams', { value: item.capacity_grams }) : null,
          typeof item?.package_grams === 'number' ? t('agent.grams', { value: item.package_grams }) : null,
          typeof item?.coal_count === 'number' ? t('agent.coals', { count: item.coal_count }) : null,
        ].filter(Boolean)[0]

        return (
          <ChoiceCard key={item.id || item.name} type="button" onClick={() => onSelect(choice.kind, item)} disabled={disabled}>
            <ChoicePhoto>
              {photo ? (
                <img src={photo} alt={item.name || ''} tw="h-full w-full object-cover" />
              ) : (
                <div tw="flex h-full w-full items-center justify-center text-[22px] font-black text-[rgb(var(--color-text-subtle))]">
                  <CatalogIcon name={choice.kind === 'setupType' ? 'setupType' : choice.kind} size={22} />
                </div>
              )}
            </ChoicePhoto>
            <ChoiceBody>
              <ChoiceName>{item.name}</ChoiceName>
              {meta && <ChoiceMeta>{meta}</ChoiceMeta>}
            </ChoiceBody>
          </ChoiceCard>
        )
      })}
    </ChoiceGrid>
  </ChoiceShell>
  )
}

export const SetupAgentWidget = ({ initialDraft = null, onDraftChange }: SetupAgentWidgetProps) => {
  const { i18n, t } = useTranslation()
  const navigate = useNavigate()
  const savedSession = useMemo(() => readAgentSession(), [])
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<TimelineMessage[]>(savedSession?.messages?.length ? savedSession.messages : createInitialTimelineMessages(t('agent.initialMessage')))
  const [draft, setDraft] = useState<AgentSetupDraft | null>(initialDraft || savedSession?.draft || null)
  const [recording, setRecording] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [typing, setTyping] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [chatWithAgent, chatState] = useChatWithSetupAgentMutation()
  const [transcribeVoice, transcribeState] = useTranscribeSetupVoiceMutation()
  const { data: capabilities } = useGetAgentCapabilitiesQuery()
  const { data: tobaccos = [] } = useGetTobaccosQuery()
  const { data: bowls = [] } = useGetBowlsQuery()
  const { data: kalouds = [] } = useGetKaloudsQuery()
  const { data: coals = [] } = useGetCoalsQuery()
  const { data: placements = [] } = useGetCoalPlacementsQuery()
  const { data: setupTypes = [] } = useGetBowlSetupTypesQuery()
  const missing = useMemo(() => getMissingFields(draft), [draft])
  const catalogs = useMemo<Record<CatalogKind, any[]>>(() => ({
    tobacco: tobaccos,
    bowl: bowls,
    kaloud: kalouds,
    coal: coals,
    placement: placements,
    setupType: setupTypes,
  }), [bowls, coals, kalouds, placements, setupTypes, tobaccos])

  const loading = chatState.isLoading || transcribeState.isLoading
  const busy = loading || typing
  const messageLimit = capabilities?.message_limit || 20
  const usedMessageCount = Math.min(compactApiMessages(messages).length, messageLimit)
  const voiceEnabled = capabilities?.voice_transcription === true
  const draftKey = JSON.stringify(initialDraft || null)
  const activeDraftMessageId = useMemo(
    () => [...messages].reverse().find((message) => message.draftSnapshot)?.id,
    [messages],
  )

  useEffect(() => {
    if (!initialDraft) return
    setDraft(initialDraft)
  }, [draftKey, initialDraft])

  useEffect(() => {
    writeAgentSession(messages, draft)
  }, [draft, messages])

  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
  }, [messages, busy, draft, missing.length])

  const typeAssistantText = async (content: string, trailingMessages: TimelineMessage[] = []) => {
    const id = createMessageId()
    const text = content.trim()

    if (!text) {
      if (trailingMessages.length) {
        setMessages((current) => [...current, ...trailingMessages])
      }
      return
    }

    setTyping(true)
    setMessages((current) => [...current, { id, role: 'assistant', content: '' }])

    const chunkSize = text.length > 120 ? 4 : 2
    for (let index = chunkSize; index <= text.length + chunkSize; index += chunkSize) {
      const visible = text.slice(0, Math.min(index, text.length))
      setMessages((current) => current.map((message) => (
        message.id === id ? { ...message, content: visible } : message
      )))
      await wait(10)
    }

    if (trailingMessages.length) {
      setMessages((current) => [...current, ...trailingMessages])
    }
    setTyping(false)
  }

  const createChoiceMessage = (choice: CatalogChoiceSnapshot): TimelineMessage => ({
    id: createMessageId(),
    role: 'assistant',
    content: '',
    choiceSnapshot: choice,
  })

  const makeDraftMessages = (nextDraft: AgentSetupDraft | null, nextMissing: string[], includeChoice = true) => {
    if (!nextDraft) return []

    const draftMessage: TimelineMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      draftSnapshot: nextDraft,
      missingSnapshot: nextMissing,
    }

    const nextChoice = includeChoice ? buildMissingChoice(nextMissing, catalogs) : null
    if (nextChoice) {
      return [draftMessage, createChoiceMessage(nextChoice)]
    }

    return [draftMessage]
  }

  const buildAgentMessages = (nextMessages: TimelineMessage[], nextDraft: AgentSetupDraft | null) => [
    buildAgentContextMessage(nextDraft, getMissingFields(nextDraft), catalogs),
    ...compactApiMessages(nextMessages),
  ]

  const resolveCatalogChoice = (text: string, preferredKind?: CatalogKind | null) => {
    const kind = getKindFromText(text) || (isShortTobaccoSearch(text) ? 'tobacco' : null)
    const resolvedKind = preferredKind || kind
    if (!resolvedKind) return null
    const wordCount = normalizeText(text).split(' ').filter(Boolean).length
    if (!preferredKind && !isCatalogQuestion(text) && wordCount > 5) return null

    const items = getCatalogItems(resolvedKind, catalogs)
    if (!items.length) return null

    const query = stripKindWords(text, resolvedKind)
    const wantsList = isCatalogQuestion(text) || !query
    const matches = wantsList ? items.slice(0, 9) : searchCatalog(items, query)
    if (!matches.length && !preferredKind && !isCatalogQuestion(text)) return null

    const choice = buildChoiceSnapshot(
      resolvedKind,
      matches.length ? matches : items,
      matches.length
        ? 'Выбери ниже. Карточка останется в чате.'
        : 'Точного совпадения нет. Выбери ближайший вариант из базы.',
    )

    return choice
  }

  const updateDraftWithChoice = (baseDraft: AgentSetupDraft | null, kind: CatalogKind, item: any): AgentSetupDraft => {
    const nextDraft: AgentSetupDraft = { ...(baseDraft || {}) }
    if (kind === 'tobacco') {
      const current = nextDraft.tobaccos || []
      const exists = current.some((entry) => (
        entry.tobacco_id && item.id
          ? entry.tobacco_id === item.id
          : normalizeText(entry.tobacco_name || '') === normalizeText(item.name || '')
      ))
      const nextTobaccos = exists
        ? current
        : [...current, { tobacco_id: item.id, tobacco_name: item.name, percentage: current.length === 0 ? 100 : null }]
      nextDraft.tobaccos = nextTobaccos.length === 1
        ? [{ ...nextTobaccos[0], percentage: 100 }]
        : nextTobaccos.map((entry) => ({ ...entry, percentage: nextTobaccos.length > 1 ? null : entry.percentage }))
      return nextDraft
    }

    if (kind === 'bowl') {
      nextDraft.bowl_id = item.id
      nextDraft.bowl_name = item.name
    }
    if (kind === 'kaloud') {
      nextDraft.kaloud_id = item.id
      nextDraft.kaloud_name = item.name
    }
    if (kind === 'coal') {
      nextDraft.coal_id = item.id
      nextDraft.coal_name = item.name
    }
    if (kind === 'placement') {
      nextDraft.coal_placement_id = item.id
      nextDraft.coal_placement_name = item.name
    }
    if (kind === 'setupType') {
      nextDraft.bowl_setup_type_id = item.id
      nextDraft.bowl_setup_type_name = item.name
    }

    return nextDraft
  }

  const applyCatalogItemsToDraft = (kind: CatalogKind, items: any[], baseDraft: AgentSetupDraft | null) => {
    if (!items.length) return null

    const nextDraft = items.reduce(
      (currentDraft, item) => updateDraftWithChoice(currentDraft, kind, item),
      baseDraft,
    ) as AgentSetupDraft

    return withAutoDraftName(nextDraft, baseDraft)
  }

  const buildDraftFromAgentReply = (reply: string, baseDraft: AgentSetupDraft | null) => {
    let nextDraft = baseDraft
    ;(['tobacco', 'bowl', 'kaloud', 'coal', 'placement', 'setupType'] as CatalogKind[]).forEach((kind) => {
      const matches = findMentionedCatalogItems(getCatalogItems(kind, catalogs), reply)
      if (!matches.length) return
      nextDraft = applyCatalogItemsToDraft(kind, matches, nextDraft)
    })

    return JSON.stringify(nextDraft || null) !== JSON.stringify(baseDraft || null)
      ? withAutoDraftName(nextDraft, baseDraft)
      : null
  }

  const resolveMentionedCatalogItems = (text: string, baseDraft: AgentSetupDraft | null) => {
    const explicitKind = getKindFromText(text)
    const baseMissing = getMissingFields(baseDraft)
    const missingKind = getMissingCatalogKind(baseMissing)
    const kinds: CatalogKind[] = explicitKind
      ? [explicitKind]
      : [
          ...(missingKind ? [missingKind] : []),
          ...(['tobacco', 'bowl', 'kaloud', 'coal', 'placement', 'setupType'] as CatalogKind[]).filter((kind) => kind !== missingKind),
        ]

    for (const kind of kinds) {
      const items = getCatalogItems(kind, catalogs)
      const matches = findMentionedCatalogItems(items, explicitKind ? stripKindWords(text, kind) || text : text)
      if (matches.length) {
        return applyCatalogItemsToDraft(kind, matches, baseDraft)
      }
    }

    return null
  }

  const resolveContextualCatalogChoice = (text: string, baseDraft: AgentSetupDraft | null) => {
    const baseMissing = getMissingFields(baseDraft)
    const missingKind = getMissingCatalogKind(baseMissing)
    if (!missingKind) return null

    const matches = findMentionedCatalogItems(getCatalogItems(missingKind, catalogs), text)
    if (matches.length) {
      return applyCatalogItemsToDraft(missingKind, matches, baseDraft)
    }

    return null
  }

  const applyTitleMessage = (text: string, baseDraft: AgentSetupDraft | null) => {
    const baseMissing = getMissingFields(baseDraft)
    if (!shouldUseAsTitle(baseDraft, baseMissing, text)) return null

    return { ...(baseDraft || {}), name: cleanTitle(text) }
  }

  const resolveLocalDraftUpdate = (text: string): LocalChatResolution | null => {
    if (isStateQuestion(text)) {
      return draft ? { trailingMessages: makeDraftMessages(draft, missing, false) } : {}
    }

    const percentDraft = applyPercentMessage(draft, text)
    if (percentDraft) return { draft: percentDraft }

    const contextualDraft = resolveContextualCatalogChoice(text, draft)
    if (contextualDraft) return { draft: contextualDraft }

    const mentionedDraft = resolveMentionedCatalogItems(text, draft)
    if (mentionedDraft) return { draft: mentionedDraft }

    const titleDraft = applyTitleMessage(text, draft)
    if (titleDraft) return { draft: titleDraft }

    return null
  }

  const resolveLocalQuestion = (text: string): LocalChatResolution | null => {
    if (isMissingQuestion(text)) {
      return draft ? { trailingMessages: makeDraftMessages(draft, missing) } : {}
    }

    if (isPercentQuestion(text)) {
      return draft ? { trailingMessages: makeDraftMessages(draft, missing) } : {}
    }

    if (isMetaQuestion(text)) return {}

    return null
  }

  const resolveLocalCatalogPrompt = (text: string): LocalChatResolution | null => {
    const explicitChoice = resolveCatalogChoice(text)
    if (explicitChoice) return { trailingMessages: [createChoiceMessage(explicitChoice)] }

    const missingKind = draft ? getMissingCatalogKind(missing) : null
    const missingChoice = missingKind ? resolveCatalogChoice(text, missingKind) : null
    if (missingChoice) return { trailingMessages: [createChoiceMessage(missingChoice)] }

    return null
  }

  const resolveLocalUpdate = (text: string): LocalChatResolution => {
    const localDraftUpdate = resolveLocalDraftUpdate(text)
    if (localDraftUpdate) return localDraftUpdate

    const localQuestion = resolveLocalQuestion(text)
    if (localQuestion) return localQuestion

    const localCatalogPrompt = resolveLocalCatalogPrompt(text)
    if (localCatalogPrompt) return localCatalogPrompt

    return {}
  }

  const selectCatalogItem = async (kind: CatalogKind, item: any) => {
    if (busy) return

    const selectedMessage: TimelineMessage = {
      id: createMessageId(),
      role: 'user',
      content: `Выбрал: ${item.name}`,
    }
    const nextMessages = [...messages, selectedMessage]
    setMessages(nextMessages)

    const nextDraft = withAutoDraftName(updateDraftWithChoice(draft, kind, item), draft)!
    setDraft(nextDraft)
    onDraftChange?.(nextDraft)

    try {
      const response = await chatWithAgent({ messages: buildAgentMessages(nextMessages, nextDraft), draft: nextDraft, language: i18n.language as 'ru' | 'uk' | 'en' }).unwrap()
      const responseDraft = explicitDraftFromResponse(nextDraft, response.draft, nextMessages)
      const finalDraft = responseDraft || nextDraft
      const nextMissing = getMissingFields(finalDraft)
      setDraft(finalDraft)
      onDraftChange?.(finalDraft)
      await typeAssistantText(sanitizeAssistantReply(response.reply), makeDraftMessages(finalDraft, nextMissing))
    } catch {
      await typeAssistantText(t('agent.errors.processFailed'))
    }
  }

  const sendText = async (rawText: string) => {
    const text = rawText.trim()
    if (!text || busy) return

    const nextMessages: TimelineMessage[] = [
      ...messages,
      { id: createMessageId(), role: 'user' as const, content: text },
    ]
    setMessages(nextMessages)
    setInput('')

    const localResolution = resolveLocalUpdate(text)
    const draftForAgent = localResolution.draft !== undefined ? withAutoDraftName(localResolution.draft, draft) : draft

    try {
      const response = await chatWithAgent({ messages: buildAgentMessages(nextMessages, draftForAgent || null), draft: draftForAgent, language: i18n.language as 'ru' | 'uk' | 'en' }).unwrap()
      const allowAgentChoices = response.needs_confirmation || isAgentAutofillRequest(text) || isPositiveConfirmation(text)
      const responseDraft = explicitDraftFromResponse(draftForAgent || null, response.draft, nextMessages, allowAgentChoices)
      const replyDraft = allowAgentChoices ? buildDraftFromAgentReply(response.reply, responseDraft || draftForAgent || null) : null
      const nextDraft = replyDraft || responseDraft
      const nextMissing = getMissingFields(nextDraft)
      const draftChanged = JSON.stringify(nextDraft || null) !== JSON.stringify(draft || null)
      setDraft(nextDraft)
      if (nextDraft) onDraftChange?.(nextDraft)

      const trailingMessages = nextDraft && (draftChanged || localResolution.draft !== undefined)
        ? makeDraftMessages(nextDraft, nextMissing)
        : localResolution.trailingMessages || []

      await typeAssistantText(
        sanitizeAssistantReply(response.reply),
        trailingMessages,
      )
    } catch {
      await typeAssistantText(t('agent.errors.processFailed'))
    }
  }

  const publishDraft = async () => {
    if (!draft || missing.length || busy) return

    setPublishing(true)
    const publishMessage = { id: createMessageId(), role: 'user' as const, content: t('agent.publish') }
    const nextMessages = [...messages, publishMessage]
    setMessages(nextMessages)

    try {
      const response = await chatWithAgent({ messages: buildAgentMessages(nextMessages, draft), draft, publish: true, language: i18n.language as 'ru' | 'uk' | 'en' }).unwrap()
      setDraft(response.draft || draft)
      await typeAssistantText(response.reply)
      if (response.created_setup_id) {
        clearAgentSession()
        navigate(`/setups/${response.created_setup_id}`)
      }
    } catch {
      await typeAssistantText(t('agent.errors.publishFailed'))
    } finally {
      setPublishing(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendText(input)
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return
    event.preventDefault()
    void sendText(input)
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const startRecording = async () => {
    if (!voiceEnabled) {
      await typeAssistantText(t('agent.errors.voiceUnavailable'))
      return
    }
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []
    recorderRef.current = recorder

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      setRecording(false)
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      if (!blob.size) return
      try {
        const result = await transcribeVoice(blob).unwrap()
        if (result.text) await sendText(result.text)
      } catch {
        await typeAssistantText(t('agent.errors.transcribeFailed'))
      }
    }

    recorder.start()
    setRecording(true)
  }

  const handleVoice = () => {
    if (recording) {
      stopRecording()
      return
    }
    void startRecording()
  }

  const panel = (
    <ChatPanel aria-label="AI setup chat">
      <PanelBody>
        <Header>
          <div tw="flex min-w-0 items-center gap-3">
            <HeaderMark>
              <CatalogIcon name="setupType" size={22} />
            </HeaderMark>
            <div tw="min-w-0">
              <Title>{t('agent.title')}</Title>
              <Subtitle>{recording ? t('agent.recordingSubtitle') : t('agent.subtitle')}</Subtitle>
            </div>
          </div>
          <StatusPill>
            <span tw="h-1.5 w-1.5 rounded-full bg-[rgb(var(--color-accent))]" />
            {usedMessageCount}/{messageLimit}
          </StatusPill>
        </Header>

        <ScrollArea ref={scrollRef}>
          <Messages>
            {messages.map((message) => (
              <Fragment key={message.id}>
                {message.content && (
                  <Bubble $mine={message.role === 'user'}>
                    {message.content}
                  </Bubble>
                )}
                {message.draftSnapshot && (
                  <DraftPreview
                    draft={message.draftSnapshot}
                    missing={message.missingSnapshot || getMissingFields(message.draftSnapshot)}
                    onPublish={message.id === activeDraftMessageId ? publishDraft : undefined}
                    publishing={publishing}
                    catalogs={catalogs}
                  />
                )}
                {message.choiceSnapshot && (
                  <ChoicePreview
                    choice={message.choiceSnapshot}
                    onSelect={selectCatalogItem}
                    disabled={busy}
                  />
                )}
              </Fragment>
            ))}
            {loading && <TypingBubble>{t('agent.typing')}</TypingBubble>}
          </Messages>
        </ScrollArea>

        <Composer onSubmit={handleSubmit}>
          <ToolButton
            type="button"
            onClick={handleVoice}
            disabled={busy || !voiceEnabled}
            aria-label={voiceEnabled ? t('agent.recordVoice') : t('agent.voiceUnavailable')}
            title={voiceEnabled ? t('agent.recordVoice') : t('agent.voiceUnavailable')}
          >
            {recording ? <CloseIcon size={13} /> : <MicIcon size={16} />}
          </ToolButton>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder={t('agent.placeholder')}
            disabled={busy}
          />
          <SendButton type="submit" disabled={!input.trim() || busy} aria-label={t('agent.send')}>
            <SendIcon size={16} />
          </SendButton>
        </Composer>
      </PanelBody>
    </ChatPanel>
  )

  return panel
}
