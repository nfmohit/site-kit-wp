/**
 * WPDashboard component.
 *
 * Site Kit by Google, Copyright 2019 Google LLC
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
/* eslint camelcase:[0] */

/**
 * External dependencies
 */
import { loadTranslations } from 'GoogleUtil';
import 'GoogleModules';

/**
 * WordPress dependencies
 */
import domReady from '@wordpress/dom-ready';
import { doAction } from '@wordpress/hooks';
import { Component, render } from '@wordpress/element';

/**
 * Internal dependencies
 */
// Load the data module.

import './components/data';
import ErrorHandler from './components/ErrorHandler';
import WPDashboardMain from './components/wp-dashboard/wp-dashboard-main';

class GoogleSitekitWPDashboard extends Component {
	render() {
		return (
			<ErrorHandler>
				<WPDashboardMain />
			</ErrorHandler>
		);
	}
}

// Initialize the app once the DOM is ready.
domReady( () => {
	const renderTarget = document.getElementById( 'js-googlesitekit-wp-dashboard' );

	if ( renderTarget ) {
		loadTranslations();

		render( <GoogleSitekitWPDashboard />, renderTarget );

		/**
		 * Action triggered when the WP Dashboard App is loaded.
	 	*/
		doAction( 'googlesitekit.moduleLoaded', 'WPDashboard' );
	}
} );
