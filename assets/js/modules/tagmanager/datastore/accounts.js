/**
 * `modules/tagmanager` data store: accounts.
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
import API from 'googlesitekit-api';
import Data from 'googlesitekit-data';
import { createValidatedAction } from '../../../googlesitekit/data/utils';
import { CORE_SITE } from '../../../googlesitekit/datastore/site/constants';
import { STORE_NAME, CONTAINER_CREATE } from './constants';
import { actions as containerActions } from './containers';
import { isValidAccountSelection } from '../util/validation';
import { createFetchStore } from '../../../googlesitekit/data/create-fetch-store';
import { ACCOUNT_CREATE } from '../../analytics/datastore/constants';
const { createRegistrySelector } = Data;

// Actions
const RESET_ACCOUNTS = 'RESET_ACCOUNTS';

const fetchGetAccountsStore = createFetchStore( {
	baseName: 'getAccounts',
	controlCallback: () => API.get( 'modules', 'tagmanager', 'accounts', null, { useCache: false } ),
	reducerCallback: ( state, accounts ) => {
		return {
			...state,
			accounts,
		};
	},
} );

export const baseInitialState = {
	accounts: undefined,
};

export const baseActions = {
	/**
	 * Clears received accounts, and unsets related selections.
	 *
	 * The `getAccounts` selector will be invalidated to allow accounts to be re-fetched from the server.
	 *
	 * @since 1.12.0
	 * @private
	 */
	*resetAccounts() {
		const { dispatch } = yield Data.commonActions.getRegistry();

		yield {
			payload: {},
			type: RESET_ACCOUNTS,
		};

		dispatch( STORE_NAME ).invalidateResolutionForStoreSelector( 'getAccounts' );
	},

	/**
	 * Selects the given account and makes related selections.
	 *
	 * @since 1.12.0
	 * @private
	 *
	 * @param {string} accountID Tag Manager account ID to select.
	 */
	selectAccount: createValidatedAction(
		( accountID ) => {
			invariant( isValidAccountSelection( accountID ), 'A valid accountID selection is required to select.' );
		},
		function* ( accountID ) {
			const { select, dispatch } = yield Data.commonActions.getRegistry();

			// Do nothing if the accountID to select is the same as the current.
			if ( accountID === select( STORE_NAME ).getAccountID() ) {
				return;
			}

			dispatch( STORE_NAME ).setAccountID( accountID );
			dispatch( STORE_NAME ).setContainerID( '' );
			dispatch( STORE_NAME ).setInternalContainerID( '' );
			dispatch( STORE_NAME ).setAMPContainerID( '' );
			dispatch( STORE_NAME ).setInternalAMPContainerID( '' );

			if ( ACCOUNT_CREATE === accountID || select( STORE_NAME ).hasExistingTag() ) {
				return;
			}

			// Containers may not be loaded yet for this account,
			// and no selections are done in the getContainers resolver, so we wait here.
			// This will not guarantee that containers exist, as an account may also have no containers
			// it will simply wait for `getContainers` to be resolved for this account ID.
			yield containerActions.waitForContainers( accountID );
			// Trigger cascading selections.
			const { isAMP, isSecondaryAMP } = select( CORE_SITE );
			if ( ! isAMP() || isSecondaryAMP() ) {
				const webContainers = select( STORE_NAME ).getWebContainers( accountID );
				// eslint-disable-next-line sitekit/acronym-case
				const webContainer = webContainers[ 0 ] || { publicId: CONTAINER_CREATE, containerId: '' };
				// eslint-disable-next-line sitekit/acronym-case
				dispatch( STORE_NAME ).setContainerID( webContainer.publicId );
				// eslint-disable-next-line sitekit/acronym-case
				dispatch( STORE_NAME ).setInternalContainerID( webContainer.containerId );
			}

			if ( isAMP() ) {
				const ampContainers = select( STORE_NAME ).getAMPContainers( accountID );
				// eslint-disable-next-line sitekit/acronym-case
				const ampContainer = ampContainers[ 0 ] || { publicId: CONTAINER_CREATE, containerId: '' };
				// eslint-disable-next-line sitekit/acronym-case
				dispatch( STORE_NAME ).setAMPContainerID( ampContainer.publicId );
				// eslint-disable-next-line sitekit/acronym-case
				dispatch( STORE_NAME ).setInternalAMPContainerID( ampContainer.containerId );
			}
		}
	),
};

export const baseReducer = ( state, { type } ) => {
	switch ( type ) {
		case RESET_ACCOUNTS: {
			return {
				...state,
				accounts: undefined,
				settings: {
					...state.settings,
					accountID: undefined,
					ampContainerID: undefined,
					containerID: undefined,
					internalAMPContainerID: undefined,
					internalContainerID: undefined,
				},
			};
		}

		default: {
			return state;
		}
	}
};

export const baseResolvers = {
	*getAccounts() {
		const { select } = yield Data.commonActions.getRegistry();
		let accounts = select( STORE_NAME ).getAccounts();

		// Only fetch accounts if they have not been received yet.
		if ( ! accounts ) {
			( { response: accounts } = yield fetchGetAccountsStore.actions.fetchGetAccounts() );
		}

		if ( accounts?.length && ! select( STORE_NAME ).getAccountID() ) {
			// eslint-disable-next-line sitekit/acronym-case
			yield baseActions.selectAccount( accounts[ 0 ].accountId );
		}
	},
};

export const baseSelectors = {
	/**
	 * Gets all Google Tag Manager accounts this user can access.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {?Array.<Object>} An array of account objects; `undefined` if not loaded.
	 */
	getAccounts( state ) {
		const { accounts } = state;

		return accounts;
	},

	/**
	 * Checks whether accounts are currently being fetched.
	 *
	 * @since 1.11.0
	 *
	 * @param {Object} state Data store's state.
	 * @return {boolean} Whether accounts are currently being fetched or not.
	 */
	isDoingGetAccounts: createRegistrySelector( ( select ) => () => {
		return select( STORE_NAME ).isFetchingGetAccounts();
	} ),
};

const store = Data.combineStores(
	fetchGetAccountsStore,
	{
		initialState: baseInitialState,
		actions: baseActions,
		reducer: baseReducer,
		resolvers: baseResolvers,
		selectors: baseSelectors,
	}
);

export const {
	initialState,
	actions,
	controls,
	reducer,
	resolvers,
	selectors,
} = store;

export default store;
