/**
 * Notification component.
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
import PropTypes from 'prop-types';
import SvgIcon from 'GoogleUtil/svg-icon';
import classnames from 'classnames';
import { map } from 'lodash';
/**
 * WordPress dependencies
 */
import { Component, Fragment, createRef, isValidElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { sanitizeHTML } from '../../util/sanitize';
import data from '../data';
import DataBlock from '../data-block';
import Button from '../button';
import Warning from '../notifications/warning';
import Error from '../notifications/error';
import Link from '../link';

class Notification extends Component {
	constructor( props ) {
		super( props );

		this.state = {
			isClosed: false,
		};

		this.cardRef = createRef();

		this.handleDismiss = this.handleDismiss.bind( this );
		this.handleCTAClick = this.handleCTAClick.bind( this );

		if ( 0 < this.props.dismissExpires ) {
			this.expireDismiss();
		}

		if ( this.props.showOnce ) {
			data.setCache( `notification::displayed::${ this.props.id }`, new Date() );
		}
	}

	async handleDismiss( e ) {
		e.persist();
		e.preventDefault();

		const { onDismiss } = this.props;

		if ( onDismiss ) {
			await onDismiss( e );
		}

		this.dismiss();
	}

	dismiss() {
		const card = this.cardRef.current;

		this.setState( {
			isClosed: true,
		} );

		setTimeout( () => {
			data.setCache( `notification::dismissed::${ this.props.id }`, new Date() );
			card.style.display = 'none';

			const event = new Event( 'notificationDismissed' );
			document.dispatchEvent( event );
		}, 350 );
	}

	async handleCTAClick( e ) {
		e.persist();

		const { isDismissable, onCTAClick } = this.props;

		if ( onCTAClick ) {
			await onCTAClick( e );
		}

		if ( isDismissable ) {
			this.dismiss();
		}
	}

	expireDismiss() {
		const {
			id,
			dismissExpires,
		} = this.props;

		const dismissed = data.getCache( `notification::dismissed::${ id }` );

		if ( dismissed ) {
			const expiration = new Date( dismissed );
			expiration.setSeconds( expiration.getSeconds() + parseInt( dismissExpires, 10 ) );

			if ( expiration < new Date() ) {
				data.deleteCache( `notification::dismissed::${ id }` );
			}
		}
	}

	render() {
		const { isClosed } = this.state;
		const {
			children,
			id,
			title,
			description,
			blockData,
			winImage,
			smallImage,
			format,
			learnMoreURL,
			learnMoreDescription,
			learnMoreLabel,
			ctaLink,
			ctaLabel,
			ctaTarget,
			type,
			dismiss,
			isDismissable,
			logo,
			module,
			moduleName,
			pageIndex,
		} = this.props;

		if ( data.getCache( `notification::dismissed::${ id }` ) ) {
			return null;
		}

		const closedClass = isClosed ? 'is-closed' : 'is-open';
		const inlineLayout = 'large' === format && 'win-stats-increase' === type;

		let layout = 'mdc-layout-grid__cell--span-12';
		if ( 'large' === format ) {
			layout = 'mdc-layout-grid__cell--order-2-phone ' +
				'mdc-layout-grid__cell--order-1-tablet ' +
				'mdc-layout-grid__cell--span-6-tablet ' +
				'mdc-layout-grid__cell--span-8-desktop ';

			if ( inlineLayout ) {
				layout = 'mdc-layout-grid__cell--order-2-phone ' +
						'mdc-layout-grid__cell--order-1-tablet ' +
						'mdc-layout-grid__cell--span-5-tablet ' +
						'mdc-layout-grid__cell--span-8-desktop ';
			}
		} else if ( 'small' === format ) {
			layout = 'mdc-layout-grid__cell--span-11-desktop ' +
				'mdc-layout-grid__cell--span-7-tablet ' +
				'mdc-layout-grid__cell--span-3-phone';
		}

		let icon;
		if ( 'win-warning' === type ) {
			icon = <Warning />;
		} else if ( 'win-error' === type ) {
			icon = <Error />;
		} else {
			icon = '';
		}

		const dataBlockMarkup = (
			<Fragment>
				{ blockData &&
					<div className="mdc-layout-grid__inner">
						{
							map( blockData, ( block, i ) => {
								return (
									<div
										key={ i }
										className={ classnames(
											'mdc-layout-grid__cell',
											{
												'mdc-layout-grid__cell--span-5-desktop': inlineLayout,
												'mdc-layout-grid__cell--span-4-desktop': ! inlineLayout,
											}
										) }
									>
										<div className="googlesitekit-publisher-win__stats">
											<DataBlock { ...block } />
										</div>
									</div>
								);
							} )
						}
					</div>
				}
			</Fragment>
		);

		const inlineMarkup = (
			<Fragment>
				{ title &&
					<h3 className="googlesitekit-heading-2 googlesitekit-publisher-win__title">
						{ title }
					</h3>
				}
				{ description &&
					<div className="googlesitekit-publisher-win__desc">
						<p>
							{ isValidElement( description ) ? description : (
								<span dangerouslySetInnerHTML={ sanitizeHTML( description, {
									ALLOWED_TAGS: [ 'strong', 'em', 'br', 'a' ],
									ALLOWED_ATTR: [ 'href' ],
								} ) } />
							) }

							{ learnMoreLabel &&
								<Fragment>
									{ ' ' }
									<Link href={ learnMoreURL } external inherit>
										{ learnMoreLabel }
									</Link>
									{ learnMoreDescription }
								</Fragment>
							}
							{ pageIndex &&
								<span className="googlesitekit-publisher-win__detect">{ pageIndex }</span>
							}
						</p>
					</div>
				}
				{ children }
			</Fragment>
		);

		const logoSVG = module ? <SvgIcon id={ module } height="19" width="19" /> : <SvgIcon id={ 'logo-g' } height="34" width="32" />;

		return (
			<section
				ref={ this.cardRef }
				className={ classnames(
					'googlesitekit-publisher-win',
					{
						[ `googlesitekit-publisher-win--${ format }` ]: format,
						[ `googlesitekit-publisher-win--${ type }` ]: type,
						[ `googlesitekit-publisher-win--${ closedClass }` ]: closedClass,
					}
				) }
			>
				<div className="mdc-layout-grid">
					<div className="mdc-layout-grid__inner">

						{ logo &&
							<div className={ classnames(
								'mdc-layout-grid__cell',
								'mdc-layout-grid__cell--span-12',
								{
									'mdc-layout-grid__cell--order-2-phone': inlineLayout,
									'mdc-layout-grid__cell--order-1-tablet': inlineLayout,
								}
							) }>
								<div className="googlesitekit-publisher-win__logo">
									{ logoSVG }
								</div>
								{ moduleName &&
									<div className="googlesitekit-publisher-win__module-name">
										{ moduleName }
									</div>
								}
							</div>
						}

						{ smallImage &&
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-1
							">
								<img className="googlesitekit-publisher-win__small-image" alt="" src={ smallImage } />
							</div>
						}

						<div className={ classnames(
							'mdc-layout-grid__cell',
							layout
						) } >

							{ inlineLayout ? (
								<div className="mdc-layout-grid__inner">
									<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-5-desktop mdc-layout-grid__cell--span-8-tablet">
										{ inlineMarkup }
									</div>
									<div className="mdc-layout-grid__cell mdc-layout-grid__cell--span-7-desktop mdc-layout-grid__cell--span-8-tablet mdc-layout-grid__cell--align-bottom">
										{ dataBlockMarkup }
									</div>
								</div>
							) : (
								<Fragment>
									{ inlineMarkup }
									{ dataBlockMarkup }
								</Fragment>
							) }

							{ ctaLink &&
								<Button
									href={ ctaLink }
									target={ ctaTarget }
									onClick={ this.handleCTAClick }
								>
									{ ctaLabel }
								</Button>
							}

							{ isDismissable && dismiss &&
								<Link onClick={ this.handleDismiss }>
									{ dismiss }
								</Link>
							}

						</div>

						{ winImage &&
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--order-1-phone
								mdc-layout-grid__cell--order-2-tablet
								mdc-layout-grid__cell--span-2-tablet
								mdc-layout-grid__cell--span-4-desktop
							">
								<div className="googlesitekit-publisher-win__image-large">
									<img alt="" src={ winImage } />
								</div>
							</div>
						}

						{ ( 'win-error' === type || 'win-warning' === type ) &&
							<div className="
								mdc-layout-grid__cell
								mdc-layout-grid__cell--span-1
							">
								<div className="googlesitekit-publisher-win__icons">
									{ icon }
								</div>
							</div>
						}

					</div>
				</div>
			</section>
		);
	}
}

Notification.propTypes = {
	id: PropTypes.string.isRequired,
	title: PropTypes.string.isRequired,
	description: PropTypes.node,
	learnMoreURL: PropTypes.string,
	learnMoreDescription: PropTypes.string,
	learnMoreLabel: PropTypes.string,
	blockData: PropTypes.array,
	winImage: PropTypes.string,
	smallImage: PropTypes.string,
	format: PropTypes.string,
	ctaLink: PropTypes.string,
	ctaLabel: PropTypes.string,
	type: PropTypes.string,
	dismiss: PropTypes.string,
	isDismissable: PropTypes.bool,
	logo: PropTypes.bool,
	module: PropTypes.string,
	moduleName: PropTypes.string,
	pageIndex: PropTypes.string,
	dismissExpires: PropTypes.number,
	showOnce: PropTypes.bool,
	onCTAClick: PropTypes.func,
	onDismiss: PropTypes.func,
};

Notification.defaultProps = {
	isDismissable: true,
	dismissExpires: 0,
	showOnce: false,
};

export default Notification;
