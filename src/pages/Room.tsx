import { useParams } from "react-router-dom"
import { useWebRTC } from "../hooks/useWebRTC"
import Video from "../components/Video"
import './Room.css'

const Room = () => {
  const {id: roomId} = useParams()
  const {clients, provideMediaRef} = useWebRTC(roomId!)
  

  return (
    <div className="video_list">
        {
          // @ts-ignore
          clients.map(clientId => <Video clientId={clientId} provideMediaRef={provideMediaRef}/>)
        }
    </div>
  )
}

export default Room