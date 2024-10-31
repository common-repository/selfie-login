var ajax_url = 'https://subscriber.smile-pass.com/ajax'; 
var photos_url = 'https://subscriber.smile-pass.com/upload/'; 
var root_path = '';
var stop_execution = 0;
var stop_execution_timeout = 9000;

Modernizr.on( 'flash', function( result ) { return result; } );
var video_getusermedia = Modernizr.video && Modernizr.getusermedia;
var html5 = true;
var flash = Modernizr.flash;

var face_feature_photos;
var face_feature_active_tag;
var face_feature_file_input_value;

(function($){
 
    $.fn.cameraBox = function() {
        
        // width:height - 4:3
        var viewportWidth = 272;
        var viewportHeight = viewportWidth / 4 * 3;
        var viewRealHeight = 0;

        $('#camera').css('width', viewportWidth+'px');
        $('#camera').css('height', viewportHeight+'px');


        if( video_getusermedia ) {
            try{
                Webcam.attach( '#camera' );
                Webcam.video.addEventListener('playing',function(){
                    var videoWidth = Webcam.video.videoWidth;
                    var videoWidthOrig = videoWidth;
                    var videoHeight = Webcam.video.videoHeight;
                    var videoHeightOrig = videoHeight;

                    viewRealHeight = viewportWidth / videoWidth * videoHeight;

                    if( viewportWidth < videoWidth ) {
                        videoHeight = Math.floor( videoHeight * viewportWidth / videoWidth );
                        videoWidth = viewportWidth;
                    }
                    if( 640 < videoWidth ) {
                        videoHeight = Math.floor( videoHeight * 640 / videoWidth );
                        videoWidth = 640;
                    }
                    Webcam.set({
                        width: videoWidth,
                        height: videoHeight,
                        dest_width: videoWidthOrig,
                        dest_height: videoHeightOrig
                    });
                    html5 = true;
            
                    showShape();
                    
                },false);
            } 
            catch(e) {
                html5 = false;
            }
        }
        else{
            html5 = false;
        }

        if( flash && !html5 ) { // isMobile.iOS() || isMobile.Puffin() || !isMobile.any()
            if(viewportWidth < 215) {
                alert('Sorry, seems like the screen of your device is smaller than required. Please try to pass into landscape and refresh the page.');
            }
            else{
                Webcam.set({
                    force_flash: true,
                    dest_width: 640,
                    dest_height: 480
                });
                Webcam.setSWFLocation('/wp-content/plugins/smilepass/js/webcam.swf');
                Webcam.attach( '#camera' );
            }
        }
        
        Webcam.on( 'error', function() {
            alert('Camera not available. Check it is plugged in and not used with other applications.');
        });
    };
}(jQuery));



$(document).ready(function () {
    
    if(mode == 'backend'){
        $('#camera-box').cameraBox();
    }
    else{
        $('#camera-toggler').click(function(){
            $('.camera-box-wrapper').toggle();
            if($('.camera-box-wrapper').css('display') == 'block'){
                $('#camera-box').cameraBox();

                $(".login label").hide();
                $(".submit").hide();
                $("#camera-toggler").text('Login with e-mail');

            }else{
                
                $(".login label").show();
                $(".submit").show();
                $("#camera-toggler").text('Login with selfie');
            }
            return false;
        });
    }
  	

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////// BUTTONS /////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

    var urls = new Array();
    var counter = $('.photo-wrapper').find('img').length;
	$(".process-btn").on('click', function() {           ////// ENROLLMENT
        if(counter < numberOfPhotos){		
            showLoaderBox();
            Webcam.snap( function(b64data) {
    		    $.ajax({
    		        url: ajax_url,
    		        async: false,
    		        data: { action: 'image_save_wp_plugin', filename: userID+'-'+counter, base64_string: b64data },
    		        type: "POST",
    		        success: function(json) {
    		        	//console.log(json);
    		        	var result = JSON.parse(json);
    		        	var image_url = result.url;
    		        	
    					var client = new FaceApiClient(apiServer, apiKey, apiSecret);
    					var options = new Object();
    					options.detect_all_feature_points = true;
    					options.attributes = 'all';
                        
    					var response;
    					client.facesDetect(image_url, null, options, function(data){
                        	if(stop_execution == 0){
                            	response = data;
                            	var photo = data.photos[0];
                            	if ( photo.tags && photo.tags.length > 0 ) {
                            	    
                                    client.namespaceCreate(namespace); 
                                    
                            	    var params = new Object();
                            	    params.namespace = namespace;
                            	    params.label = userID + '@' + namespace;
                            	    
                            	    client.tagsSave (photo.tags[0].tid, userID, params, function(){
            							$('#photo-wrapper').append($('<img style="width:20%;padding:5px;background-color:white;" src="' + photo.url + '" />'));
            							urls.push(photo.url);
                					    //console.log(urls);
            							counter++;
                                        if(counter == 1){
                                            $('.captured-img-string').show();
                                        }
                    					//console.log(counter);

                                        if (counter == 4){
                                            $('.process-btn').hide();
                                            $('.btn-safe').show();
                                        }
                    					
                    					if(counter == numberOfPhotos){
                    					    
                    					    var uids = 'all';
                    					    var urls_str = urls.join(';');
                                    	    var params = new Object();
                                    	    params.namespace = namespace;
                                    	    
                                    	    var uids_recieved = new Array();
                    					    client.facesRecognize(uids, urls_str, null, params, function(recognoze_data){
                    					        for(var i = 0; i < recognoze_data.photos[0].tags[0].uids.length; i++){
                                                    var uid_recieved = recognoze_data.photos[0].tags[0].uids[i].uid;
                                                    if($.inArray(uid_recieved, uids_recieved) == -1){
                                                        uids_recieved.push(uid_recieved);
                                                    }
                                                }
                                                
                                                if(uids_recieved.length > 1){
                                                   for(var j = 0; j < uids_recieved.length; j++){ 
                                                       var splitted = uids_recieved[i].split('@');
                                                       $('#face-login-access-form').append('<input type="hidden" name="face_login_deprecated[]" value="'+splitted[0]+'" />');
                                                   }
                                                }
                        					});
                    					}
                            	    });
    							}
    							else{
    							    alert('Face not detected');
    							}
    							hideLoaderBox();
    						}
    					});
/*
    					setTimeout(function(){
    						if(!response){
    							stop_execution = 1;
    							hideLoaderBox();
    							alert('Server too busy');
    						}
    					}, stop_execution_timeout);
*/
    		        },
    		        error: function (xhr, ajaxOptions, thrownError) {
    		            alert(thrownError);
    		            hideLoaderBox();
    		        }
    		    });
            });
       	}
       	else{
       	    alert('You can make only ' + numberOfPhotos + ' enrollments!');
       	}
		return false;	
	});
    
    
    var step = 0;
    var with_glasses = false; 
    var eyes_closed = false;
    var eyes_closed_passed = false;
    var mouth_open = false;
    var mouth_open_passed = false;
    var face_params = [];
    var current_face_param = '';
    $(".process-login-btn").on('click', function() {           ////// RECOGNIZE -> LOGIN
    //    console.log('MOTHAFUCKA');
        showLoaderBox();
        Webcam.snap( function(b64data) {
                    
            var client = new FaceApiClient(apiServer, apiKey, apiSecret);
                                        
            var uids = 'all';
            var urls_str = b64data;
            var params = new Object();
            params.namespace = namespace;
            params.threshold = 40;
            
            if(maxNumberOfLoginPhotos != undefined && maxNumberOfLoginPhotos > 1){
                
                if(step == 0){
                    client.facesRecognize(uids, urls_str, null, params, function(data){
                        
                        var photo = data.photos[0];
                        if (photo.tags[0] && photo.tags[0].uids && photo.tags[0].uids.length > 0) {
                            
                            var uid = photo.tags[0].uids[0].uid.split('@');
                            var user_id = uid[0];
        
                            jQuery.ajax({
                                url: siteURL + '/wp-admin/admin-ajax.php',
                                type: 'POST',
                                data:{
                                    action: 'smilepass_login_action',
                                    operation: 'login',
                                    user_id: user_id,
                                },
                                success: function( result ){
                                    //console.log( result );
                                    if(parseInt(result) == 1){
                                        //document.location.href = siteURL;
                                        if(photo.tags[0].Glasses == true){
                                            alert('Put off your glasses please and try again.');
                                            with_glasses = true;                                        
                                        }
                                        else{
                                            if(photo.tags[0].Blink == true){
                                                eyes_closed_passed = true;
                                                eyes_closed = true;
                                                alert('Open your eyes please and try again.');
                                            }   
                                            if(photo.tags[0].Blink == false){
                                                eyes_closed_passed = true;
                                                eyes_closed = false;
                                                alert('Close your eyes please and try again.');
                                            }   
                                            step = 1;
                                        }
                                    }
                                    else{
                                        alert('We can not authorize you with camera. Please use your login and password to sign in.');
                                    }
                                },
                                error: function( e ){
                                    console.error( e );
                                },
                                complete: function(xhr,status){
                                    //jQuery('#captchelfie_share_loading').css('display','none');
                                },
                                
                            });  
                        }
                        else{
                            alert('We can not authorize you with camera. Please use your login and password to sign in and try to enroll again.');
                        }
                        hideLoaderBox();
                    });
                }
                else{ // step 1
                    client.facesRecognize(uids, urls_str, null, params, function(data){
                        
                        var photo = data.photos[0]; 
                        if ( photo.tags && photo.tags[0].uids && photo.tags[0].uids.length > 0) {
                            
                            var uid = photo.tags[0].uids[0].uid.split('@');
                            var user_id = uid[0];
                            
                            if(eyes_closed_passed == false && mouth_open_passed == false){
                                if(photo.tags[0].Blink == true){
                                    eyes_closed_passed = true;
                                    eyes_closed = true;
                                    alert('Open your eyes please and try again.');
                                }
                                else if(photo.tags[0].Blink == false){
                                    eyes_closed_passed = true;
                                    eyes_closed = false;
                                    alert('Close your eyes please and try again.');
                                }
                            }
                            else{
                                
                                if(mouth_open_passed == false){
                                    if(eyes_closed == false && photo.tags[0].Blink == true){
                                        alert('Open your eyes please and try again.');
                                    }
                                    else if(eyes_closed == true && photo.tags[0].Blink == false){
                                        alert('Close your eyes please and try again.');
                                    }  
                                    else{
                                        if(photo.tags[0]['Mouth open'] == true){
                                            mouth_open_passed = true;
                                            mouth_open = true;
                                            alert('Close your mouth please and try again.');
                                        }
                                        else if(photo.tags[0]['Mouth open'] == false){
                                            mouth_open_passed = true;
                                            mouth_open = false;
                                            alert('Open your mouth please and try again.');
                                        }                                    
                                    }                             
                                }
                                else{    
                                    
                                    if(mouth_open == false && photo.tags[0]['Mouth open'] == true){
                                        alert('Close your mouth please and try again.');
                                    }
                                    else if(mouth_open == true && photo.tags[0]['Mouth open'] == false){
                                        alert('Open your mouth please and try again.');
                                    }
                                    else{
        
                                        jQuery.ajax({
                                            url: siteURL + '/wp-admin/admin-ajax.php',
                                            type: 'POST',
                                            data:{
                                                action: 'smilepass_login_action',
                                                operation: 'login-checked',
                                                user_id: user_id,
                                            },
                                            success: function( result ){
                                                document.location.href = siteURL;
                                            },
                                            error: function( e ){
                                                alert( e );
                                            },
                                            complete: function(xhr,status){
                                            },
                                            
                                        }); 
                                    }   
                                }                          
                            }
                        }
                        else{
                            alert('We can not authorize you with camera. Please use your login and password to sign in and try to enroll again.');
                        }
                        hideLoaderBox();
                    });   
                }
            }
            else{              
                client.facesRecognize(uids, urls_str, null, params, function(data){
                    
                    var photo = data.photos[0];
                    if (photo.tags[0] && photo.tags[0].uids && photo.tags[0].uids.length > 0) {
                        
                        var uid = photo.tags[0].uids[0].uid.split('@');
                        var user_id = uid[0];
                        
                        jQuery.ajax({
                            url: siteURL + '/wp-admin/admin-ajax.php',
                            type: 'POST',
                            data:{
                                action: 'smilepass_login_action',
                                operation: 'login-checked',
                                user_id: user_id,
                            },
                            success: function( result ){
                                document.location.href = siteURL;
                            },
                            error: function( e ){
                                alert( e );
                            },
                            complete: function(xhr,status){
                            },
                            
                        }); 
      
                    }
                    else{
                        alert('We can not authorize you with camera. Please use your login and password to sign in and try to enroll again.');
                    }
                    hideLoaderBox();
                });
            }   
        });

        return false;   
    });
	
});
 
function drawFacesAddPoint(control, imgWidth, imgHeight, point, title) {
	var x = Math.round(point.x * imgWidth / 100);
	var y = Math.round(point.y * imgHeight / 100);
	var pointClass = title == null ? "api_face_all_point" : "api_face_point";
	var pointStyle = 'top: ' + y + 'px; left: ' + x + 'px;';
	var pointTitle = (title == null ? '' : title + ': ') + 'X=' + x + ', Y=' + y + ', Confidence=' + point.confidence + '%' + (title == null ? ', Id=' + point.id.toString(16) : '');
	control.append($('<span class="' + pointClass + '" style="' + pointStyle + '" title="' + pointTitle + '"></span>'));
}

function drawFaces(div, photo, drawPoints) {
	
	if($('#camera-box-face-feature').length > 0){
		var with_tooltips = 0;
	}
	if($('#camera-box-face-feature-front').length > 0){
		var with_tooltips = 1;
	}
	
    /*
    console.log(JSON.stringify(photo));
    console.log(JSON.stringify(drawPoints));
     */
    
	if (!photo) {
		alert("No image found");
		return;
	}
	if (photo.error_message) {
		alert(photo.error_message);
		return;
	}
    div.html('<div class="image-wrapper"></div>');
	var imageWrapper = $('.image-wrapper');
	
	//var maxImgWidth = parseInt(div.prev().children(".img_max_width").html(), 10);
	var maxImgWidth = div.width();
	//var maxImgHeight = parseInt(div.prev().children(".img_max_height").html(), 10);
	var imgWidth = photo.width;
	var imgHeight = photo.height;
    var scaleFactor = maxImgWidth / imgWidth; // Math.min(maxImgWidth / imgWidth, maxImgHeight / imgHeight);
	if (scaleFactor < 1) {
		imgWidth = Math.round(imgWidth * scaleFactor);
		imgHeight = Math.round(imgHeight * scaleFactor);
	}
	imageWrapper.append($('<img title="face detection results" src="' + photo.url + '" />'));
	if ( photo.tags && photo.tags.length > 0 ) {
		for (var i = 0; i < photo.tags.length; ++i) {
			var tag = photo.tags[i];
			var tagWidth = tag.width * 1.5;
			var tagHeight = tag.height * 1.5;
			var width = Math.round(tagWidth * imgWidth / 100);
			var height = Math.round(tagHeight * imgHeight / 100);
			var left = Math.round((tag.center.x - 0.5 * tagWidth) * imgWidth / 100);
			var top = Math.round((tag.center.y - 0.5 * tagHeight) * imgHeight / 100);
			if (drawPoints && tag.points) {
				for (var p = 0; p < tag.points.length; p++) {
					drawFacesAddPoint(imageWrapper, imgWidth, imgHeight, tag.points[p], null);
				}
			}
			var tagStyle = 'top: ' + top + 'px; left: ' + left + 'px; width: ' + width + 'px; height: ' + height + 'px; transform: rotate(' +
				tag.roll + 'deg); -ms-transform: rotate(' + tag.roll + 'deg); -moz-transform: rotate(' + tag.roll + 'deg); -webkit-transform: rotate(' +
				tag.roll + 'deg); -o-transform: rotate(' + tag.roll + 'deg)';
			
			if(!with_tooltips){
				var active_tag = '';
				if(( !face_feature_active_tag && i == 0 ) || (face_feature_active_tag && face_feature_active_tag == tag.tid)){
					active_tag = ' active';
					face_feature_active_tag = tag.tid;
				}
				var apiFaceTag = $('<div class="api_face" style="' + tagStyle + '"><div class="api_face_inner'+ active_tag + '"><div class="api_face_inner_tid" name="' + tag.tid + '"></div></div></div>').appendTo(imageWrapper);
			}
			else{
				var apiFaceTag = $('<div class="api_face" style="' + tagStyle + '"><div class="api_face_inner"><div class="api_face_inner_tid" name="' + tag.tid + '"></div></div></div>').appendTo(imageWrapper);
			}
			
			if (drawPoints) {
				if (tag.eye_left) drawFacesAddPoint(imageWrapper, imgWidth, imgHeight, tag.eye_left, "Left eye");
				if (tag.eye_right) drawFacesAddPoint(imageWrapper, imgWidth, imgHeight, tag.eye_right, "Right eye");
				if (tag.mouth_center) drawFacesAddPoint(imageWrapper, imgWidth, imgHeight, tag.mouth_center, "Mouth center");
				if (tag.nose) drawFacesAddPoint(imageWrapper, imgWidth, imgHeight, tag.nose, "Nose tip");
			}
			
			
			if(!with_tooltips){
				if(( !face_feature_active_tag && i == 0 ) || (face_feature_active_tag && face_feature_active_tag == tag.tid)){
					var tbody = '';
					if (tag.attributes) {
						if (tag.attributes.face && tag.attributes.face.confidence > 0) {
		                    title += ': (' + tag.attributes.face.confidence + '%)';
		                    tbody += '<tr><td>'+translations.face+'</td><td>' + tag.attributes.face.confidence + '%</td>';
		                }
						if (tag.attributes.gender) {
		                    tbody += '<tr><td>'+translations.gender+'</td><td>' + translations[tag.attributes.gender.value] + '</td></tr>'; // '<td>' + tag.attributes.gender.confidence + '%</td>';
		                }
						if (tag.attributes.smiling) {
		                    tbody += '<tr><td>'+translations.smiling+'</td><td>' + translations[tag.attributes.smiling.value]+ '</td></tr>'; // '<td>' + tag.attributes.smiling.confidence + '%</td>';
		                }
						if (tag.attributes.glasses) {
		                    tbody += '<tr><td>'+translations.glasses+'</td><td>' + translations[tag.attributes.glasses.value] + '</td></tr>'; // '<td>' + tag.attributes.glasses.confidence + '%</td>';
		                }
						if (tag.attributes.dark_glasses) {
		                    tbody += '<tr><td>'+translations.dark_glasses+'</td><td>' + translations[tag.attributes.dark_glasses.value] + '</td></tr>'; // '<td>' + tag.attributes.dark_glasses.confidence + '%</td>';
		                }
						if (tag.attributes.lips) {
		                    tbody += '<tr><td>'+translations.lips+'</td><td>' + translations[tag.attributes.lips.value] + '</td></tr>'; // '<td>' + tag.attributes.lips.confidence + '%</td>';
		                }
						if (tag.attributes.eyes) {
		                    tbody += '<tr><td>'+translations.eyes+'</td><td>' + translations[tag.attributes.eyes.value] + '</td></tr>'; // '<td>' + tag.attributes.eyes.confidence + '%</td>';
		                }
						if (tag.attributes.age_est){ 
						}
						if (tag.attributes.mood) {
		                    tbody += '<tr><td>'+translations.mood+'</td><td>' + translations[tag.attributes.mood.value] + '</td></tr>'; // '<td>' + tag.attributes.mood.confidence + '%</td>';
		                }
		                tbody += '<tr><td>'+translations.roll+'</td><td>' + tag.roll + '&deg;</td></tr>';
		                tbody += '<tr><td>'+translations.yaw+'</td><td>' + tag.yaw + '&deg;</td></tr>';
		                $('#result-table').find('tbody').html(tbody);
		                $('#result-table').slideDown('slow');
					}
				}
			}
			else {
				var title = 'face';
				var attributes = '';
				if (tag.attributes) {
					if (tag.attributes.face && tag.attributes.face.confidence > 0) title += ': (' + tag.attributes.face.confidence + '%)';
					if (tag.attributes.gender) attributes += 'gender: ' + tag.attributes.gender.value + ( tag.attributes.gender.confidence ? ' (' + tag.attributes.gender.confidence + '%)' : '' ) + '<br/>';
					if (tag.attributes.smiling) attributes += 'smiling: ' + tag.attributes.smiling.value + ' (' + tag.attributes.smiling.confidence + '%)<br/>';
					if (tag.attributes.glasses) attributes += 'glasses: ' + tag.attributes.glasses.value + ( tag.attributes.glasses.confidence ? ' (' + tag.attributes.glasses.confidence + '%)' : '' ) + '<br/>';
					if (tag.attributes.dark_glasses) attributes += 'dark_glasses: ' + tag.attributes.dark_glasses.value + ( tag.attributes.dark_glasses.confidence ? ' (' + tag.attributes.dark_glasses.confidence + '%)' : '' ) + '<br/>';
					if (tag.attributes.lips) attributes += 'lips: ' + tag.attributes.lips.value + ( tag.attributes.lips.confidence ? ' (' + tag.attributes.lips.confidence + '%)' : '' ) + '<br/>';
					if (tag.attributes.eyes) attributes += 'eyes: ' + tag.attributes.eyes.value + ( tag.attributes.eyes.confidence ? ' (' + tag.attributes.eyes.confidence + '%)' : '' ) + '<br/>';
					if (tag.attributes.age_est) attributes += 'age: ' + tag.attributes.age_est.value + '<br/>';
					if (tag.attributes.mood) {
						attributes += 'mood: ' + tag.attributes.mood.value;
                        if(tag.attributes.mood.confidence) {
                            attributes += ' (' + tag.attributes.mood.confidence + '%)<br/>';
                            attributes += '&nbsp;&nbsp;N: ' + tag.attributes.neutral_mood.confidence + '%, A: ' + tag.attributes.anger.confidence + '%, D: ' + tag.attributes.disgust.confidence + '%, F: ' + tag.attributes.fear.confidence + '%<br/>';
                            attributes += '&nbsp;&nbsp;H: ' + tag.attributes.happiness.confidence + '%, S: ' + tag.attributes.sadness.confidence + '%, SP: ' + tag.attributes.surprise.confidence + '%';
                        }
                        attributes += '<br/>';
                    }
				}
				attributes += 'roll: ' + tag.roll + '&deg;, yaw: ' + tag.yaw + '&deg;';
				apiFaceTag.qtip({
					position: { my: 'top center', at: 'bottom center' },
					style: { classes: 'qtip-light' },
					show: { ready: div.is(':visible') && photo.tags.length === 1, when: 'mouseover' },
					content: { text: attributes, title: { text: title } },
					hide: { delay: 200 }
				});				
			}
		}
	}
	else{
        setMessage('Face not detected');
    	$('#result-table').find('tbody').html(	'<tr><td>'+translations.gender+'</td><td></td></tr>'+
    											'<tr><td>'+translations.glasses+'</td><td></td></tr>'+
    											'<tr><td>'+translations.dark_glasses+'</td><td></td></tr>'+
    											'<tr><td>'+translations.lips+'</td><td></td></tr>'+
    											'<tr><td>'+translations.eyes+'</td><td></td></tr>'+
    											'<tr><td>'+translations.mood+'</td><td></td></tr>'+
    											'<tr><td>'+translations.roll+'</td><td></td></tr>'+
    											'<tr><td>'+translations.yaw+'</td><td></td></tr>');
    }
}

/////////////////////////////////////////////////////////////////////////////////////////////

function showLoaderBox(){
    jQuery('body').append('<div class="loader-box"></div>');
    jQuery('.loader-box').css('background-image', 'url(http://subscriber.api.bio/images/loader2.gif?r='+(new Date().getTime())+'")');
    var x = window.scrollX;
    var y = window.scrollY;
    window.onscroll=function(){window.scrollTo(x, y);};
}
function hideLoaderBox(){
    jQuery('.loader-box').remove();
    window.onscroll=function(){};
}
function showShape(){
    jQuery('#camera').css({ position: 'relative' });
    jQuery('#camera').prepend('<img src="/wp-content/plugins/smilepass/images/shape.png" style="position:absolute; top:0; left:0; width:100%; z-index:10;" />');
}

function setMessage(message){
	jQuery('#camera').append('<div class="msg-area">' + message + '</div>');
	setTimeout(function(){jQuery('#camera').find('.msg-area').fadeOut('slow').remove();}, 5000);
}

///////////////////////////////////////////////////////////////////////////////
//////////////////////////// AUTHORIZATION ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function smilepass_subscriber_auth_form_submit(){
    var email = jQuery('#smilepass-subscriber-auth-form').find('input[name="smilepass[smilepass-email]"]').val();
    var pass = jQuery('#smilepass-subscriber-auth-form').find('input[name="smilepass[smilepass-password]"]').val();
	
	//console.log(email);
}
