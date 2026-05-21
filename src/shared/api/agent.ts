import { api } from './base'

export type AgentMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AgentDraftTobacco = {
  tobacco_id?: string | null
  tobacco_name?: string | null
  percentage?: number | null
}

export type AgentSetupDraft = {
  name?: string | null
  description?: string | null
  bowl_id?: string | null
  bowl_name?: string | null
  kaloud_id?: string | null
  kaloud_name?: string | null
  coal_id?: string | null
  coal_name?: string | null
  coal_placement_id?: string | null
  coal_placement_name?: string | null
  bowl_setup_type_id?: string | null
  bowl_setup_type_name?: string | null
  tobaccos?: AgentDraftTobacco[]
}

export type AgentChatResponse = {
  reply: string
  draft?: AgentSetupDraft | null
  needs_confirmation: boolean
  created_setup_id?: string | null
}

const agentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    chatWithSetupAgent: builder.mutation<AgentChatResponse, { messages: AgentMessage[]; draft?: AgentSetupDraft | null; publish?: boolean }>({
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

export const { useChatWithSetupAgentMutation, useTranscribeSetupVoiceMutation } = agentApi
