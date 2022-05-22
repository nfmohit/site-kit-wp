/**
 * SettingsForm component.
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
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Data from 'googlesitekit-data';
import { MODULES_SEARCH_CONSOLE } from '../../datastore/constants';
import { CORE_MODULES } from '../../../../googlesitekit/modules/datastore/constants';
import { PropertySelect } from '../common/';
import StoreErrorNotices from '../../../../components/StoreErrorNotices';
import SettingsNotice from '../../../../components/SettingsNotice/SettingsNotice';
import { TYPE_INFO } from '../../../../components/SettingsNotice/utils';
import WarningIcon from '../../../../../../assets/svg/icons/warning-icon.svg';
import EntityOwnershipChangeNotice from '../../../../components/settings/EntityOwnershipChangeNotice';
const { useSelect } = Data;

export default function SettingsForm() {
	const hasModuleAccess = useSelect( ( select ) =>
		select( CORE_MODULES ).hasModuleAccess( 'search-console' )
	);

	const module = useSelect( ( select ) =>
		select( CORE_MODULES ).getModule( 'search-console' )
	);

	const ownerName = module?.owner?.username
		? module?.owner?.login
		: __( 'Another admin', 'google-site-kit' );

	return (
		<div className="googlesitekit-search-console-settings-fields">
			<StoreErrorNotices
				moduleSlug="search-console"
				storeName={ MODULES_SEARCH_CONSOLE }
			/>

			<div className="googlesitekit-setup-module__inputs">
				<PropertySelect />
			</div>
			{ ! hasModuleAccess && (
				<SettingsNotice
					type={ TYPE_INFO }
					Icon={ WarningIcon }
					notice={ sprintf(
						/* translators: %1$s: module owner's name, %2$s: module name */
						__(
							'%1$s configured %2$s and you don’t have access to this Search Console property. Contact them to share access or change the Search Console property.',
							'google-site-kit'
						),
						ownerName,
						module?.name
					) }
				/>
			) }
			<EntityOwnershipChangeNotice slug="search-console" />
		</div>
	);
}
