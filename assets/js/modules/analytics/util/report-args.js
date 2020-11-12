/**
 * Report args utils.
 *
 * Site Kit by Google, Copyright 2020 Google LLC
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
import isPlainObject from 'lodash/isPlainObject';
import invariant from 'invariant';

// Constants relevant to the special formatting of the arguments URL segment.
const SLASH_ENCODED = encodeURIComponent( '/' );
const SLASH_ARGS_ENCODED = SLASH_ENCODED.replace( '%', '~' );

/**
 * Converts an object of report arguments into the special URL segment format.
 *
 * @since n.e.x.t
 *
 * @param {Object} reportArgs Object of arguments to convert. Values should not be URL encoded.
 * @return {string} Formatted URL segment.
 */
export const reportArgsToURLSegment = ( reportArgs ) => {
	invariant( isPlainObject( reportArgs ), 'report args must be a plain object' );

	return Object.entries( reportArgs )
		.map( ( [ key, value ] ) => {
			return `${ key }=${ encodeURIComponent( value ).replaceAll( SLASH_ENCODED, SLASH_ARGS_ENCODED ) }`;
		} )
		.join( '&' );
};
