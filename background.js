var password = null;
var passwordWasSet = false;

// Handle requests for passwords
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		if (request.type === 'request_password') {
			requestPassword(function (passwordWasSet) {
				sendResponse(passwordWasSet);
			});
		}
		
		if (request.type === 'encrypt') {
			var encryptFunction = function () {
				if (password != null) {
					var encryptedText = encrypt(request.text);
					sendResponse({encryptedText: encryptedText});
				} else {
					sendResponse();
				}
			};

			if (password == null) {
				requestPassword(encryptFunction);
			} else {
				encryptFunction();
			}
		}
		
		if (request.type === 'decrypt') {
			var decryptFunction = function () {
				if (password != null) {
					var decryptedText = decrypt(request.text);
					sendResponse({decryptedText: decryptedText});
				} else {
					sendResponse();
				}
			};

			if (password == null) {
				requestPassword(decryptFunction);
			} else {
				decryptFunction();
			}
		}

		return true;
});

function requestPassword(callback) {
	chrome.tabs.create({
		url: chrome.extension.getURL('dialog.html'),
		active: false
	}, function(tab) {
		var windowId = chrome.windows.create({
			tabId: tab.id,
			type: 'popup',
			width: 300,
			height: 70,
			focused: true
		});

		passwordWasSet = false;

		chrome.windows.onRemoved.addListener(function (windowId) {
			callback(passwordWasSet);
		});
	});
}

function setPassword(newPassword) {
	password = newPassword;
	passwordWasSet = true;
};

function encrypt(text) {
	return Constants.marker + CryptoJS.AES.encrypt(text, password);
}

function decrypt(text) {
	try {
		text = text.replace(Constants.marker, '');
		return CryptoJS.AES.decrypt(text, password).toString(CryptoJS.enc.Utf8);
	} catch (e) {
		return;
	}
	
}