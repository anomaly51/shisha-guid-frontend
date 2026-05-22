import { Fragment, FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'
import {
  type AgentMessage,
  type AgentSetupDraft,
  useChatWithSetupAgentMutation,
  useTranscribeSetupVoiceMutation,
} from '../shared/api'
import { CatalogIcon, CheckIcon, CloseIcon, ExpandIcon, MicIcon, SendIcon } from '../shared/ui/Icons'
import { MIX_COLORS, type MixBowlItem } from '../shared/ui/MixBowlPreview'

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

const ThinkingBox = tw.div`max-w-[92%] self-start rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3`
const MissingChips = tw.div`mt-2 flex flex-wrap gap-1.5`
const MissingChip = tw.span`inline-flex h-7 items-center rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface))] px-2 text-[11px] font-black text-[rgb(var(--color-text-muted))]`
const DraftShell = tw.div`w-full max-w-[620px] self-start overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-card)]`
const DraftHeader = tw.div`flex items-start justify-between gap-3 border-b border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-3 py-2.5`
const DraftTitle = tw.div`min-w-0`
const DraftName = tw.div`truncate text-[14px] font-black text-[rgb(var(--color-text))]`
const DraftLabel = tw.div`mt-0.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DraftBadge = tw.span`inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftContent = tw.div`grid gap-2.5 p-3`
const TobaccoList = tw.div`grid gap-1.5`
const DetailGrid = tw.div`grid grid-cols-1 gap-1.5 sm:grid-cols-2`
const DetailItem = tw.div`grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2 rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-2 py-1.5`
const DetailLabel = tw.div`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DetailValue = tw.div`truncate text-[12px] font-black text-[rgb(var(--color-text))]`
const PublishButton = tw.button`inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-accent))] px-4 text-[12px] font-black text-[rgb(var(--color-text-inverse))] shadow-[0_16px_28px_-22px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`
const MissingText = tw.div`text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`
const MissingPanel = tw.div`rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-2.5`

type SetupAgentWidgetProps = {
  initialDraft?: AgentSetupDraft | null
  onDraftChange?: (draft: AgentSetupDraft) => void
}

type TimelineMessage = AgentMessage & {
  id: string
  draftSnapshot?: AgentSetupDraft | null
  missingSnapshot?: string[]
}

const chatStages = [
  'Читаю, какую забивку ты хочешь получить',
  'Раскладываю запрос на табаки, оборудование и тип укладки',
  'Сверяю найденное с каталогом',
  'Обновляю черновик и отмечаю, чего ещё не хватает',
]

const voiceStages = [
  'Готовлю запись',
  'Распознаю голос',
  'Очищаю текст',
  'Передаю описание агенту',
]

const publishStages = [
  'Проверяю обязательные поля',
  'Фиксирую состав табаков',
  'Создаю забивку',
  'Открываю опубликованную карточку',
]

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
    .slice(-12)
)

const normalizeText = (value: string) => (
  value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}%]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
)

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
    return `Черновик обновлен. Не хватает: ${missing.join(', ')}. Напиши недостающие параметры сообщением.`
  }

  return 'Черновик готов. Проверь карточку ниже и можно публиковать.'
}

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

  if (mergedTobaccos.length) nextDraft.tobaccos = mergedTobaccos

  return hasDraftValue(nextDraft) ? nextDraft : null
}

const getMissingFields = (draft: AgentSetupDraft | null) => {
  if (!draft) return []

  const tobaccoTotal = draft.tobaccos?.reduce((sum, item) => sum + Number(item.percentage || 0), 0) || 0

  return [
    draft.name ? null : 'название',
    draft.tobaccos?.length ? null : 'табак',
    draft.tobaccos?.length && tobaccoTotal === 100 ? null : 'проценты табаков',
    draft.bowl_name || draft.bowl_id ? null : 'чаша',
    draft.kaloud_name || draft.kaloud_id ? null : 'калауд',
    draft.coal_name || draft.coal_id ? null : 'уголь',
    draft.coal_placement_name || draft.coal_placement_id ? null : 'раскладка углей',
    draft.bowl_setup_type_name || draft.bowl_setup_type_id ? null : 'тип забивки',
  ].filter(Boolean) as string[]
}

const buildPreviewItems = (draft: AgentSetupDraft | null): MixBowlItem[] => (
  draft?.tobaccos?.map((item, index) => ({
    id: item.tobacco_id || `${item.tobacco_name || 'tobacco'}-${index}`,
    name: item.tobacco_name || `Табак ${index + 1}`,
    percentage: Number(item.percentage || 0),
    color: MIX_COLORS[index % MIX_COLORS.length],
  })) || []
)

const ThinkingMessage = ({ currentIndex, stages }: { currentIndex: number; stages: string[] }) => (
  <ThinkingBox>
    <div tw="mb-2 flex items-center justify-between gap-3">
      <div tw="text-[12px] font-black text-[rgb(var(--color-text))]">ИИ думает по шагам</div>
      <div tw="text-[11px] font-bold text-[rgb(var(--color-text-subtle))] tabular-nums">
        {Math.min(currentIndex + 1, stages.length)}/{stages.length}
      </div>
    </div>
    <div tw="grid gap-1.5">
      {stages.map((stage, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <div
            key={stage}
            tw="flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] font-semibold"
            css={active ? { backgroundColor: 'rgb(var(--color-surface))', color: 'rgb(var(--color-text))' } : { color: 'rgb(var(--color-text-subtle))' }}
          >
            <span
              tw="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px]"
              css={done
                ? { borderColor: 'rgb(var(--color-success-border))', backgroundColor: 'rgb(var(--color-success-surface))', color: 'rgb(var(--color-success))' }
                : active
                  ? { borderColor: 'rgb(var(--color-accent))', color: 'rgb(var(--color-accent))' }
                  : { borderColor: 'rgb(var(--color-border-strong))' }}
            >
              {done ? <CheckIcon size={9} /> : index + 1}
            </span>
            <span tw="min-w-0 truncate">{stage}</span>
          </div>
        )
      })}
    </div>
  </ThinkingBox>
)

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
  const items = useMemo(() => buildPreviewItems(draft), [draft])
  const total = items.reduce((sum, item) => sum + item.percentage, 0)
  const ready = missing.length === 0

  const details = [
    { icon: 'bowl' as const, label: 'Чаша', value: draft.bowl_name },
    { icon: 'kaloud' as const, label: 'Калауд', value: draft.kaloud_name },
    { icon: 'coal' as const, label: 'Уголь', value: draft.coal_name },
    { icon: 'placement' as const, label: 'Расположение углей', value: draft.coal_placement_name },
    { icon: 'setupType' as const, label: 'Тип', value: draft.bowl_setup_type_name },
  ]

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

      <DraftContent>
        <div>
          <div tw="mb-1.5 flex items-center justify-between gap-2">
            <div tw="text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]">Состав</div>
            <span tw="text-[10px] font-black text-[rgb(var(--color-text-muted))] tabular-nums">{total || 0}%</span>
          </div>
          {items.length ? (
            <TobaccoList>
              {items.map((item) => (
                <div key={item.id} tw="flex items-center gap-2 rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1.5">
                  <span tw="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span tw="min-w-0 flex-1 truncate text-[12px] font-black text-[rgb(var(--color-text))]">{item.name}</span>
                  <span tw="shrink-0 text-[12px] font-black text-[rgb(var(--color-accent))] tabular-nums">
                    {item.percentage ? `${item.percentage}%` : '?'}
                  </span>
                </div>
              ))}
            </TobaccoList>
          ) : (
            <MissingText>Добавь хотя бы один табак сообщением или голосом.</MissingText>
          )}
        </div>

        {draft.description && (
          <div tw="rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-2 text-[12px] font-semibold leading-5 text-[rgb(var(--color-text-muted))]">
            {draft.description}
          </div>
        )}

        <DetailGrid>
          {details.map((detail) => (
            <DetailItem key={detail.label}>
              <DetailLabel>
                <CatalogIcon name={detail.icon} size={12} />
                {detail.label}
              </DetailLabel>
              <DetailValue>{detail.value || 'Не выбрано'}</DetailValue>
            </DetailItem>
          ))}
        </DetailGrid>

        {!ready && (
          <MissingPanel>
            <div tw="flex items-start justify-between gap-3">
              <div tw="min-w-0">
                <div tw="text-[12px] font-black text-[rgb(var(--color-text))]">Нужно уточнить</div>
                <MissingText>Напиши недостающие параметры сообщением. Я обновлю черновик новым виджетом в истории.</MissingText>
              </div>
              <span tw="shrink-0 rounded-md bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]">
                {missing.length}
              </span>
            </div>
            <MissingChips>
              {missing.map((field) => (
                <MissingChip key={field}>{field}</MissingChip>
              ))}
            </MissingChips>
          </MissingPanel>
        )}

        {onPublish ? (
          <PublishButton type="button" onClick={onPublish} disabled={!ready || publishing}>
            <CheckIcon size={14} />
            {publishing ? 'Публикую' : 'Опубликовать'}
          </PublishButton>
        ) : (
          <MissingText>
            Черновик применен к форме. Проверь выбранные поля и опубликуй забивку кнопкой формы.
          </MissingText>
        )}
      </DraftContent>
    </DraftShell>
  )
}

export const SetupAgentWidget = ({ initialDraft = null, onDraftChange }: SetupAgentWidgetProps) => {
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<TimelineMessage[]>(initialTimelineMessages)
  const [draft, setDraft] = useState<AgentSetupDraft | null>(initialDraft)
  const [recording, setRecording] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [chatWithAgent, chatState] = useChatWithSetupAgentMutation()
  const [transcribeVoice, transcribeState] = useTranscribeSetupVoiceMutation()
  const missing = useMemo(() => getMissingFields(draft), [draft])

  const busy = chatState.isLoading || transcribeState.isLoading
  const stages = transcribeState.isLoading ? voiceStages : publishing ? publishStages : chatStages
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

  useEffect(() => {
    if (!busy) {
      setStageIndex(0)
      return undefined
    }

    setStageIndex(0)
    const interval = window.setInterval(() => {
      setStageIndex((current) => Math.min(current + 1, stages.length - 1))
    }, 850)

    return () => window.clearInterval(interval)
  }, [busy, stages.length])

  const sendText = async (rawText: string) => {
    const text = rawText.trim()
    if (!text || chatState.isLoading) return

    const nextMessages: TimelineMessage[] = [
      ...messages,
      { id: createMessageId(), role: 'user' as const, content: text },
    ]
    setMessages(nextMessages)
    setInput('')

    try {
      const response = await chatWithAgent({ messages: compactApiMessages(nextMessages), draft }).unwrap()
      const nextDraft = explicitDraftFromResponse(draft, response.draft, nextMessages)
      const nextMissing = getMissingFields(nextDraft)
      setDraft(nextDraft)
      if (nextDraft) onDraftChange?.(nextDraft)
      setMessages([
        ...nextMessages,
        { id: createMessageId(), role: 'assistant', content: buildDraftReply(nextDraft, nextMissing, response.reply) },
        ...(nextDraft
          ? [{
              id: createMessageId(),
              role: 'assistant' as const,
              content: '',
              draftSnapshot: nextDraft,
              missingSnapshot: nextMissing,
            }]
          : []),
      ])
    } catch {
      setMessages([...nextMessages, {
        id: createMessageId(),
        role: 'assistant',
        content: 'Не получилось обработать запрос. Проверь авторизацию и попробуй еще раз.',
      }])
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
      setMessages([...nextMessages, { id: createMessageId(), role: 'assistant', content: response.reply }])
      if (response.created_setup_id) {
        navigate(`/setups/${response.created_setup_id}`)
      }
    } catch {
      setMessages([...nextMessages, {
        id: createMessageId(),
        role: 'assistant',
        content: 'Не получилось опубликовать черновик. Проверь данные и попробуй еще раз.',
      }])
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
        setMessages([...messages, {
          id: createMessageId(),
          role: 'assistant',
          content: 'Не получилось распознать голос. Попробуй текстом.',
        }])
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
              </Fragment>
            ))}
            {busy && <ThinkingMessage currentIndex={stageIndex} stages={stages} />}
          </Messages>
        </ScrollArea>

        <Composer onSubmit={handleSubmit}>
          <ToolButton type="button" onClick={handleVoice} disabled={transcribeState.isLoading || chatState.isLoading} aria-label="Record voice">
            {recording ? <CloseIcon size={13} /> : <MicIcon size={16} />}
          </ToolButton>
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Например: хочу свежую ягодную забивку, 2-3 табака, легко по крепости..."
            disabled={chatState.isLoading}
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
