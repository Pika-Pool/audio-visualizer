import { useState, useEffect, useReducer } from 'react';

// action types for useReducer dispatch
export type ACTION_TYPE<T> =
	| { type: 'FETCH_INIT'; payload?: any }
	| { type: 'FETCH_SUCCESS'; payload: T }
	| { type: 'FETCH_FAILURE'; error: typeof Error };

// state returned by useReducer
export type STATE<T> = {
	isLoading: boolean;
	isError: boolean;
	data?: T;
	error?: typeof Error;
};

// optional parameters for useFetch
type USE_FETCH_OPTIONALS<T> = {
	onSuccess?: (
		responseData: T,
		dispatch: React.Dispatch<ACTION_TYPE<T>>
	) => void;
	onFailure?: (
		error: typeof Error,
		dispatch: React.Dispatch<ACTION_TYPE<T>>
	) => void;
	onSettled?: (
		reponse: Response,
		dispatch: React.Dispatch<ACTION_TYPE<T>>
	) => void;
};

// returning the reducer
// to create a function from template with the given value of T
// by the caller of useFetch
const createDataFetchReducer = <T>() => {
	// return function
	return (state: STATE<T>, action: ACTION_TYPE<T>): STATE<T> => {
		switch (action.type) {
			case 'FETCH_INIT':
				return { ...state, isLoading: true, isError: false };
			case 'FETCH_SUCCESS':
				return {
					...state,
					isLoading: false,
					isError: false,
					data: action.payload,
				};
			case 'FETCH_FAILURE':
				return {
					...state,
					isLoading: false,
					isError: true,
					error: action.error,
				};
			default:
				throw new Error('invalid ACTION_TYPE in dataFetchReducer');
		}
	};
};

const useFetch = <T>(
	initialUrl: string = '',
	initialData?: T,
	{ onSuccess, onFailure, onSettled }: USE_FETCH_OPTIONALS<T> = {}
) => {
	const [url, setUrl] = useState(initialUrl);

	const dataFetchReducer = createDataFetchReducer<T>();
	const initialState: STATE<T> = {
		isLoading: false,
		isError: false,
		data: initialData,
	};
	const [state, dispatch] = useReducer<
		React.Reducer<STATE<T>, ACTION_TYPE<T>>
	>(dataFetchReducer, initialState);

	// main effect
	useEffect(() => {
		dispatch({ type: 'FETCH_INIT' });

		// for cleanup on unmount
		const controller = new AbortController();
		(async () => {
			try {
				const res = await fetch(url, { signal: controller.signal });

				if (onSettled) onSettled(res, dispatch);
				else {
					const data = await res.json();
					if (onSuccess) onSuccess(data, dispatch);
					else dispatch({ type: 'FETCH_SUCCESS', payload: data });
				}
			} catch (error) {
				// don't set error as component will be unmounted
				if (error instanceof AbortController) return;

				if (onFailure) onFailure(error, dispatch);
				else dispatch({ type: 'FETCH_FAILURE', error });
			}
		})();

		return () => controller.abort();
	}, [url, onSuccess, onFailure]);

	return [state, setUrl] as const;
};

export default useFetch;
