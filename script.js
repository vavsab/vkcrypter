var isEncryptionEnabled = false;

function setPassword() {
	chrome.runtime.sendMessage({type: "request_password"}, function (response) {
		if (response) {	
			isEncryptionEnabled = true;
			updateChatMainButton();
		}
	});
}

function resetPassword() {
	isEncryptionEnabled = false;
	updateChatMainButton();
}

function togglePassword() { 
	if (isEncryptionEnabled){
		resetPassword();
	 } else {
		 setPassword();
	 }
}

function sendMessage(onFinishCallback) { 
	var input = $('.im_editable.im-chat-input--text._im_text').first();
	var text = input.text();

	chrome.runtime.sendMessage({type: 'encrypt', text: text}, function (response) {
		input.text(response.encryptedText);
		onFinishCallback();
	});
}

function updateChatMainButton() {
	var message = isEncryptionEnabled ? "Выключить VkCrypter" : "Включить VkCrypter";

	if ( $('.ui_actions_menu._ui_menu').length <= $('.ui_actions_menu._ui_menu .im-action-toggle-crypt').length) {
		$('.im-action-toggle-crypt').text(message);
	} else {
		var link = $('<a tabindex="0" role="link" class="ui_actions_menu_item _im_action im-action-toggle-crypt" style="background-position: 5px -203px;">' + message + '</a>');
		link.click(togglePassword);

		$('.ui_actions_menu._ui_menu')
			.append('<div class="ui_actions_menu_sep"></div>')
			.append(link);
	}


	var bodyToAttachHandler = $('body:not(.crypterListenerAttached)')
		.addClass('crypterListenerAttached')[0];
	
	if (bodyToAttachHandler) {	
		bodyToAttachHandler.addEventListener('click', function (event) {
			if (!isEncryptionEnabled)
				return;

			if ($(event.target).hasClass('im-send-btn_send')) {
				sendMessage(function () {
					event.target.dispatchEvent(event);
				});

				return false;
			}
		}, true);
	}

	$('.im-chat-input--text').css('background-color', isEncryptionEnabled ? '#ffb' : '#fff');
}

function updateMessages() {
	$('.im_msg_text:not(.crypted .encrypted), .im-mess--text:not(.crypted .encrypted)')
	.each(function (index, messageContainer) {
		var textDiv = $(messageContainer);
		if (textDiv.html().indexOf(Constants.marker) == 0) {
			textDiv.addClass("crypted");
			var e = $("<div><img /><div class='crypted-text' style='display: none;'></div></div>");
			
			$('img', e)
				.attr("src", "https://www.databreaches.net/wp-content/uploads/favicon.png")
				.attr("width", "30")
				.attr("height", "30")
				.attr("class", "secured-message");
		
			$('div.crypted-text', e).html(textDiv.html());
			textDiv.html(e.html());

			textDiv.click(togglePassword);
		}
	});
}

setInterval(updateChatMainButton, 4000);
setInterval(updateMessages, 4000);

