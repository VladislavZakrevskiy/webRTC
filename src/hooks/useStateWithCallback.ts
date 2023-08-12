import { useState, useCallback, useRef, useEffect } from 'react';



export const useStateWithCallback = <T>(initialState: T)=> {
    const [state, setState] = useState<T>(initialState)
    const cbRef = useRef<Function | null>(null)

    const updateState = useCallback((newState: any, cb: Function) => {
        cbRef.current = cb

        setState((prev: any) => typeof newState === 'function' ? newState(prev) : newState)
    }, [])

    useEffect(() => {
        if(cbRef.current) {
            cbRef.current(state)
            cbRef.current = null
        }
    }, [state])

    return [state, updateState]
}
