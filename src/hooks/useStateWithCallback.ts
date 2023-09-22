import { useState, useCallback, useRef, useEffect } from 'react'

export type fuctionType<T> = (state: T) => T
export type notReqFuctionType<T> = (state?: T) => void

type UpdateStateNewStateCb<T> = T | fuctionType<T>
type UpdateStateCb<T> = notReqFuctionType<T> | null
type IUpdateState<T> = (newState: UpdateStateNewStateCb<T>, cb: UpdateStateCb<T> | null) => void

const isFunctionType = <T>(value: any): value is fuctionType<T> => {
	return value.apply !== undefined
}

export const useStateWithCallback = <T>(initialState: T): [T, IUpdateState<T>] => {
	const [state, setState] = useState<T>(initialState)
	const cbRef = useRef<notReqFuctionType<T> | null>(null)

	const updateState: IUpdateState<T> = useCallback((newState, cb) => {
		cbRef.current = cb

		setState((prev: T) => (isFunctionType<T>(newState) ? newState(prev) : newState))
	}, [])

	useEffect(() => {
		if (cbRef.current) {
			cbRef.current(state)
			cbRef.current = null
		}
	}, [state])

	return [state, updateState]
}
