<?php

class Smilepass {
    
    const API_HOST = 'ln.smile-pass.com';
    
    private static $initiated = false;
    
    public static function init(){
        if(!self::$initiated){
            self::init_hooks();
        }
    }
    
    private static function init_hooks(){
        self::$initiated = true;
        wp_enqueue_script( 'modernizr.js', plugins_url( 'js/modernizr.js', __FILE__ ));
        wp_enqueue_style( 'smilepass.css', plugins_url( 'css/smilepass.css', __FILE__ ));
        
        add_shortcode( 'SMILEPASS_LOGIN', array( 'Smilepass', 'smilepass_display') );
        //add_action( 'login_head',  array( 'Smilepass', 'render_camera_box') );

        $val = get_option('smilepass-admin'); 

        if ( $val['login_form'] == 1 ) { //login
            add_action( 'login_form',  array( 'Smilepass','smilepass_display') );
            //add_action( 'authenticate',  array( 'Smilepass','smilepass_check') );
        }

        if ( $val['register_form'] == 1  ) {//register
            //add_action( 'register_form',  array( 'Smilepass','smilepass_display') );
            //add_action( 'registration_errors', array( 'Smilepass','smilepass_check') ); 
        }

        if ( $val['reset_password_form'] == 1 ) { //lost password
            //add_action( 'lostpassword_form',  array( 'Smilepass','smilepass_display') );
            //add_action( 'allow_password_reset', array( 'Smilepass','smilepass_check') );
        }
    }
    
    public static function smilepass_display(){
        self::render_camera_box('frontend');
    }
    
    public static function render_camera_box($mode = 'backend'){
        
        if(isset($_POST['face_login_deprecated'])){
            foreach($_POST['face_login_deprecated'] as $user_id){
                add_user_meta( $user_id, 'face_login_deprecated', 1);
            }
        }
        
        $option = get_option('smilepass-admin');
        $html = '';
        $html .=   '<div class="camera-box-wrapper" '.($mode == 'frontend' ? 'style="display:none;"' : '').'> '.
                       ($mode == 'backend' ? '<h3>Live image</h3>' : '<h3 style="margin-bottom:10px;">Capture a selfie to Log In</h3>')
                        .'<div id="camera-box" class="camera-box-container">
                            <div id="camera" class="camera clearfix"></div>
                        </div>
                        <h3 style="display:none;" class="captured-img-string">Captured images</h3>
                        <div id="photo-wrapper"></div>
                        <br>'.
                        ($mode == 'backend' ? '<div><a class="btn process-btn button button-secondary button-large" href="#">Enroll</a></div>' : '<a class="btn button-primary button-large process-login-btn" href="#">Log In</a>').'
                    </div>'.
                        ($mode == 'backend' ?  '<form id="face-login-access-form" method="post">
                                                    <input type="submit" name="face_login_access_manage" class="button button-primary button-large btn-safe" style="display:none;" value="Save" />
                                                </form>' : '').
                        ($mode == 'frontend' ?  '<p class="clearfix" style="margin-bottom:20px;"><a href="#" id="camera-toggler" class="button button-secondary button-large">
                                                    Log In with selfie
                                                </a></p>' : '').'                    
                    <script>
                        var mode = "'.$mode.'";
                        var userID = "'.get_current_user_id().'";
                        var apiServer = "'.$option['api_url'].'";
                        var apiKey = "'.$option['api_key'].'";
                        var apiSecret = "'.$option['api_secret'].'";
                        var numberOfPhotos = '.$option['number_of_photos'].';
                        var minNumberOfMatches = '.$option['min_number_of_matches'].';
                        var maxNumberOfLoginPhotos = '.(isset($option['max_number_of_login_photos']) && $option['max_number_of_login_photos'] > 1 ? $option['max_number_of_login_photos'] : 1).';
                        var namespace = "'.$option['namespace'].'";
                        var siteURL = "'.get_site_url().'";
                    </script>
                    
                    <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery.min.js"></script>    
                    <script src="'.plugins_url( '', __FILE__ ).'/js/FaceApiClient.js"></script>
                    <script src="'.plugins_url( '', __FILE__ ).'/js/webcam.js"></script> 
                    <script src="'.plugins_url( '', __FILE__ ).'/js/smilepass.js"></script>'; 
        
        print $html;
    }
    
    public static function plugin_activation(){
/*        
        global $wpdb;
    
        $the_page_title = 'Smilepass login page';
        $the_page_name = 'smilepass-login-page';
    
        // the menu entry...
        delete_option("smilepass_page_title");
        add_option("smilepass_page_title", $the_page_title, '', 'yes');
        // the slug...
        delete_option("smilepass_page_name");
        add_option("smilepass_page_name", $the_page_name, '', 'yes');
        // the id...
        delete_option("smilepass_page_id");
        add_option("smilepass_page_id", '0', '', 'yes');
    
        $the_page = get_page_by_title( $the_page_title );
    
        if ( ! $the_page ) {
    
            // Create post object
            $_p = array();
            $_p['post_title'] = $the_page_title;
            $_p['post_content'] = '[SMILEPASS_LOGIN]';
            $_p['post_status'] = 'publish';
            $_p['post_type'] = 'page';
            $_p['comment_status'] = 'closed';
            $_p['ping_status'] = 'closed';
            $_p['post_category'] = array(1); // the default 'Uncatrgorised'
    
            // Insert the post into the database
            $the_page_id = wp_insert_post( $_p );
    
        }
        else {
            // the plugin may have been previously active and the page may just be trashed...
    
            $the_page_id = $the_page->ID;
    
            //make sure the page is not trashed...
            $the_page->post_status = 'publish';
            $the_page->post_content = '[SMILEPASS_LOGIN]';
            $the_page_id = wp_update_post( $the_page );
    
        }
    
        delete_option( 'smilepass_page_id' );
        add_option( 'smilepass_page_id', $the_page_id );
*/    
    }
    
    public static function plugin_deactivation(){
/*
        global $wpdb;
    
        $the_page_title = get_option( "smilepass_page_title" );
        $the_page_name = get_option( "smilepass_page_name" );
    
        //  the id of our page...
        $the_page_id = get_option( 'smilepass_page_id' );
        if( $the_page_id ) {
    
            wp_delete_post( $the_page_id ); // this will trash, not delete
    
        }
    
        delete_option("smilepass_page_title");
        delete_option("smilepass_page_name");
        delete_option("smilepass_page_id");    
*/
    }
}
