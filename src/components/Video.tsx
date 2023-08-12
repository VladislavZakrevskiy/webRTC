
interface IVideoProps {
    clientId: string
    provideMediaRef: Function
}

const Video = ({clientId, provideMediaRef}: IVideoProps) => {
  return (
    <video 
        style={{width: '33%'}}
        key={clientId}
        autoPlay
        playsInline
        muted={clientId === 'LOCAL_VIDEO'}
        ref={instance => provideMediaRef(clientId, instance)}
    />
  )
}

export default Video