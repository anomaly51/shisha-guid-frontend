import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'
import {
  type AgentMessage,
  type AgentSetupDraft,
  useChatWithSetupAgentMutation,
  useGetBowlsQuery,
  useGetBowlSetupTypesQuery,
  useGetCoalsQuery,
  useGetCoalPlacementsQuery,
  useGetKaloudsQuery,
  useGetTobaccosQuery,
  useTranscribeSetupVoiceMutation,
} from '../shared/api'
import { CatalogIcon, CheckIcon, CloseIcon, ExpandIcon, MicIcon, SendIcon } from '../shared/ui/Icons'

const ChatPanel = styled.section<{ $expanded?: boolean }>`
  ${tw`flex overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-2xl`}
  border-radius: 8px;
  box-shadow: 0 26px 58px -34px rgba(83, 48, 31, 0.75), 0 10px 28px -20px rgba(0, 0, 0, 0.32);
  height: ${({ $expanded }) => ($expanded ? 'calc(100vh - 2rem)' : 'min(760px, calc(100vh - 12rem))')};
  min-height: ${({ $expanded }) => ($expanded ? 'min(44rem, calc(100vh - 2rem))' : '560px')};
  position: ${({ $expanded }) => ($expanded ? 'fixed' : 'relative')};
  right: ${({ $expanded }) => ($expanded ? '1rem' : 'auto')};
  bottom: ${({ $expanded }) => ($expanded ? '1rem' : 'auto')};
  width: ${({ $expanded }) => ($expanded ? 'min(72rem, calc(100vw - 2rem))' : '100%')};
  z-index: ${({ $expanded }) => ($expanded ? 60 : 'auto')};

  @media (max-width: 640px) {
    height: ${({ $expanded }) => ($expanded ? 'calc(100vh - 2rem)' : 'calc(100vh - 10rem)')};
    min-height: 520px;
  }
`

const Header = tw.div`flex items-start justify-between gap-3 border-b border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-4 py-3`
const Title = tw.h2`text-[15px] font-black leading-snug text-[rgb(var(--color-text))]`
const Subtitle = tw.div`mt-0.5 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]`
const PanelBody = tw.div`flex min-h-0 flex-1 flex-col`
const ScrollArea = tw.div`min-h-0 flex-1 overflow-y-auto`
const Messages = tw.div`flex min-h-full flex-col justify-end gap-2 px-3 py-3 sm:px-4`
const Composer = tw.form`flex items-end gap-2 border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3`
const Textarea = tw.textarea`min-h-[2.75rem] max-h-28 flex-1 resize-none rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 py-2 text-[13px] font-semibold leading-5 text-[rgb(var(--color-text))] outline-none transition placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)] disabled:opacity-60`
const IconButton = tw.button`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-accent))]`
const ToolButton = tw.button`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50`
const SendButton = tw.button`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-inverse))] shadow-[0_14px_26px_-20px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`

const Bubble = styled.div<{ $mine?: boolean }>`
  ${tw`max-w-[88%] rounded-lg px-3 py-2 text-[13px] font-semibold leading-5`}
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  color: ${({ $mine }) => ($mine ? 'rgb(var(--color-text-inverse))' : 'rgb(var(--color-text))')};
  background: ${({ $mine }) => ($mine ? 'rgb(var(--color-surface-inverse))' : 'rgb(var(--color-surface-muted))')};
`

const TypingBubble = tw.div`max-w-[88%] self-start rounded-lg bg-[rgb(var(--color-surface-muted))] px-3 py-2 text-[13px] font-semibold leading-5 text-[rgb(var(--color-text-subtle))]`
const MissingChips = tw.div`mt-2 flex flex-wrap gap-1.5`
const MissingChip = tw.span`inline-flex h-6 items-center rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftShell = tw.div`w-full max-w-[620px] self-start rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-2.5 shadow-[var(--shadow-card)]`
const DraftHeader = tw.div`flex items-start justify-between gap-3`
const DraftTitle = tw.div`min-w-0`
const DraftName = tw.div`truncate text-[14px] font-black text-[rgb(var(--color-text))]`
const DraftLabel = tw.div`mt-0.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DraftBadge = tw.span`inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftLine = tw.div`mt-2 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[rgb(var(--color-text-muted))]`
const DraftToken = tw.span`inline-flex max-w-full items-center gap-1 rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1`
const PublishButton = tw.button`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-accent))] px-4 text-[12px] font-black text-[rgb(var(--color-text-inverse))] shadow-[0_16px_28px_-22px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`
const MissingText = tw.div`text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`
const ChoiceShell = tw.div`w-full max-w-[620px] self-start rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] p-2.5 shadow-[var(--shadow-card)]`
const ChoiceHeader = tw.div`mb-2 flex items-start justify-between gap-3`
const ChoiceTitle = tw.div`text-[13px] font-black text-[rgb(var(--color-text))]`
const ChoiceHint = tw.div`mt-0.5 text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`
const ChoiceGrid = tw.div`grid gap-1.5`
const ChoiceCard = tw.button`grid min-w-0 grid-cols-[42px_minmax(0,1fr)] items-center gap-2 rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-1.5 text-left transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] disabled:cursor-not-allowed disabled:opacity-60`
const ChoicePhoto = tw.div`h-[42px] w-[42px] overflow-hidden rounded-md bg-[rgb(var(--color-surface-muted))]`
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

const initialMessages: AgentMessage[] = [
  {
    role: 'assistant',
    content: 'Расскажи, какую забивку хочешь. Можно коротко: вкус, табаки, чаша, калауд, уголь или раскладка углей. Я соберу черновик и потом спрошу только то, чего не хватает.',
  },
]

const initialTimelineMessages: TimelineMessage[] = initialMessages.map((message, index) => ({
  ...message,
  id: `initial-${index}`,
}))

const createMessageId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`

const compactApiMessages = (messages: TimelineMessage[]): AgentMessage[] => (
  messages
    .filter((message) => message.role === 'user' || message.content.trim())
    .map(({ role, content }) => ({ role, content }))
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
  }
  return normalizeText(value).split('').map((char) => map[char] || char).join('')
}

const searchableText = (value: string) => `${normalizeText(value)} ${transliterateRu(value)}`

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

const buildDraftReply = (draft: AgentSetupDraft | null, missing: string[], fallback: string) => {
  if (!draft) return fallback
  if (missing.length) {
    return `Не хватает: ${missing.join(', ')}.`
  }

  return 'Черновик готов. Проверь карточку ниже и можно публиковать.'
}

const labelByKind: Record<CatalogKind, string> = {
  tobacco: 'табак',
  bowl: 'чашу',
  kaloud: 'калауд',
  coal: 'уголь',
  placement: 'раскладку углей',
  setupType: 'тип забивки',
}

const titleByKind: Record<CatalogKind, string> = {
  tobacco: 'Табаки в базе',
  bowl: 'Чаши в базе',
  kaloud: 'Калауды в базе',
  coal: 'Уголь в базе',
  placement: 'Раскладки углей',
  setupType: 'Типы забивки',
}

const questionPatterns: Array<{ kind: CatalogKind; words: string[] }> = [
  { kind: 'tobacco', words: ['табак', 'табаки', 'тютюн', 'тютюни'] },
  { kind: 'bowl', words: ['чаша', 'чаши', 'чашу'] },
  { kind: 'kaloud', words: ['калауд', 'калауды', 'kaloud', 'lotus'] },
  { kind: 'coal', words: ['уголь', 'угли', 'угольки', 'coal'] },
  { kind: 'placement', words: ['раскладка', 'расположение', 'углей', 'cheburashka'] },
  { kind: 'setupType', words: ['тип', 'забивки', 'compot', 'компот'] },
]

const catalogQuestionWords = ['какие', 'какой', 'какая', 'что есть', 'есть', 'покажи', 'показать', 'список', 'варианты', 'выбрать']
const metaQuestionWords = ['что это', 'че это', 'зачем', 'кто ты', 'что умеешь', 'как работает', 'помоги', 'help']

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

const isShortTobaccoSearch = (text: string) => {
  const normalized = normalizeText(text)
  const wordCount = normalized.split(' ').filter(Boolean).length
  if (!normalized || wordCount > 3) return false
  if (isMetaQuestion(text) || getKindFromText(text)) return false
  if (/^\d+%?$/.test(normalized)) return false
  return true
}

const getItemText = (item: any) => searchableText(`${item?.name || ''} ${item?.description || ''}`)

const searchCatalog = (items: any[], query: string) => {
  const tokens = searchableText(query).split(' ').filter((token) => token.length > 2)
  if (!tokens.length) return items.slice(0, 9)

  return items
    .map((item) => {
      const text = getItemText(item)
      const score = tokens.reduce((sum, token) => sum + (text.includes(token) ? 1 : 0), 0)
      return { item, score }
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item)
    .slice(0, 9)
}

const buildChoiceSnapshot = (kind: CatalogKind, items: any[], hint?: string, missing?: string[]): CatalogChoiceSnapshot | null => {
  if (!items.length) return null

  return {
    kind,
    title: `Выбери ${labelByKind[kind]}`,
    hint: hint || 'Нажми на вариант, я добавлю его в черновик.',
    items: items.slice(0, 9),
    missing,
  }
}

const getCatalogItems = (kind: CatalogKind, catalogs: Record<CatalogKind, any[]>) => catalogs[kind] || []

const buildMissingChoice = (missing: string[], catalogs: Record<CatalogKind, any[]>) => {
  const missingKind = missing.includes('табак')
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

  return missingKind
    ? buildChoiceSnapshot(missingKind, getCatalogItems(missingKind, catalogs), 'Нажми на вариант, я добавлю его в черновик.', missing)
    : null
}

const chatIntro = 'Это чат для сборки забивки. Можешь писать обычным языком: "яблоко", "какие чаши есть", "добавь Rosomaha", "уголь Cocoloco". Я покажу варианты из базы, соберу черновик и буду коротко говорить, чего еще не хватает.'

const explicitDraftFromResponse = (
  previousDraft: AgentSetupDraft | null,
  responseDraft: AgentSetupDraft | null | undefined,
  messages: TimelineMessage[],
): AgentSetupDraft | null => {
  if (!responseDraft) return previousDraft

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

  return hasDraftValue(nextDraft) ? nextDraft : null
}

const applyPercentMessage = (draft: AgentSetupDraft | null, text: string): AgentSetupDraft | null => {
  if (!draft?.tobaccos?.length) return null
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

const DraftPreview = ({
  draft,
  missing,
  onPublish,
  publishing,
}: {
  draft: AgentSetupDraft
  missing: string[]
  onPublish?: () => void
  publishing: boolean
}) => {
  const ready = missing.length === 0
  const summary = compactSummary(draft)

  return (
    <DraftShell>
      <DraftHeader>
        <DraftTitle>
          <DraftName>{draft.name || 'Название не указано'}</DraftName>
          <DraftLabel>Черновик, не опубликовано</DraftLabel>
        </DraftTitle>
        <DraftBadge>
          <CatalogIcon name="feed" size={12} />
          {ready ? 'готово' : 'сбор'}
        </DraftBadge>
      </DraftHeader>

      <DraftLine>
        {summary.length ? summary.map((item) => (
          <DraftToken key={item}>{item}</DraftToken>
        )) : (
          <span>Пока ничего не выбрано</span>
        )}
      </DraftLine>

      {!ready && <MissingText tw="mt-2">Не хватает: {missing.join(', ')}.</MissingText>}

      {onPublish && (
        <PublishButton type="button" onClick={onPublish} disabled={!ready || publishing} tw="mt-2">
          <CheckIcon size={14} />
          {publishing ? 'Публикую' : 'Опубликовать'}
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
}) => (
  <ChoiceShell>
    <ChoiceHeader>
      <div tw="min-w-0">
        <ChoiceTitle>{choice.title}</ChoiceTitle>
        <ChoiceHint>{choice.hint}</ChoiceHint>
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
        const photo = item?.photo_urls?.[0]
        const meta = [
          item?.description,
          typeof item?.price === 'number' ? `${item.price} ${item.price_currency || 'UAH'}` : null,
          typeof item?.capacity_grams === 'number' ? `${item.capacity_grams} г` : null,
          typeof item?.package_grams === 'number' ? `${item.package_grams} г` : null,
          typeof item?.coal_count === 'number' ? `${item.coal_count} угля` : null,
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

export const SetupAgentWidget = ({ initialDraft = null, onDraftChange }: SetupAgentWidgetProps) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<TimelineMessage[]>(initialTimelineMessages)
  const [draft, setDraft] = useState<AgentSetupDraft | null>(initialDraft)
  const [recording, setRecording] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [typing, setTyping] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [chatWithAgent, chatState] = useChatWithSetupAgentMutation()
  const [transcribeVoice, transcribeState] = useTranscribeSetupVoiceMutation()
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
    const node = scrollRef.current
    if (!node) return
    requestAnimationFrame(() => {
      node.scrollTop = node.scrollHeight
    })
  }, [messages, busy, draft, missing.length])

  const typeAssistantText = async (content: string, trailingMessages: TimelineMessage[] = []) => {
    const id = createMessageId()
    const text = content.trim()

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

  const makeDraftMessages = (nextDraft: AgentSetupDraft | null, nextMissing: string[]) => {
    if (!nextDraft) return []

    const nextChoice = buildMissingChoice(nextMissing, catalogs)
    if (nextChoice) {
      return [{
        id: createMessageId(),
        role: 'assistant' as const,
        content: '',
        choiceSnapshot: nextChoice,
      }]
    }

    const draftMessage: TimelineMessage = {
      id: createMessageId(),
      role: 'assistant',
      content: '',
      draftSnapshot: nextDraft,
      missingSnapshot: nextMissing,
    }
    return [draftMessage]
  }

  const handleCatalogMessage = async (text: string) => {
    const kind = getKindFromText(text) || (isShortTobaccoSearch(text) ? 'tobacco' : null)
    if (!kind) return false
    const wordCount = normalizeText(text).split(' ').filter(Boolean).length
    if (!isCatalogQuestion(text) && wordCount > 5) return false

    const items = getCatalogItems(kind, catalogs)
    if (!items.length) {
      await typeAssistantText(`Каталог "${titleByKind[kind]}" пока не загрузился или пустой.`)
      return true
    }

    const query = stripKindWords(text, kind)
    const wantsList = isCatalogQuestion(text) || !query
    const matches = wantsList ? items.slice(0, 9) : searchCatalog(items, query)
    const choice = buildChoiceSnapshot(
      kind,
      matches.length ? matches : items,
      matches.length
        ? 'Нажми на вариант, я добавлю его в черновик.'
        : `Точного совпадения нет. Выбери ближайший вариант из базы.`,
    )

    if (!choice) return false

    await typeAssistantText(
      matches.length
        ? `${titleByKind[kind]}: выбери подходящий вариант.`
        : `Не нашел "${query || text}" в базе. Показываю доступные варианты.`,
      [{
        id: createMessageId(),
        role: 'assistant',
        content: '',
        choiceSnapshot: choice,
      }],
    )
    return true
  }

  const updateDraftWithChoice = (kind: CatalogKind, item: any): AgentSetupDraft => {
    const nextDraft: AgentSetupDraft = { ...(draft || {}) }
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

  const selectCatalogItem = async (kind: CatalogKind, item: any) => {
    if (busy) return

    const selectedMessage: TimelineMessage = {
      id: createMessageId(),
      role: 'user',
      content: `Выбрал: ${item.name}`,
    }
    setMessages((current) => [...current, selectedMessage])

    const nextDraft = updateDraftWithChoice(kind, item)
    const nextMissing = getMissingFields(nextDraft)
    setDraft(nextDraft)
    onDraftChange?.(nextDraft)

    await typeAssistantText(
      `${item.name} добавлен. ${kind === 'tobacco' && nextDraft.tobaccos?.length === 1 ? 'Поставил 100%, потому что табак один. ' : ''}${buildDraftReply(nextDraft, nextMissing, '')}`,
      makeDraftMessages(nextDraft, nextMissing),
    )
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

    if (isMetaQuestion(text)) {
      await typeAssistantText(chatIntro)
      return
    }

    const percentDraft = applyPercentMessage(draft, text)
    if (percentDraft) {
      const nextMissing = getMissingFields(percentDraft)
      setDraft(percentDraft)
      onDraftChange?.(percentDraft)
      await typeAssistantText(buildDraftReply(percentDraft, nextMissing, ''), makeDraftMessages(percentDraft, nextMissing))
      return
    }

    if (await handleCatalogMessage(text)) return

    try {
      const response = await chatWithAgent({ messages: compactApiMessages(nextMessages), draft }).unwrap()
      const nextDraft = explicitDraftFromResponse(draft, response.draft, nextMessages)
      const nextMissing = getMissingFields(nextDraft)
      const draftChanged = JSON.stringify(nextDraft || null) !== JSON.stringify(draft || null)
      setDraft(nextDraft)
      if (nextDraft) onDraftChange?.(nextDraft)
      await typeAssistantText(
        draftChanged ? buildDraftReply(nextDraft, nextMissing, response.reply) : response.reply,
        draftChanged ? makeDraftMessages(nextDraft, nextMissing) : [],
      )
    } catch {
      await typeAssistantText('Не получилось обработать запрос. Проверь авторизацию и попробуй еще раз.')
    }
  }

  const publishDraft = async () => {
    if (!draft || missing.length || busy) return

    setPublishing(true)
    const publishMessage = { id: createMessageId(), role: 'user' as const, content: 'Опубликовать черновик' }
    const nextMessages = [...messages, publishMessage]
    setMessages(nextMessages)

    try {
      const response = await chatWithAgent({ messages: compactApiMessages(nextMessages), draft, publish: true }).unwrap()
      setDraft(response.draft || draft)
      await typeAssistantText(response.reply)
      if (response.created_setup_id) {
        navigate(`/setups/${response.created_setup_id}`)
      }
    } catch {
      await typeAssistantText('Не получилось опубликовать черновик. Проверь данные и попробуй еще раз.')
    } finally {
      setPublishing(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void sendText(input)
  }

  const stopRecording = () => {
    recorderRef.current?.stop()
  }

  const startRecording = async () => {
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
        await typeAssistantText('Не получилось распознать голос. Попробуй текстом.')
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
    <ChatPanel $expanded={expanded} aria-label="AI setup chat">
      <PanelBody>
        <Header>
          <div tw="min-w-0">
            <Title>Новая забивка</Title>
            <Subtitle>{recording ? 'Идет запись голоса' : 'Чат соберет черновик и спросит только недостающие поля'}</Subtitle>
          </div>
          <div tw="flex shrink-0 items-center gap-1.5">
            <IconButton type="button" onClick={() => setExpanded((value) => !value)} aria-label="Expand setup agent">
              <ExpandIcon />
            </IconButton>
          </div>
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
            {loading && <TypingBubble>Печатает...</TypingBubble>}
          </Messages>
        </ScrollArea>

        <Composer onSubmit={handleSubmit}>
          <ToolButton type="button" onClick={handleVoice} disabled={busy} aria-label="Record voice">
            {recording ? <CloseIcon size={13} /> : <MicIcon size={16} />}
          </ToolButton>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Например: хочу свежую ягодную забивку, 2-3 табака, легко по крепости..."
            disabled={busy}
          />
          <SendButton type="submit" disabled={!input.trim() || busy} aria-label="Send setup details">
            <SendIcon size={16} />
          </SendButton>
        </Composer>
      </PanelBody>
    </ChatPanel>
  )

  return panel
}
