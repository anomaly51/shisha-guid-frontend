import { api } from './base'
import type { AgentChatResponse, AgentLanguage, AgentMessage, AgentSetupDraft } from '../agentTypes'
export type { AgentChatResponse, AgentDraftTobacco, AgentMessage, AgentSetupDraft } from '../agentTypes'

const agentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAgentCapabilities: builder.query<{ voice_transcription: boolean; message_limit: number }, void>({
      query: () => '/agent/capabilities',
    }),
    getAgentSchema: builder.query<Record<string, unknown>, void>({
      query: () => '/agent/schema',
    }),
    chatWithSetupAgent: builder.mutation<AgentChatResponse, { messages: AgentMessage[]; draft?: AgentSetupDraft | null; publish?: boolean; language?: AgentLanguage }>({
      query: (body) => ({ url: '/agent/chat', method: 'POST', body }),
      invalidatesTags: (_result) => ['Setups'],
    }),
    transcribeSetupVoice: builder.mutation<{ text: string }, Blob>({
      query: (blob) => {
        const formData = new FormData()
        formData.append('file', blob, 'setup-voice.webm')
        return { url: '/agent/transcribe', method: 'POST', body: formData }
      },
    }),
  }),
})

export const {
  useGetAgentCapabilitiesQuery,
  useGetAgentSchemaQuery,
  useChatWithSetupAgentMutation,
  useTranscribeSetupVoiceMutation,
} = agentApi
