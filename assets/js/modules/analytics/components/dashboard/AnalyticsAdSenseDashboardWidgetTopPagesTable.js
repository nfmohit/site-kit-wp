/**
 * AnalyticsAdSenseDashboardWidgetTopPagesTable component.
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
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { getTimeInSeconds, numberFormat, getModulesData } from '../../../../util';
import withData from '../../../../components/higherorder/withdata';
import { TYPE_MODULES } from '../../../../components/data';
import { getDataTableFromData, TableOverflowContainer } from '../../../../components/data-table';
import Layout from '../../../../components/layout/layout';
import PreviewTable from '../../../../components/preview-table';
import ctaWrapper from '../../../../components/notifications/cta-wrapper';
import AdSenseLinkCTA from '../common/AdSenseLinkCTA';
import { analyticsAdsenseReportDataDefaults, isDataZeroForReporting } from '../../util';
import { STORE_NAME } from '../../datastore/constants';
import { STORE_NAME as ADSENSE_STORE } from '../../../adsense/datastore/constants';
import { STORE_NAME as SEARCH_CONSOLE_STORE } from '../../../search-console/datastore/constants';

const { useSelect } = Data;

const RenderLayout = ( { children } ) => {
	const adSenseAccountID = useSelect( ( select ) => select( ADSENSE_STORE ).getAccountID() );
	const propertyURL = useSelect( ( select ) => select( SEARCH_CONSOLE_STORE ).getPropertyID() );
	const accountURL = useSelect( ( select ) => select( ADSENSE_STORE ).getServiceURL(
		{
			path: `/${ adSenseAccountID }/home`,
			query: {
				source: 'site-kit',
				url: propertyURL,
			},
		}
	) );
	return (
		<Layout
			header
			title={ __( 'Performance over previous 28 days', 'google-site-kit' ) }
			headerCtaLabel={ __( 'Advanced Settings', 'google-site-kit' ) }
			headerCtaLink={ accountURL }>
			{ children }
		</Layout>
	);
};

const AnalyticsAdSenseDashboardWidgetTopPagesTable = ( { data } ) => {
	const accountID = useSelect( ( select ) => select( STORE_NAME ).getAccountID() );
	const profileID = useSelect( ( select ) => select( STORE_NAME ).getProfileID() );
	const internalWebPropertyID = useSelect( ( select ) => select( STORE_NAME ).getInternalWebPropertyID() );

	const adsenseDeepLink = useSelect( ( select ) => select( STORE_NAME ).getServiceURL(
		{ path: `/report/content-pages/a${ accountID }w${ internalWebPropertyID }p${ profileID }/explorer-table.plotKeys=%5B%5D&_r.drilldown=analytics.pagePath:~2F` }
	) );
	// Do not return zero data callout here since it will already be
	// present on the page from other sources.
	if ( isDataZeroForReporting( data ) ) {
		return null;
	}

	const headers = [
		{
			title: __( 'Page Title', 'google-site-kit' ),
			tooltip: __( 'Page Title', 'google-site-kit' ),
			primary: true,
		},
		{
			title: __( 'Earnings', 'google-site-kit' ),
			tooltip: __( 'Earnings', 'google-site-kit' ),
		},
		{
			title: __( 'Page RPM', 'google-site-kit' ),
			tooltip: __( 'Page RPM', 'google-site-kit' ),
		},
		{
			title: __( 'Impressions', 'google-site-kit' ),
			tooltip: __( 'Impressions', 'google-site-kit' ),
		},
	];

	const dataMapped = map( data[ 0 ].data.rows, ( row ) => {
		/**
		 * dimensions[0] = ga:pageTitle
		 * dimensions[1] = ga:pagePath
		 *
		 * metrics[0] = ga:adsenseECPM
		 * metrics[1] = ga:adsensePageImpressions
		 * metrics[2] = ga:adsenseRevenue
		 */
		return [
			row.dimensions[ 0 ],
			Number( row.metrics[ 0 ].values[ 0 ] ).toFixed( 2 ),
			Number( row.metrics[ 0 ].values[ 1 ] ).toFixed( 2 ),
			numberFormat( row.metrics[ 0 ].values[ 2 ] ),
		];
	} );

	const linksMapped = map( data[ 0 ].data.rows, ( row ) => {
		const pagePath = row.dimensions[ 1 ].replace( /\//g, '~2F' );
		return adsenseDeepLink + pagePath;
	} );

	const options = {
		hideHeader: false,
		chartsEnabled: false,
		links: linksMapped,
	};

	const dataTable = getDataTableFromData( dataMapped, headers, options );

	return (
		<RenderLayout>
			<TableOverflowContainer>
				{ dataTable }
			</TableOverflowContainer>
		</RenderLayout>
	);
};

/**
 * Check error data response, and handle the INVALID_ARGUMENT specifically.
 *
 * @param {Object} data Response data.
 *
 * @return {(string|boolean|null)}  Returns a string with an error message if there is an error. Returns `false` when there is no data and no error message. Will return `null` when arguments are invalid.
 *                            string   data error message if it exists or unidentified error.
 *                            false    if no data and no error message
 *                            null     if invalid argument
 *
 */
const getDataError = ( data ) => {
	if ( data.code && data.message && data.data && data.data.status ) {
		// Specifically looking for string "badRequest"
		if ( 'badRequest' === data.data.reason ) {
			return <RenderLayout>{ ctaWrapper( <AdSenseLinkCTA />, false, false, true ) }</RenderLayout>;
		}

		return data.message;
	}

	// Legacy errors? Maybe this is never hit but better be safe than sorry.
	if ( data.error ) {
		// We don't want to show error as AdsenseDashboardOutro will be rendered for this case.
		if ( 400 === data.error.code && 'INVALID_ARGUMENT' === data.error.status && getModulesData().analytics.active ) {
			return null;
		}

		if ( data.error.message ) {
			return data.error.message;
		}

		if ( data.error.errors && data.error.errors[ 0 ] && data.error.errors[ 0 ].message ) {
			return data.error.errors[ 0 ].message;
		}

		return __( 'Unidentified error', 'google-site-kit' );
	}

	return false;
};

export default withData(
	AnalyticsAdSenseDashboardWidgetTopPagesTable,
	[
		{
			type: TYPE_MODULES,
			identifier: 'analytics',
			datapoint: 'report',
			data: analyticsAdsenseReportDataDefaults,
			priority: 1,
			maxAge: getTimeInSeconds( 'day' ),
			context: 'Single',
		},
	],
	<RenderLayout><PreviewTable padding /></RenderLayout>,
	{ createGrid: true },
	// Force isDataZero to false since it is handled within the component.
	() => false,
	getDataError
);
