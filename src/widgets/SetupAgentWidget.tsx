import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'
import {
  type AgentMessage,
  type AgentSetupDraft,
  useChatWithSetupAgentMutation,
  useTranscribeSetupVoiceMutation,
} from '../shared/api'
import { CatalogIcon, CheckIcon, CloseIcon, MicIcon, PlusIcon, SendIcon } from '../shared/ui/Icons'
import {
  MIX_COLORS,
  MixBowlPreview,
  detectBowlModel,
  detectSetupKind,
  type MixBowlItem,
} from '../shared/ui/MixBowlPreview'

const Shell = styled.div`
  ${tw`fixed z-50 flex flex-col items-end gap-3`}
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
`

const ChatPanel = styled.section`
  ${tw`flex max-h-[min(44rem,calc(100vh-6rem))] w-[min(calc(100vw-1.25rem),30rem)] overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-2xl`}
  border-radius: 8px;
  box-shadow: 0 26px 58px -34px rgba(83, 48, 31, 0.75), 0 10px 28px -20px rgba(0, 0, 0, 0.32);
`

const Header = tw.div`flex items-start justify-between gap-3 border-b border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] px-4 py-3`
const Title = tw.h2`text-[15px] font-black leading-snug text-[rgb(var(--color-text))]`
const Subtitle = tw.div`mt-0.5 text-[11px] font-semibold text-[rgb(var(--color-text-subtle))]`
const PanelBody = tw.div`flex min-h-0 flex-1 flex-col`
const ScrollArea = tw.div`min-h-0 flex-1 overflow-y-auto`
const Messages = tw.div`flex min-h-[12rem] flex-col gap-2 px-4 py-3`
const Composer = tw.form`flex items-end gap-2 border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3`
const Textarea = tw.textarea`min-h-[2.75rem] max-h-28 flex-1 resize-none rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] px-3 py-2 text-[13px] font-semibold leading-5 text-[rgb(var(--color-text))] outline-none transition placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent))] focus:shadow-[0_0_0_2px_rgba(139,74,43,0.1)] disabled:opacity-60`
const IconButton = tw.button`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-accent))]`
const PlusButton = tw.button`inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--color-surface-inverse))] text-[rgb(var(--color-text-inverse))] shadow-xl transition hover:bg-[rgb(var(--color-accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(139,74,43,0.28)]`
const ToolButton = tw.button`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[rgb(var(--color-border-strong))] bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))] transition hover:border-[rgb(var(--color-accent))] hover:bg-[rgb(var(--color-accent-muted))] hover:text-[rgb(var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50`
const SendButton = tw.button`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-inverse))] shadow-[0_14px_26px_-20px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`

const Bubble = styled.div<{ $mine?: boolean }>`
  ${tw`max-w-[88%] rounded-lg px-3 py-2 text-[13px] font-semibold leading-5`}
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  color: ${({ $mine }) => ($mine ? 'rgb(var(--color-text-inverse))' : 'rgb(var(--color-text))')};
  background: ${({ $mine }) => ($mine ? 'rgb(var(--color-surface-inverse))' : 'rgb(var(--color-surface-muted))')};
`

const ThinkingBox = tw.div`w-full rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] p-3`
const DraftShell = tw.div`mx-3 mb-3 overflow-hidden rounded-lg border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-[var(--shadow-card)]`
const DraftHeader = tw.div`flex items-start justify-between gap-3 border-b border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] px-3 py-3`
const DraftTitle = tw.div`min-w-0`
const DraftName = tw.div`truncate text-[14px] font-black text-[rgb(var(--color-text))]`
const DraftLabel = tw.div`mt-0.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DraftBadge = tw.span`inline-flex shrink-0 items-center gap-1 rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-muted))] px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))]`
const DraftContent = tw.div`grid gap-3 p-3`
const TobaccoList = tw.div`grid gap-1.5`
const DetailGrid = tw.div`grid grid-cols-1 gap-2 sm:grid-cols-2`
const DetailItem = tw.div`rounded-lg border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-2`
const DetailLabel = tw.div`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]`
const DetailValue = tw.div`truncate text-[12px] font-black text-[rgb(var(--color-text))]`
const PublishButton = tw.button`inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[rgb(var(--color-accent))] px-4 text-[13px] font-black text-[rgb(var(--color-text-inverse))] shadow-[0_16px_28px_-22px_rgba(83,48,31,0.95)] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`
const MissingText = tw.div`text-[11px] font-semibold leading-4 text-[rgb(var(--color-text-subtle))]`

const chatStages = [
  'Разбираю описание',
  'Сверяю табаки с каталогом',
  'Проверяю чашу, калауд и угли',
  'Обновляю черновик',
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
    content: 'Напиши или надиктуй забивку. Я соберу подробный черновик, а публикация будет только по кнопке.',
  },
]

const compactMessages = (messages: AgentMessage[]) => messages.slice(-10)

const getMissingFields = (draft: AgentSetupDraft | null) => {
  if (!draft) return ['название', 'табак', 'чаша', 'калауд', 'уголь', 'раскладка углей', 'тип забивки']

  return [
    draft.name ? null : 'название',
    draft.tobaccos?.length ? null : 'табак',
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
      <div tw="text-[12px] font-black text-[rgb(var(--color-text))]">Агент работает</div>
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
  onPublish: () => void
  publishing: boolean
}) => {
  const items = useMemo(() => buildPreviewItems(draft), [draft])
  const total = items.reduce((sum, item) => sum + item.percentage, 0)
  const ready = missing.length === 0
  const kind = detectSetupKind(draft.bowl_setup_type_name)
  const bowlModel = detectBowlModel({ name: draft.bowl_name })

  const details = [
    { icon: 'bowl' as const, label: 'Чаша', value: draft.bowl_name },
    { icon: 'kaloud' as const, label: 'Калауд', value: draft.kaloud_name },
    { icon: 'coal' as const, label: 'Уголь', value: draft.coal_name },
    { icon: 'placement' as const, label: 'Угли', value: draft.coal_placement_name },
    { icon: 'setupType' as const, label: 'Тип', value: draft.bowl_setup_type_name },
  ]

  return (
    <DraftShell>
      <DraftHeader>
        <DraftTitle>
          <DraftName>{draft.name || 'Новая забивка'}</DraftName>
          <DraftLabel>Черновик, не опубликовано</DraftLabel>
        </DraftTitle>
        <DraftBadge>
          <CatalogIcon name="feed" size={12} />
          {ready ? 'готово' : 'сбор'}
        </DraftBadge>
      </DraftHeader>

      <div tw="relative border-b border-[rgb(var(--color-border))]">
        <MixBowlPreview
          autoRotate={false}
          bowlModel={bowlModel}
          interactive={false}
          items={items}
          kind={kind}
          renderMode="snapshot"
          sceneScale={1}
        />
        <div tw="pointer-events-none absolute left-2.5 top-2.5 rounded-md border border-white/75 bg-[rgb(var(--color-surface))]/90 px-2 py-1 text-[10px] font-black text-[rgb(var(--color-text-muted))] shadow-[0_10px_24px_-18px_rgba(83,48,31,0.55)] backdrop-blur">
          {draft.bowl_setup_type_name || 'Тип забивки'}
        </div>
        <div tw="pointer-events-none absolute bottom-2.5 right-2.5 rounded-md border border-white/60 bg-[rgb(var(--color-surface-inverse))]/90 px-2 py-1.5 text-[11px] font-black text-white shadow-[0_14px_30px_-18px_rgba(0,0,0,0.75)] backdrop-blur">
          {total || 0}%
        </div>
      </div>

      <DraftContent>
        <div>
          <div tw="mb-1.5 text-[10px] font-bold uppercase text-[rgb(var(--color-text-subtle))]">Состав</div>
          {items.length ? (
            <TobaccoList>
              {items.map((item) => (
                <div key={item.id} tw="flex items-center gap-2 rounded-lg bg-[rgb(var(--color-surface-muted))] px-2 py-2">
                  <span tw="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span tw="min-w-0 flex-1 truncate text-[12px] font-black text-[rgb(var(--color-text))]">{item.name}</span>
                  <span tw="shrink-0 text-[12px] font-black text-[rgb(var(--color-accent))] tabular-nums">{item.percentage || '?'}%</span>
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
          <MissingText>
            Не хватает: {missing.join(', ')}. Напиши это в чат, агент обновит черновик.
          </MissingText>
        )}

        <PublishButton type="button" onClick={onPublish} disabled={!ready || publishing}>
          <CheckIcon size={14} />
          {publishing ? 'Публикую' : 'Опубликовать'}
        </PublishButton>
      </DraftContent>
    </DraftShell>
  )
}

export const SetupAgentWidget = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages)
  const [draft, setDraft] = useState<AgentSetupDraft | null>(null)
  const [recording, setRecording] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [stageIndex, setStageIndex] = useState(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [chatWithAgent, chatState] = useChatWithSetupAgentMutation()
  const [transcribeVoice, transcribeState] = useTranscribeSetupVoiceMutation()
  const missing = useMemo(() => getMissingFields(draft), [draft])

  const busy = chatState.isLoading || transcribeState.isLoading
  const stages = transcribeState.isLoading ? voiceStages : publishing ? publishStages : chatStages

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

    const nextMessages = compactMessages([...messages, { role: 'user' as const, content: text }])
    setMessages(nextMessages)
    setInput('')

    try {
      const response = await chatWithAgent({ messages: nextMessages, draft }).unwrap()
      setDraft(response.draft || null)
      setMessages(compactMessages([...nextMessages, { role: 'assistant', content: response.reply }]))
    } catch {
      setMessages(compactMessages([...nextMessages, {
        role: 'assistant',
        content: 'Не получилось обработать запрос. Проверь авторизацию и попробуй еще раз.',
      }]))
    }
  }

  const publishDraft = async () => {
    if (!draft || missing.length || busy) return

    setPublishing(true)
    const publishMessage = { role: 'user' as const, content: 'Опубликовать черновик' }
    const nextMessages = compactMessages([...messages, publishMessage])
    setMessages(nextMessages)

    try {
      const response = await chatWithAgent({ messages: nextMessages, draft, publish: true }).unwrap()
      setDraft(response.draft || draft)
      setMessages(compactMessages([...nextMessages, { role: 'assistant', content: response.reply }]))
      if (response.created_setup_id) {
        navigate(`/setups/${response.created_setup_id}`)
      }
    } catch {
      setMessages(compactMessages([...nextMessages, {
        role: 'assistant',
        content: 'Не получилось опубликовать черновик. Проверь данные и попробуй еще раз.',
      }]))
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
        setMessages(compactMessages([...messages, {
          role: 'assistant',
          content: 'Не получилось распознать голос. Попробуй текстом.',
        }]))
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

  return (
    <Shell>
      {open && (
        <ChatPanel aria-label="Setup agent chat">
          <PanelBody>
            <Header>
              <div tw="min-w-0">
                <Title>Новая забивка</Title>
                <Subtitle>{recording ? 'Идет запись голоса' : 'Чат собирает черновик перед публикацией'}</Subtitle>
              </div>
              <IconButton type="button" onClick={() => setOpen(false)} aria-label="Close setup agent">
                <CloseIcon />
              </IconButton>
            </Header>

            <ScrollArea>
              <Messages>
                {messages.map((message, index) => (
                  <Bubble key={`${message.role}-${index}`} $mine={message.role === 'user'}>
                    {message.content}
                  </Bubble>
                ))}
                {busy && <ThinkingMessage currentIndex={stageIndex} stages={stages} />}
              </Messages>

              {draft && (
                <DraftPreview
                  draft={draft}
                  missing={missing}
                  onPublish={publishDraft}
                  publishing={publishing}
                />
              )}
            </ScrollArea>

            <Composer onSubmit={handleSubmit}>
              <ToolButton type="button" onClick={handleVoice} disabled={transcribeState.isLoading || chatState.isLoading} aria-label="Record voice">
                {recording ? <CloseIcon size={13} /> : <MicIcon size={16} />}
              </ToolButton>
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Табаки, проценты, чаша, угли..."
                disabled={chatState.isLoading}
              />
              <SendButton type="submit" disabled={!input.trim() || busy} aria-label="Send setup details">
                <SendIcon size={16} />
              </SendButton>
            </Composer>
          </PanelBody>
        </ChatPanel>
      )}

      <PlusButton type="button" onClick={() => setOpen((value) => !value)} aria-label="Add setup with agent">
        <PlusIcon size={22} />
      </PlusButton>
    </Shell>
  )
}
