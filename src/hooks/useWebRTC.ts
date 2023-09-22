import { useCallback, useEffect, useRef } from 'react'
import { notReqFuctionType, useStateWithCallback } from './useStateWithCallback'
import socket from '../socket/socket'
import { ACTIONS } from '../../consts/actions'
//@ts-ignore
import freeice from 'freeice'

const LOCAL_VIDEO = 'LOCAL_VIDEO'

export const useWebRTC = (roomId?: string) => {
	if (!roomId) {
		throw new Error()
	}

	const [clients, updateClients] = useStateWithCallback<string[]>([])

	const addNewClient = useCallback(
		(newClient: string, cb: notReqFuctionType<string[]>) => {
			const handleAddClient = (list: string[]) => {
				if (!list.includes(newClient)) {
					return [...list, newClient]
				}

				return list
			}

			updateClients(handleAddClient, cb)
		},
		[updateClients, clients]
	)

	const peerConnection = useRef<Record<string, RTCPeerConnection | null>>({})
	const localMediaStream = useRef<MediaStream | null>(null)
	const peerMediaElements = useRef<Record<string, HTMLVideoElement | null>>({ [LOCAL_VIDEO]: null })

	useEffect(() => {
		async function newPeerHandler({ peerID, createOffer }: { peerID: string; createOffer: boolean }) {
			if (peerID in peerConnection.current) {
				return console.log('already connected to this peer')
			}

			peerConnection.current[peerID] = new RTCPeerConnection({
				iceServers: freeice(),
			})

			const currentPeer = peerConnection.current[peerID] as RTCPeerConnection
			const currentLocalMediaStreem = localMediaStream.current as MediaStream
			const currentMediaStream = peerMediaElements.current[peerID] as HTMLVideoElement

			currentPeer.onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit(ACTIONS.RELAY_ICE, {
						peerID,
						iceCandidate: event.candidate,
					})
				}
			}
			let tracksNumber = 0

			currentPeer.ontrack = ({ streams: [remoteStream] }) => {
				tracksNumber++

				if (tracksNumber === 2) {
					tracksNumber = 0
					addNewClient(peerID, () => {
						//@ts-ignore
						peerMediaElements.current[peerID].srcObject = remoteStream
					})
				}
			}

			currentLocalMediaStreem.getTracks().forEach((track: MediaStreamTrack) => {
				currentPeer.addTrack(track, currentLocalMediaStreem)
			})

			if (createOffer) {
				const offer = await currentPeer.createOffer()

				await currentPeer.setLocalDescription(offer)

				socket.emit(ACTIONS.RELAY_SDP, {
					peerID,
					sessionDescription: offer,
				})
			}
		}

		socket.on(ACTIONS.ADD_PEER, newPeerHandler)

		return () => {
			socket.off(ACTIONS.ADD_PEER)
		}
	}, [])

	useEffect(() => {
		async function setRemoteMedia({
			peerID,
			sessionDescription,
		}: {
			peerID: string
			sessionDescription: RTCSessionDescriptionInit
		}) {
			const currentPeer = peerConnection.current[peerID] as RTCPeerConnection

			await currentPeer.setRemoteDescription(new RTCSessionDescription(sessionDescription))

			if (sessionDescription.type == 'offer') {
				const answer = await currentPeer.createAnswer()

				await currentPeer.setLocalDescription(answer)

				socket.emit(ACTIONS.RELAY_SDP, {
					peerID,
					sessionDescription: answer,
				})
			}
		}

		socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia)

		return () => {
			socket.off(ACTIONS.SESSION_DESCRIPTION)
		}
	}, [])

	useEffect(() => {
		socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
			const currentPeer = peerConnection.current[peerID] as RTCPeerConnection

			currentPeer.addIceCandidate(new RTCIceCandidate(iceCandidate))
		})

		return () => {
			socket.off(ACTIONS.ICE_CANDIDATE)
		}
	}, [])

	useEffect(() => {
		socket.on(ACTIONS.REMOVE_PEER, ({ peerID }) => {
			const currentPeer = peerConnection.current[peerID] as RTCPeerConnection

			if (peerConnection.current[peerID]) {
				currentPeer.close()
			}

			delete peerConnection.current[peerID]
			delete peerMediaElements.current[peerID]

			updateClients((list) => list.filter((c) => c !== peerID), null)
		})
		return () => {
			socket.off(ACTIONS.REMOVE_PEER)
		}
	}, [])

	useEffect(() => {
		async function startCapture() {
			localMediaStream.current = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: 1280,
					height: 720,
				},
			})

			addNewClient(LOCAL_VIDEO, () => {
				const localVideoElement = peerMediaElements.current[LOCAL_VIDEO]

				if (localVideoElement) {
					localVideoElement.volume = 0

					localVideoElement.srcObject = localMediaStream.current
				}
			})
		}

		startCapture()
			.then(() => socket.emit(ACTIONS.JOIN, { room: roomId }))
			.catch(() => console.error('Error in useWebRTC'))

		return () => {
			localMediaStream.current?.getTracks()?.forEach((track) => track.stop())
			socket.emit(ACTIONS.LEAVE)
		}
	}, [roomId])

	const provideMediaRef = useCallback((id: string, node: HTMLVideoElement) => {
		peerMediaElements.current[id] = node
	}, [])

	return { clients, provideMediaRef }
}
