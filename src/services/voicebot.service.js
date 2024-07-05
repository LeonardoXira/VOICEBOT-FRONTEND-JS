import { instance } from '../networking/axios'

class VoicebotService {
  async initNewCall (callId, phoneNumber, campaign, extraInfo) {
    console.log('Iniciando llamada con lo siguientes datos:', callId, phoneNumber, campaign, extraInfo)
    const response = await instance.post('/newCall', {
      callId,
      phoneNumber,
      campaign,
      extraInfo
    })

    return response.data
  }

  async continueCall (callId, phoneNumber, campaign, audioBlob) {
    const formData = new FormData()
    const timestamp = new Date().getTime()

    formData.append('callId', callId)
    formData.append('phoneNumber', phoneNumber)
    formData.append('campaign', campaign)
    formData.append('audio', audioBlob, `${timestamp}`)

    console.log('Enviando Audio...', audioBlob)
    const response = await instance.post('/call', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    console.log('Audio Enviado')

    return response.data
  }
}

export const voicebotService = new VoicebotService()
