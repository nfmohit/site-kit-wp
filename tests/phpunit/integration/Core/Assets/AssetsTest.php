<?php
/**
 * AssetsTest
 *
 * @package   Google\Site_Kit\Tests\Core\Assets
 * @copyright 2021 Google LLC
 * @license   https://www.apache.org/licenses/LICENSE-2.0 Apache License 2.0
 * @link      https://sitekit.withgoogle.com
 */

namespace Google\Site_Kit\Tests\Core\Assets;

use Google\Site_Kit\Context;
use Google\Site_Kit\Core\Assets\Assets;
use Google\Site_Kit\Core\Authentication\Authentication;
use Google\Site_Kit\Core\Dismissals\Dismissed_Items;
use Google\Site_Kit\Core\Modules\Module_Sharing_Settings;
use Google\Site_Kit\Core\Modules\Modules;
use Google\Site_Kit\Core\Permissions\Permissions;
use Google\Site_Kit\Core\Storage\Options;
use Google\Site_Kit\Core\Storage\User_Options;
use Google\Site_Kit\Tests\Fake_Site_Connection_Trait;
use Google\Site_Kit\Tests\TestCase;

/**
 * @group Assets
 */
class AssetsTest extends TestCase {
	use Fake_Site_Connection_Trait;

	// The actions and filters below only get registered for users that can
	// authorize with Site Kit.
	private $authorized_actions = array(
		'admin_print_scripts',
		'wp_print_scripts',
		'admin_print_styles',
		'wp_print_styles',
	);
	private $authorized_filters = array(
		// Both script_loader_tag and style_loader_tag are hooked by add_amp_dev_mode_attributes
		// which requires authorization, however script_loader_tag is also filtered
		// to apply script_execution attributes for all users, so it must be excluded here.
		// 'script_loader_tag',
		'style_loader_tag',
	);

	public function set_up() {
		parent::set_up();

		wp_scripts()->registered = array();
		wp_scripts()->queue      = array();
		wp_styles()->registered  = array();
		wp_styles()->queue       = array();
	}

	public function test_register() {
		$actions_to_test = array(
			'admin_enqueue_scripts',
			'wp_enqueue_scripts',
		);
		foreach ( $actions_to_test as $hook ) {
			remove_all_actions( $hook );
		}

		foreach ( $this->authorized_actions as $hook ) {
			remove_all_actions( $hook );
		}
		foreach ( $this->authorized_filters as $hook ) {
			remove_all_filters( $hook );
		}

		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );
		$assets->register();

		foreach ( $actions_to_test as $hook ) {
			$this->assertTrue( has_action( $hook ), "Failed asserting that action was added to {$hook}." );
		}

		// Without a user that can authenticate with Site Kit, these hooks
		// should not have been added.
		foreach ( $this->authorized_actions as $hook ) {
			$this->assertFalse( has_action( $hook ), "Failed asserting that action was not added to {$hook}." );
		}
		foreach ( $this->authorized_filters as $hook ) {
			$this->assertFalse( has_filter( $hook ), "Failed asserting that filter was not added to {$hook}." );
		}

		// For a user that can authenticate, ensure the hooks are added.
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$assets->register();
		foreach ( $this->authorized_actions as $hook ) {
			$this->assertTrue( has_action( $hook ), "Failed asserting that action was added to {$hook}." );
		}
		foreach ( $this->authorized_filters as $hook ) {
			$this->assertTrue( has_filter( $hook ), "Failed asserting that filter was added to {$hook}." );
		}
	}

	public function test_register_dashboard_sharing() {
		// For a user that can view shared dashboard, ensure the hooks are added.
		$this->enable_feature( 'dashboardSharing' );
		$contributor = self::factory()->user->create_and_get( array( 'role' => 'contributor' ) );

		$context         = new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE );
		$assets          = new Assets( $context );
		$settings        = new Module_Sharing_Settings( new Options( $context ) );
		$user_options    = new User_Options( $context, $contributor->ID );
		$dismissed_items = new Dismissed_Items( $user_options );
		$authentication  = new Authentication( $context, null, $user_options );
		$modules         = new Modules( $context, null, $user_options, $authentication );
		$dismissed_items = new Dismissed_Items( $user_options );
		$permissions     = new Permissions( $context, $authentication, $modules, $user_options, $dismissed_items );

		$dismissed_items->add( 'shared_dashboard_splash', 0 );
		$test_sharing_settings = array(
			'analytics'      => array(
				'sharedRoles' => array( 'contributor' ),
				'management'  => 'all_admins',
			),
			'search-console' => array(
				'management' => 'owner',
			),
		);
		$settings->set( $test_sharing_settings );
		$permissions->register();

		// Make sure SiteKit is setup.
		$this->fake_proxy_site_connection();
		add_filter( 'googlesitekit_setup_complete', '__return_true', 100 );
		$this->assertTrue( $authentication->is_setup_completed() );

		wp_set_current_user( $contributor->ID );
		$assets->register();
		foreach ( $this->authorized_actions as $hook ) {
			$this->assertTrue( has_action( $hook ), "Failed asserting that action was added to {$hook}." );
		}
		foreach ( $this->authorized_filters as $hook ) {
			$this->assertTrue( has_filter( $hook ), "Failed asserting that filter was added to {$hook}." );
		}
	}

	public function test_enqueue_asset_with_unknown() {
		$this->assertFalse( wp_script_is( 'unknown_script', 'enqueued' ) );

		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		$assets->enqueue_asset( 'unknown_script' );

		$this->assertFalse( wp_script_is( 'unknown_script', 'enqueued' ) );
	}

	public function test_enqueue_fonts() {
		$this->setExpectedDeprecated( Assets::class . '::enqueue_fonts' );
		remove_all_actions( 'login_enqueue_scripts' );

		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		add_action( 'login_enqueue_scripts', array( $assets, 'enqueue_fonts' ) );
		do_action( 'login_enqueue_scripts' );

		// Ensure the method does not execute its logic twice (via the above once check).
		do_action( 'login_enqueue_scripts' );

		$this->assertTrue( has_action( 'login_head' ) );
	}

	public function test_run_before_print_callbacks() {
		$assets = new Assets( new Context( GOOGLESITEKIT_PLUGIN_MAIN_FILE ) );

		remove_all_actions( 'wp_print_scripts' );
		$admin_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin_id );
		$assets->register();

		// Enqueue script that has 'googlesitekit-commons' as dependency.
		$assets->enqueue_asset( 'googlesitekit-main-dashboard' );

		// Ensure that 'googlesitekit-commons' is enqueued too.
		$this->assertTrue( wp_script_is( 'googlesitekit-main-dashboard', 'enqueued' ) );
		$this->assertTrue( wp_script_is( 'googlesitekit-commons', 'enqueued' ) );

		do_action( 'wp_print_scripts' );

		// Ensure that before_print callback for 'googlesitekit-commons' was run (its localized script should be there).
		$localized_script = wp_scripts()->get_data( 'googlesitekit-commons', 'data' );
		$this->assertStringContainsString( 'var _googlesitekitLegacyData = ', $localized_script );
	}
}
