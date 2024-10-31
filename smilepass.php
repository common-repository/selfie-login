<?php

/*
Plugin Name: Selfie Login
Plugin URI: https://smile-pass.com/
Description: Log in to Wordpress profile with your selfie!
Author: SmilePass Ltd
Version: 1.0.0
*/


define( 'SMILEPASS__PLUGIN_DIR', plugin_dir_path( __FILE__ ) );

require_once( SMILEPASS__PLUGIN_DIR . 'class.smilepass.php' );
require_once( SMILEPASS__PLUGIN_DIR . 'class.smilepass-admin.php' );

register_activation_hook( __FILE__, array( 'Smilepass', 'plugin_activation' ) );
register_deactivation_hook( __FILE__, array( 'Smilepass', 'plugin_deactivation' ) );

if ( !is_admin() ) {
    add_action( 'init', array( 'Smilepass', 'init' ) );
}
else{
    add_action( 'init', array( 'Smilepass_Admin', 'init' ) );
}

