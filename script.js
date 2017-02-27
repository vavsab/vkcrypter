var isEncryptionEnabled;
var messagesInvertal;
var chatMainButtonInterval;
var sendButtonClickPending;
var refreshInterval = 1000;

function setPassword() {
	chrome.runtime.sendMessage({type: "request_password"}, function (response) {
		if (response) {	
			resetPassword();
			isEncryptionEnabled = true;
			updateChatMainButton();
			updateMessages();
		}
	});
}

function resetPassword() {
	isEncryptionEnabled = false;
	$('div.decrypted-text').remove();
	$('img.secured-message').css('display', 'block');

	$('.decryption-skipped, .decrypted')
		.removeClass('decrypted')
		.removeClass('decryption-skipped')
		.addClass('crypted');
}

function togglePassword() { 
	if (isEncryptionEnabled){
		resetPassword();
		updateChatMainButton();
	 } else {
		 setPassword();
	 }
}

function encryptMessage(onFinishCallback) { 
	var input = $('.im_editable.im-chat-input--text._im_text').first();
	var text = input.text();

	if (text.startsWith(Constants.marker))
		return;

	chrome.runtime.sendMessage({type: 'encrypt', text: text}, function (response) {
		input.text(response.encryptedText);
		onFinishCallback();
	});
}

function updateChatMainButton() {
	if (chatMainButtonInterval) {
		clearInterval(chatMainButtonInterval);
		chatMainButtonInterval = null;
	}

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
		bodyToAttachHandler.addEventListener('keydown', function (event) {
			if (!isEncryptionEnabled)
				return;

			var isAllowed;
			if ($('._im_submit_btn.on').attr('data-val') == 1) {
				// Ctrl + Enter
				isAllowed = event.keyCode == 13 && event.ctrlKey;	
			} else {
				// Enter. But ignore Shift + Enter
				isAllowed = event.keyCode == 13 && !event.shiftKey;	
			}

			if (isAllowed && $(':focus').hasClass('im-chat-input--text')) {	
				var sendButton = $('.im-send-btn_send');
				if (sendButton.length > 0){
					encryptMessage(function () {
						sendButtonClickPending = true;
						sendButton.click();
						sendButtonClickPending = false;
					});

					event.stopPropagation();
				}
			}
		}, true);

		bodyToAttachHandler.addEventListener('click', function (event) {
			if (sendButtonClickPending)
				return;

			if (!isEncryptionEnabled)
				return;

			var sendButton = $(event.target);
			if (sendButton.hasClass('im-send-btn_send')) {
				
				encryptMessage(function () {
					sendButtonClickPending = true;
					sendButton.click();
					sendButtonClickPending = false;
				});

				event.stopPropagation();
			}
		}, true);
	}

	$('.im-chat-input--text').css('background-color', isEncryptionEnabled ? '#ffb' : '#fff');

	chatMainButtonInterval = setInterval(updateChatMainButton, refreshInterval);
}

function updateMessages() {
	if (messagesInvertal) {
		clearInterval(messagesInvertal);
		messagesInvertal = null;
	}

	$('.im_msg_text:not(.crypted .decrypted), .im-mess--text:not(.crypted .decrypted)')
	.each(function (index, messageContainer) {
		var textDiv = $(messageContainer);
		if (textDiv.html().indexOf(Constants.marker) == 0) {
			textDiv.addClass("crypted");
			var e = $("<div><img /><div class='crypted-text' style='display: none;'></div></div>");
			
			var img = $('img', e)
				.attr("src", chrome.extension.getURL('lock.png'))
				.attr("width", "20")
				.attr("height", "20")
				.attr("class", "secured-message");
		
			$('div.crypted-text', e).html(textDiv.html());
			textDiv.html(e.html());

			textDiv.click(setPassword);
		}
	});

	if (isEncryptionEnabled) {
		$('.im_msg_text.crypted:not(.decryption-skipped), .im-mess--text.crypted:not(.decryption-skipped)').each(function (index, container) {
			var messageContainer = $(container);
			var text = $('.crypted-text', messageContainer).text();

			chrome.runtime.sendMessage({type: 'decrypt', text: text}, function (response) {
				if (!response || !response.decryptedText) {
					messageContainer.addClass('decryption-skipped');
					return;
				}

				messageContainer.addClass('decrypted');
				messageContainer.removeClass('crypted');
				messageContainer.append('<div class="decrypted-text">' + response.decryptedText +'</div>');
				$('img', messageContainer).css('display', 'none');
			});
		});
	}

	messagesInvertal = setInterval(updateMessages, refreshInterval);
}

updateChatMainButton();
updateMessages();