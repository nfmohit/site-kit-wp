/**
 * `core/site` data store: Error info.
 *
 * Site Kit by Google, Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * External dependencies
 */
import invariant from 'invariant';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';

// Actions
const SET_SERVER_ERROR = 'SET_SERVER_ERROR';
const CLEAR_SERVER_ERROR = 'CLEAR_SERVER_ERROR';

const baseInitialState = {
	internalServerError: {},
};

const baseActions = {
	/**
	 * Sets the internal server error.
	 *
	 * @since n.e.x.t
	 *
	 * @param {Object} internalServerError Internal server error object.
	 * @return {Object} Redux-style action.
	 */
	setInternalServerError( internalServerError ) {
		invariant( internalServerError, 'internalServerError is required.' );

		return {
			type: SET_SERVER_ERROR,
			payload: { internalServerError },
		};
	},

	/**
	 * Clears the internal server error, if one was previously set.
	 *
	 * @since n.e.x.t
	 *
	 * @return {Object} Redux-style action.
	 */
	clearInternalServerError() {
		return {
			type: CLEAR_SERVER_ERROR,
			payload: {},
		};
	},
};

export const baseReducer = ( state, { type, payload } ) => {
	switch ( type ) {
		case SET_SERVER_ERROR: {
			return {
				...state,
				internalServerError: payload.internalServerError,
			};
		}

		case CLEAR_SERVER_ERROR: {
			return {
				...state,
				internalServerError: null,
			};
		}

		default: {
			return state;
		}
	}
};

const baseResolvers = {};

const baseSelectors = {
	/**
	 * Gets the internal server error.
	 *
	 * @since n.e.x.t
	 * @private
	 *
	 * @param {Object} state Data store's state.
	 * @return {(Object|undefined)} Error info.
	 */
	getInternalServerError( state ) {
		const { internalServerError } = state;
		return internalServerError;
	},
};

const store = Data.combineStores(
	{
		initialState: baseInitialState,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const initialState = store.initialState;
export const actions = store.actions;
export const controls = store.controls;
export const reducer = store.reducer;
export const resolvers = store.resolvers;
export const selectors = store.selectors;

export default store;
