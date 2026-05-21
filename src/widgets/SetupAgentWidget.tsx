import { FormEvent, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import tw from 'twin.macro'
import {
  type AgentMessage,
  type AgentSetupDraft,
  useChatWithSetupAgentMutation,
  useTranscribeSetupVoiceMutation,
} from '../shared/api'
import { CheckIcon, CloseIcon, PlusIcon } from '../shared/ui/Icons'

const Shell = styled.div`
  ${tw`fixed z-50 flex flex-col items-end gap-3`}
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
`

const ChatPanel = styled.section`
  ${tw`w-[min(calc(100vw-2rem),24rem)] overflow-hidden border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] shadow-2xl`}
  border-radius: 8px;
`

const Header = tw.div`flex items-center justify-between gap-3 border-b border-[rgb(var(--color-border-muted))] px-4 py-3`
const Title = tw.h2`text-[14px] font-semibold text-[rgb(var(--color-text))]`
const IconButton = tw.button`inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface-raised))] text-[rgb(var(--color-text))] transition hover:border-[rgb(var(--color-accent-border))] hover:text-[rgb(var(--color-accent))]`
const PlusButton = tw.button`inline-flex h-14 w-14 items-center justify-center rounded-full bg-[rgb(var(--color-accent))] text-[rgb(var(--color-text-inverse))] shadow-xl transition hover:bg-[rgb(var(--color-accent-hover))]`
const Messages = tw.div`flex max-h-[22rem] min-h-[16rem] flex-col gap-2 overflow-y-auto px-4 py-3`
const Composer = tw.form`flex items-end gap-2 border-t border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-raised))] p-3`
const Textarea = tw.textarea`min-h-[2.5rem] max-h-28 flex-1 resize-none rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] px-3 py-2 text-[13px] leading-5 text-[rgb(var(--color-text))] outline-none transition placeholder:text-[rgb(var(--color-text-subtle))] focus:border-[rgb(var(--color-accent-border))]`
const SendButton = tw.button`inline-flex h-10 min-w-10 items-center justify-center rounded-md bg-[rgb(var(--color-accent))] px-3 text-[12px] font-semibold text-[rgb(var(--color-text-inverse))] transition hover:bg-[rgb(var(--color-accent-hover))] disabled:cursor-not-allowed disabled:opacity-50`
const VoiceButton = tw.button`inline-flex h-10 w-10 items-center justify-center rounded-md border border-[rgb(var(--color-border))] bg-[rgb(var(--color-surface))] text-[12px] font-semibold text-[rgb(var(--color-text-muted))] transition hover:border-[rgb(var(--color-accent-border))] hover:text-[rgb(var(--color-accent))] disabled:cursor-not-allowed disabled:opacity-50`

const Bubble = styled.div<{ $mine?: boolean }>`
  ${tw`max-w-[88%] rounded-md px-3 py-2 text-[13px] leading-5`}
  align-self: ${({ $mine }) => ($mine ? 'flex-end' : 'flex-start')};
  color: ${({ $mine }) => ($mine ? 'rgb(var(--color-text-inverse))' : 'rgb(var(--color-text))')};
  background: ${({ $mine }) => ($mine ? 'rgb(var(--color-accent))' : 'rgb(var(--color-surface-muted))')};
`

const Draft = tw.div`mx-4 mb-3 rounded-md border border-[rgb(var(--color-border-muted))] bg-[rgb(var(--color-surface-muted))] p-3 text-[12px] leading-5 text-[rgb(var(--color-text-muted))]`
const DraftTitle = tw.div`mb-1 flex items-center gap-1 text-[12px] font-semibold text-[rgb(var(--color-text))]`

const initialMessages: AgentMessage[] = [
  {
    role: 'assistant',
    content: 'Напиши или надиктуй забивку, а я соберу черновик и попрошу подтверждение.',
  },
]

const compactMessages = (messages: AgentMessage[]) => messages.slice(-10)

const draftLines = (draft: AgentSetupDraft) => {
  const tobaccos = draft.tobaccos
    ?.map((item) => `${item.tobacco_name || 'Табак'} ${item.percentage || '?'}%`)
    .join(', ')

  return [
    draft.name ? `Название: ${draft.name}` : null,
    tobaccos ? `Табаки: ${tobaccos}` : null,
    draft.bowl_name ? `Чаша: ${draft.bowl_name}` : null,
    draft.kaloud_name ? `Калауд: ${draft.kaloud_name}` : null,
    draft.coal_name ? `Уголь: ${draft.coal_name}` : null,
    draft.coal_placement_name ? `Угли: ${draft.coal_placement_name}` : null,
    draft.bowl_setup_type_name ? `Тип: ${draft.bowl_setup_type_name}` : null,
  ].filter(Boolean)
}

export const SetupAgentWidget = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<AgentMessage[]>(initialMessages)
  const [draft, setDraft] = useState<AgentSetupDraft | null>(null)
  const [recording, setRecording] = useState(false)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const [chatWithAgent, chatState] = useChatWithSetupAgentMutation()
  const [transcribeVoice, transcribeState] = useTranscribeSetupVoiceMutation()

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
      if (response.created_setup_id) {
        navigate(`/setups/${response.created_setup_id}`)
      }
    } catch {
      setMessages(compactMessages([...nextMessages, {
        role: 'assistant',
        content: 'Не получилось обработать запрос. Проверь авторизацию и попробуй еще раз.',
      }]))
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

  const busy = chatState.isLoading || transcribeState.isLoading
  const lines = draft ? draftLines(draft) : []

  return (
    <Shell>
      {open && (
        <ChatPanel aria-label="Setup agent chat">
          <Header>
            <Title>Новая забивка</Title>
            <IconButton type="button" onClick={() => setOpen(false)} aria-label="Close setup agent">
              <CloseIcon />
            </IconButton>
          </Header>

          <Messages>
            {messages.map((message, index) => (
              <Bubble key={`${message.role}-${index}`} $mine={message.role === 'user'}>
                {message.content}
              </Bubble>
            ))}
            {busy && <Bubble>Думаю...</Bubble>}
          </Messages>

          {lines.length > 0 && (
            <Draft>
              <DraftTitle><CheckIcon /> Черновик</DraftTitle>
              {lines.map((line) => <div key={line}>{line}</div>)}
            </Draft>
          )}

          <Composer onSubmit={handleSubmit}>
            <VoiceButton type="button" onClick={handleVoice} disabled={transcribeState.isLoading} aria-label="Record voice">
              {recording ? '■' : '●'}
            </VoiceButton>
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Напиши табаки, чашу и детали..."
              disabled={chatState.isLoading}
            />
            <SendButton type="submit" disabled={!input.trim() || busy}>OK</SendButton>
          </Composer>
        </ChatPanel>
      )}

      <PlusButton type="button" onClick={() => setOpen((value) => !value)} aria-label="Add setup with agent">
        <PlusIcon size={22} />
      </PlusButton>
    </Shell>
  )
}
