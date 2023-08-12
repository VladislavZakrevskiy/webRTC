//@ts-nocheck
import { useCallback, useEffect, useRef } from 'react';
import { useStateWithCallback } from './useStateWithCallback';
import socket from '../socket/socket';
import { ACTIONS } from '../../consts/actions';
import freeice from 'freeice';

const LOCAL_VIDEO = 'LOCAL_VIDEO';

export const useWebRTC = (roomId: string) => {
	const [clients, updateClients] = useStateWithCallback<string[]>([]);

	const addNewClient = useCallback(
		(newClient: string, cb: Function) => {
			updateClients((list: any[]) => {
				if (!list.includes(newClient)) {
					return [...list, newClient];
				}

				return list;
			}, cb);
		},
		[clients, updateClients]
	);

	const peerConnection = useRef({});
	const localMediaStream = useRef(null);
	const peerMediaElements = useRef({ [LOCAL_VIDEO]: null });

	useEffect(() => {
		async function newPeerHandler({ peerID, createOffer }) {
			if (peerID in peerConnection.current) {
				return console.log('already connected to this peer');
			}

			peerConnection.current[peerID] = new RTCPeerConnection({
				iceServers: freeice(),
			});

			peerConnection.current[peerID].onicecandidate = (event) => {
				if (event.candidate) {
					socket.emit(ACTIONS.RELAY_ICE, {
						peerID,
						iceCandidate: event.candidate,
					});
				}
			};
			let tracksNumber = 0;

			peerConnection.current[peerID].ontrack = ({
				streams: [remoteStream],
			}) => {
				tracksNumber++;

				if (tracksNumber === 2) {
					tracksNumber = 0;
					addNewClient(peerID, () => {
						peerMediaElements.current[peerID].srcObject = remoteStream;
					});
				}
			};

			localMediaStream.current?.getTracks().forEach((track) => {
				peerConnection.current[peerID]!.addTrack(
					track,
					localMediaStream.current
				);
			});

			if (createOffer) {
				const offer = await peerConnection.current[peerID].createOffer();

				await peerConnection.current[peerID].setLocalDescription(offer);

				socket.emit(ACTIONS.RELAY_SDP, {
					peerID,
					sessionDescription: offer,
				});
			}
		}

		socket.on(ACTIONS.ADD_PEER, newPeerHandler);

		return () => {
			socket.off(ACTIONS.ADD_PEER);
		};
	}, []);

	useEffect(() => {
		async function setRemoteMedia({ peerID, sessionDescription }) {
			await peerConnection.current[peerID].setRemoteDescription(
				new RTCSessionDescription(sessionDescription)
			);

			if ((sessionDescription.type = 'offer')) {
				const answer = await peerConnection.current[peerID].createAnswer();

				await peerConnection.current[peerID].setLocalDescription(answer);

				socket.emit(ACTIONS.RELAY_SDP, {
					peerID,
					sessionDescription: answer,
				});
			}
		}

		socket.on(ACTIONS.SESSION_DESCRIPTION, setRemoteMedia);

		return () => {
			socket.off(ACTIONS.SESSION_DESCRIPTION);
		};
	}, []);

	useEffect(() => {
		socket.on(ACTIONS.ICE_CANDIDATE, ({ peerID, iceCandidate }) => {
			peerConnection.current[peerID].addIceCandidate(
				new RTCIceCandidate(iceCandidate)
			);
		});

		return () => {
			socket.off(ACTIONS.ICE_CANDIDATE);
		};
	}, []);

	useEffect(() => {
		socket.on(ACTIONS.REMOVE_PEER, ({ peerID }) => {
			if (peerConnection.current[peerID]) {
				peerConnection.current[peerID].close();
			}

			delete peerConnection.current[peerID];
			delete peerMediaElements.current[peerID];

			updateClients((list) => list.filter((c) => c !== peerID));
		});
		return () => {
			socket.off(ACTIONS.REMOVE_PEER);
		};
	}, []);

	useEffect(() => {
		async function startCapture() {
			localMediaStream.current = await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: {
					width: 1280,
					height: 720,
				},
			});

			addNewClient(LOCAL_VIDEO, () => {
				const localVideoElement = peerMediaElements.current[LOCAL_VIDEO];

				if (localVideoElement) {
					localVideoElement.volume = 0;

					localVideoElement.srcObject = localMediaStream.current;
				}
			});
		}

		startCapture()
			.then(() => socket.emit(ACTIONS.JOIN, { room: roomId }))
			.catch(() => console.error('Error in useWebRTC'));

		return () => {
			localMediaStream.current?.getTracks()?.forEach((track) => track.stop());
			socket.emit(ACTIONS.LEAVE);
		};
	}, [roomId]);

	const provideMediaRef = useCallback((id: string, node: any) => {
		peerMediaElements.current[id] = node;
	}, []);

	return { clients, provideMediaRef };
};
