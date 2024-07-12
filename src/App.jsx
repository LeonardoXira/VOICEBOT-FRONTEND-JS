import { useEffect, useRef, useState } from 'react'
import { formatTime } from './utils/helpers'
import { SendIcon } from './lib/icons/SendIcon'
import { voicebotService } from './services/voicebot.service'
import { ChatIcon } from './lib/icons/ChatIcon'
import { SpinnerIcon } from './lib/icons/SpinnerIcon'

export const App = () => {
  // Datos para iniciar la conversacion
  const [campaign, setCampaign] = useState('')
  const [phone, setPhone] = useState('')
  const [callId, setCallId] = useState('')
  const [isValidPhoneNumber, setIsValidPhoneNumber] = useState(false)

  // Informacion extra
  const [extraInfoFields, setExtraInfoFields] = useState(1)
  const [extraInfo, setExtraInfo] = useState({})

  // Estado de la conversacion
  const [isConversationStarted, setIsConversationStarted] = useState(false)

  // Audios
  const [audioResponse, setAudioResponse] = useState([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSending, setIsSending] = useState(false);

  // Grabacion de audio
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const nextId = useRef(1)
  const timerRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioClips, setAudioClips] = useState([])

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } else if (!isRecording && recordingTime !== 0) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      setRecordingTime(0)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, recordingTime])

  const formatPhoneNumber = (value) => {
    const phoneNumberDigits = value.replace(/\D/g, '')
    let formattedNumber = ''

    if (phoneNumberDigits.length > 0) {
      formattedNumber += phoneNumberDigits.substring(0, 3)
    }
    if (phoneNumberDigits.length >= 4) {
      formattedNumber += '-'
    }

    if (phoneNumberDigits.length > 3) {
      formattedNumber += phoneNumberDigits.substring(3, 6)
    }
    if (phoneNumberDigits.length >= 7) {
      formattedNumber += '-'
    }

    if (phoneNumberDigits.length > 6) {
      formattedNumber += phoneNumberDigits.substring(6, 10)
    }

    if (phoneNumberDigits.length < 10) {
      setIsValidPhoneNumber(false)
    } else {
      setIsValidPhoneNumber(true)
    }

    return formattedNumber
  }

  // Funcion para manejar el cambio en el input del telefono
  const handleChange = (e) => {
    const formattedNumber = formatPhoneNumber(e.target.value)
    setPhone(formattedNumber)
  }

  const handleInputChange = (e, index) => {
    const { value } = e.target
    const adjustedIndex = index + 1
    const key = `campo${adjustedIndex}`
    setExtraInfo({
      ...extraInfo,
      [key]: value
    })
  }

  const handleStartConversation = async () => {
    const randomCallId =
      'pruebasXiraLiverpool' +
      Math.floor(Math.random() * 1000)
        .toString()
        .padStart(12, '0')
    const phoneNumberFormatted = phone.replace(/-/g, '')

    try {
      const response = await voicebotService.initNewCall(randomCallId, phoneNumberFormatted, campaign, extraInfo)
      setCallId(response.callId)
      setIsConversationStarted(true)
      setAudioResponse([...audioResponse, response.audio64])
      console.log(response)
    } catch (error) {
      window.alert('Error al iniciar la llamada: ' + error.message)
    }
  }

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
  
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
  
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        const audioUrl = URL.createObjectURL(audioBlob)
        const newClip = {
          id: nextId.current++,
          url: audioUrl,
          blob: audioBlob
        }
        setAudioClips((prevClips) => [...prevClips, newClip])
        audioChunksRef.current = []
      }
  
      mediaRecorder.start()
      setIsRecording(true)
      
    } catch (error) {
      console.error('Error al grabar audio:', error.message)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSendAudio = async (clip) => {
    setIsSending(true)
    try {
      console.log('Enviando Audio...', clip)
      const response = await voicebotService.continueCall(callId, phone, campaign, clip.blob)
      setAudioClips((prevClips) => prevClips.map((c_clip) => c_clip.id === clip.id ? { ...c_clip, sent: true } : c_clip))
      setAudioResponse([...audioResponse, response.audio64])
    } catch (error) {
      console.error('Error al enviar el audio:', error.message)
    }
    setIsSending(false)
  }

  const handleDeleteAudio = (id) => {
    setAudioClips((prevClips) => prevClips.filter((clip) => clip.id !== id))
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Charla con el Voicebot</h1>
      <section className="bg-white shadow-md rounded-lg p-6 mb-5">
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="callID" className="block text-gray-700 font-bold mb-2">
            callID:
          </label>
          <p className={`px-2 py-1 rounded-lg ${callId ? 'bg-blue-300' : 'bg-red-200'}`}>
            {callId ? <>{callId}</> : <> No se ha generado un callID, por favor inicia una conversación para generarlo</>}
          </p>
        </div>
        <div className="mb-4">
          <label htmlFor="campaigns" className="block text-gray-700 font-bold mb-2">
            Campaña
          </label>
          {campaign && isConversationStarted ? (
            <p className="px-2 py-1 rounded-lg bg-blue-200 w-fit">{campaign}</p>
          ) : (
            <select
              id="campaigns"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              onChange={(e) => setCampaign(e.target.value)}
            >
              <option selected disabled>
                Selecciona una campaña
              </option>
              <option value="Penta Liverpool Welcome Voicebot">Penta Liverpool Welcome Voicebot</option>
              <option value="Xira QA Voicebot">Xira QA Voicebot</option>
              <option value="Penta Azteca Voicebot">Penta Azteca Voicebot</option>
            </select>
          )}
        </div>
        <div className="mb-4">
          <label htmlFor="phone" className="block text-gray-700 font-bold mb-2">
            Número de Teléfono
          </label>
          {phone && isConversationStarted ? (
            <p className="px-2 py-1 rounded-lg bg-blue-200 w-fit">{phone}</p>
          ) : (
            <input
              type="text"
              id="phone"
              name="phone"
              value={phone}
              onChange={handleChange}
              maxLength={12}
              pattern="\d{3}-\d{3}-\d{4}"
              title="Debe tener el formato 123-456-7890"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 font-bold mb-2">Información Extra</label>
          <p> Cuantos campos necesitas? </p>
          <input
            type="number"
            name="extraInfo"
            id="extraInfo"
            min="1"
            max="15"
            value={extraInfoFields}
            onChange={(e) => setExtraInfoFields(parseInt(e.target.value))}
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            placeholder="5"
          />
        </div>
        {extraInfoFields > 0 && (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(extraInfoFields)].map((_, index) => {
              const displayIndex = index + 1
              return (
                <div key={displayIndex} className="mb-4">
                  <label htmlFor={`extraInfo${displayIndex}`} className="block text-gray-700 font-bold mb-2">
                    Campo {displayIndex}
                  </label>
                  <input
                    type="text"
                    id={`extraInfo${displayIndex}`}
                    name={`extraInfo${displayIndex}`}
                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    value={extraInfo[`campo${displayIndex}`] || ''}
                    onChange={(e) => handleInputChange(e, index)}
                  />
                </div>
              )
            })}
          </div>
        )}

        <div className="text-center flex gap-4">
          <button
            disabled={!campaign || !isValidPhoneNumber || isConversationStarted}
            className="px-4 py-2 rounded-lg text-white font-semibold bg-blue-500 hover:bg-blue-700 flex gap-3 items-center disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            onClick={handleStartConversation}
          >
            Iniciar Conversación
            <ChatIcon className="fill-white" height="20" width="20" />
          </button>
          <button
            disabled={!isConversationStarted}
            className="px-4 py-2 rounded-lg text-white font-semibold bg-red-500 hover:bg-red-700 flex gap-3 items-center disabled:opacity-50 disabled:cursor-not-allowed transition duration-300"
            onClick={handleStartConversation}
          >
            Finalizar llamada
            <ChatIcon className="fill-white" height="20" width="20" />
          </button>
        </div>
      </section>
      {isConversationStarted && (
  <section className="bg-white shadow-md rounded-lg p-6">
    <div className="text-center">
      <h1 className="text-2xl font-semibold mb-4">Charla con el Voicebot</h1>
      <div className="mb-4">{isRecording && <div className="text-xl">{formatTime(recordingTime)}</div>}</div>
      <button
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        className={`px-4 py-2 rounded-lg text-white font-semibold ${isRecording ? 'bg-red-500 hover:bg-red-700' : 'bg-green-500 hover:bg-green-700'} transition duration-300`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
    </div>
  </section>
)}

<div className="mt-4 flex flex-col space-y-4">
  <h2 className="font-bold text-2xl">Respuestas</h2>
  <div className="flex">
    <div className="w-1/2 pr-2">
      {audioResponse.map((audio, index) => (
        <div key={index} className="mb-4 flex items-start">
          <audio controls src={`data:audio/wav;base64,${audio}`} className="mr-2" />
        </div>
      ))}
    </div>
    <div className="w-1/2 pl-2">
      {audioClips.map((clip) => (
        <div key={clip.id} className="mb-4 flex items-end justify-end">
          <audio controls src={clip.url} className="mr-2" />
          <div className="flex items-center">
            {isSending && !clip.sent ? (
              <SpinnerIcon />
            ) : (
              <>
                <button 
                  onClick={() => handleSendAudio(clip)} 
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded-lg mr-2 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300" 
                  disabled={clip.sent}>
                  Enviar
                  <SendIcon width="15" height="15" className="fill-white" />
                </button>
                {!clip.sent && (
                  <button onClick={() => handleDeleteAudio(clip.id)} className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded-lg">
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

    </div>
  )
}