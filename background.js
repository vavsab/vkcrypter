var password = null;
var passwordWasSet = false;

// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
  // No tabs or host permissions needed!
  console.log('Turning ' + tab.url + ' red!');
  chrome.tabs.executeScript({
		code: 'document.body.innerHTML = "' + plus(1, 2) + '";'
	});
  // chrome.tabs.executeScript({
    // code: 'document.body.innerHTML = "<img src=https://media.giphy.com/media/TXqOjZfu9PJfO/giphy.gif />";'
  // });
});

// Handle requests for passwords
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		console.log(request);
		if (request.type === 'request_password') {
			requestPassword(function (passwordWasSet) {
				sendResponse(passwordWasSet);
			});
		}
		
		if (request.type === 'encrypt') {
			var encryptFunction = function () {
				if (password != null) {
					var encryptedText = encrypt(request.text);
					console.log("encryptedText: " + encryptedText);
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
					console.log("decryptedText: " + decryptedText);
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
	console.log("requestPassword()");
	chrome.tabs.create({
		url: chrome.extension.getURL('dialog.html'),
		active: false
	}, function(tab) {
		var windowId = chrome.windows.create({
			tabId: tab.id,
			type: 'popup',
			width: 200,
			height: 100,
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
	return CryptoJS.AES.decrypt(text, password).toString(CryptoJS.enc.Utf8);
}