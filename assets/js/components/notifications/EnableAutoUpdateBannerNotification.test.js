/**
 * EnableAutoUpdateBannerNotification component tests.
 *
 * Site Kit by Google, Copyright 2022 Google LLC
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
 * Internal dependencies
 */
import {
	render,
	createTestRegistry,
	screen,
	waitFor,
	act,
	fireEvent,
} from '../../../../tests/js/test-utils';
import { CORE_SITE } from '../../googlesitekit/datastore/site/constants';
import EnableAutoUpdateBannerNotification from './EnableAutoUpdateBannerNotification';
import useQueryArg from '../../hooks/useQueryArg';
import { CORE_USER } from '../../googlesitekit/datastore/user/constants';
import * as apiCache from '../../googlesitekit/api/cache';

jest.mock( '../../hooks/useQueryArg' );

// Set up mockImplementation for `useQueryArg` used in this component,
// so we can set the query params used to check whether this is a new Site Kit
// setup.
function stubMockUseQueryArg( isNewPluginInstall = false ) {
	useQueryArg.mockImplementation( ( queryArg ) => {
		if ( isNewPluginInstall && queryArg === 'notification' ) {
			return [ 'authentication_success' ];
		}
		return [ false ];
	} );
}

describe( 'EnableAutoUpdateBannerNotification', () => {
	const registry = createTestRegistry();

	beforeEach( () => {
		stubMockUseQueryArg();

		jest.spyOn( apiCache, 'getItem' ).mockImplementation( () => {
			return Promise.resolve( {
				cacheHit: false,
				value: undefined,
			} );
		} );

		jest.spyOn( apiCache, 'setItem' ).mockImplementation( () => {
			return Promise.resolve( true );
		} );

		fetchMock.get( /^\/google-site-kit\/v1\/core\/user\/data\/nonces/, {
			body: { updates: '751b9198d2' },
			status: 200,
		} );
	} );

	afterEach( () => {
		useQueryArg.mockClear();
		apiCache.setItem.mockClear();
		apiCache.getItem.mockClear();
	} );

	it( 'should display the notification if Site Kit was not recently set up and user can update plugins', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect(
			await screen.findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();
	} );

	it( 'should not show the notification when auto updates are already enabled for Site Kit', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification when user can not update plugins', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
			siteKitAutoUpdatesEnabled: false,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: false,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification if plugin auto updates can not be enabled', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: false,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should not show the notification when hide banner cache key is set', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		jest.spyOn( apiCache, 'getItem' ).mockImplementation( () => {
			return Promise.resolve( {
				cacheHit: true,
				value: true,
				isError: false,
			} );
		} );

		const { container } = render( <EnableAutoUpdateBannerNotification />, {
			registry,
		} );

		await waitFor( () =>
			expect( apiCache.getItem ).toHaveBeenCalledTimes( 1 )
		);

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should send enable-auto-updates post request to admin-ajax on CTA click.', async () => {
		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
			pluginBasename: 'google-site-kit/google-site-kit.php',
		} );

		await registry.dispatch( CORE_USER ).receiveNonces( {
			updates: '751b9198d2',
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		global.ajaxurl = 'admin-ajax.php';

		fetchMock.postOnce( /^\/admin-ajax.php/, {
			body: { success: true },
			status: 200,
		} );

		act( () => {
			render( <EnableAutoUpdateBannerNotification />, {
				registry,
			} );
		} );

		expect(
			await screen.findByText( 'Keep Site Kit up-to-date' )
		).toBeInTheDocument();

		fireEvent.click( screen.getByText( 'Enable auto-updates' ) );

		await waitFor( () => expect( fetchMock ).toHaveFetchedTimes( 1 ) );

		delete global.ajaxurl;
	} );

	it( 'should not show the notification directly after Site Kit initial setup', async () => {
		stubMockUseQueryArg( true );

		await registry.dispatch( CORE_SITE ).receiveSiteInfo( {
			changePluginAutoUpdatesCapacity: true,
		} );

		await registry.dispatch( CORE_USER ).receiveCapabilities( {
			googlesitekit_update_plugins: true,
		} );

		let container;

		act( () => {
			( { container } = render( <EnableAutoUpdateBannerNotification />, {
				registry,
			} ) );
		} );

		await waitFor( () =>
			// When the component is rendered after the initial
			// Site Kit setup, we hide the notification and prevent
			// it from being displayed for ten minutes.
			//
			// Wait until that `setItem` call delaying the
			// notification is called before checking the output
			// of the component.
			expect( apiCache.setItem ).toHaveBeenCalledTimes( 1 )
		);

		expect( container ).toBeEmptyDOMElement();
	} );
} );
