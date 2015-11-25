function Zumata(params) {
  var self = this;

  if (!validate()) {
    return null;
  }

  // settings
  defaultSettings = {
    host: 'https://test-payment-v3.zumata.com',
    provider: 'cybersource',
    frameName: 'zumata-frame-payment', // the id/name of the invisible iframe
    debug: false,
  };

  // params can overwrite defaultSettings
  // 7 properties: key, callback, data, debug, host, provider, frameName
  self.settings = merge(defaultSettings, params);

  // state
  self.paymentIDRes = undefined;
  self.paymentSignatureRes = undefined;
  self.paymentForm = undefined;

  // public
  self.submit = submit;

  // helper
  self.ajax = ajax;
  self.injectFrameHTML = injectFrameHTML;
  self.injectFormHTML = injectFormHTML;
  self.submitForm = submitForm;

  self.injectFrameHTML(self.settings.frameName);

  //////////////////////////////////////////////////////////////////////////
  // Public
  //////////////////////////////////////////////////////////////////////////

  function submit() {
    getPaymentID(self.settings.callback, paymentIDSuccess);

    function paymentIDSuccess() {
      generateSignature(self.settings.data, signatureSuccess);
    }

    function signatureSuccess() {
      var $form = self.injectFormHTML(self.settings.frameName, self.paymentSignatureRes);
      self.submitForm($form, self.settings.data.card_number);
    }
  }

  //////////////////////////////////////////////////////////////////////////
  // Helper (dependent on jQuery, override if needed)
  //////////////////////////////////////////////////////////////////////////

  function ajax(params, success) {
    $.ajax({
    	url: params.url,
    	method: params.method,
    	data: JSON.stringify(params.data),
      contentType: 'json',
    	beforeSend: function(xhr) {
        for (var key in params.headers) {
          xhr.setRequestHeader(key, params.headers[key]);
        }
    	}
    }).done(function(data) {
    	success.call(self, data);
    });
  }

  function injectFrameHTML(name) {
    $('<iframe>')
      .attr('id', name)
      .attr('name', name)
			.css({
        display: 'none',
      })
      .appendTo('body');
  }

  function injectFormHTML(name, data) {
    var $form = $('<form>')
      .attr('action', data.url)
      .attr('method', 'POST')
      .attr('target', name)
      .css({
        display: 'none',
      });

  	for (var key in data.fields) {
  		if (data.fields.hasOwnProperty(key)) {
        $form.append('<input type="hidden" name="' + key + '" value="' + data.fields[key] + '">');
  		}
  	}

  	$form.appendTo('body');
		return $form;
  }

  function submitForm($form, cc) {
    return $form
      .append('<input type="hidden" name="card_number" value="' + cc + '">')
      .submit();
  }

  //////////////////////////////////////////////////////////////////////////
  // Private
  //////////////////////////////////////////////////////////////////////////

  // merge 2 objects, obj1 is the default
  function merge(obj1, obj2) {
    var obj3 = {};
    for (var attrname in obj1) { obj3[attrname] = obj1[attrname]; }
    for (var attrname in obj2) { obj3[attrname] = obj2[attrname]; }
    return obj3;
  }

  function validate() {
    if (!params.key) {
      console.error('A key is required');
      return false;
    }

    if (!params.callback) {
      console.error('Callback is required');
      return false;
    }

    if (!params.data) {
      console.error('Data is required');
      return false;
    }

    if (!params.data.card_number) {
      console.error('card_number is required');
      return false;
    }

    return true;
  }

  function getPaymentID(csCallback, cb) {
    var req = {
      'provider': self.settings.provider,
    	'callback_url': csCallback,
    	'callback_payload': '{}'
    };

    log('Get paymentID', req);
    self.ajax({
      url: self.settings.host + '/api/create',
      method: 'POST',
      data: req,
      headers: {
        'X-Payment-Key': self.settings.key,
      }
    }, function(res) {
      log('-> get paymentID', res);
      self.paymentIDRes = res;
      if (cb) {
        cb();
      }
    });
  }

  function generateSignature(data, cb) {
    log('Generating signature', data);

    if (!self.paymentIDRes || !self.paymentIDRes.id) {
      console.error('Cannot generate signature, paymentID is null');
      return;
    }

    self.ajax({
  		url: self.settings.host + '/api/generateSignature/' + self.paymentIDRes.id,
  		method: 'POST',
  		data: data,
  		headers: {
  			'X-Payment-Key': self.settings.key,
  		}
  	}, function(res) {
  		log('-> generating signature', res);
      self.paymentSignatureRes = res;

      if (cb) {
        cb();
      }
  	});
  }

  function log() {
    if (!self.settings.debug) {
      return;
    }

    console.log.apply(console, arguments);
  }
}
