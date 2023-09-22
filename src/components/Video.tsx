interface IVideoProps {
	clientId: string
	provideMediaRef: (id: string, node: HTMLVideoElement) => void
}

const Video = ({ clientId, provideMediaRef }: IVideoProps) => {
	return (
		<video
			className="video"
			autoPlay
			playsInline
			muted={clientId === 'LOCAL_VIDEO'}
      //@ts-ignore
			ref={(instance) => provideMediaRef(clientId, instance)}
		/>
	)
}

export default Video
