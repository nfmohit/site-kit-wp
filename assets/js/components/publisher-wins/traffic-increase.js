/**
 * `trafficIncrease` function.
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

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { getTimeInSeconds, getModulesData, changeToPercent } from '../../util';
import { parseTotalUsersData } from '../../../js/modules/analytics/util';
import sunImage from '../../../images/sun.png';

const trafficIncrease = ( reports, id ) => {
	const modulesData = getModulesData();

	if ( ! modulesData.analytics || ! modulesData.analytics.active ) {
		return false;
	}

	if ( ! Array.isArray( reports ) ) {
		return false;
	}

	const totals = reports?.[0]?.data?.totals || [];
	const { totalUsers, previousTotalUsers } = parseTotalUsersData( totals );
	const totalUsersChange = Number( changeToPercent( previousTotalUsers, totalUsers ) );

	// Adds threshold to show data only between 10-100 percent change.
	if ( 10 > totalUsersChange || 100 < totalUsersChange ) {
		return false;
	}

	return {
		id,
		title: __( 'Congrats on more website visitors!', 'google-site-kit' ),
		description: __( 'You had a record-high amount of visitors to your website yesterday.', 'google-site-kit' ),
		dismiss: __( 'OK, Got it!', 'google-site-kit' ),
		format: 'large',
		winImage: global._googlesitekitLegacyData.admin.assetsRoot + sunImage,
		blockData:
			[
				{
					title: __( 'Site Visitors', 'google-site-kit' ),
					datapoint: totalUsers,
					datapointUnit: '',
				},
				{
					title: __( 'Increase', 'google-site-kit' ),
					datapoint: totalUsersChange,
					datapointUnit: '%',
				},
			],
		type: 'win-stats',
		dismissExpires: getTimeInSeconds( 'week' ),
		showOnce: true,
	};
};

export default trafficIncrease;
