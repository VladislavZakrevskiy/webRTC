import { useParams } from 'react-router-dom'
import { useWebRTC } from '../hooks/useWebRTC'
import Video from '../components/Video'
import './Room.css'

const Room = () => {
	const { id: roomId } = useParams<{ id: string }>()
	const { clients, provideMediaRef } = useWebRTC(roomId)

	return (
		<div className="video_list">
			{clients.map((clientId) => (
				<Video key={clientId} clientId={clientId} provideMediaRef={provideMediaRef} />
			))}
		</div>
	)
}

export default Room
