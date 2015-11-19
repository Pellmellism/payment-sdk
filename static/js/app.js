var payment_key = "S2Ew1Dr0ZlqGB9MTOHfygRplCtAPWIRHW2qXHnlgA2o=";
var host = "https://test-payment-v3.zumata.com";

var createPaymentRequest = {
	'provider': 'cybersource',
	'callback_url': 'http://localhost:3000/callback',
	'callback_payload': '{}'
};

$.ajax({
	url: host+'/api/create',
	type: 'POST',
	data: JSON.stringify(createPaymentRequest),
	dataType: 'json',
	beforeSend: function(xhr) {
		xhr.setRequestHeader('X-Payment-Key', payment_key);
	}
}).done(function(data) {
	generateSignature(data.id);
});

var formData = {
	'bill_to_forename': 'John',
	'bill_to_surname': 'Doe',
	'bill_to_email': 'john@cybersource.com',
	'bill_to_address_line1': '1 lane card',
	'bill_to_address_city': 'Singapore',
	'bill_to_address_country': 'SG',
	// We need card_type and currency to determin which profile to use to generate signature
	'card_type': '001',
	'card_expiry_date': '11-2020',
	'card_cvn': '123',
	'provider': 'cybersource',
	'amount': 123.45,
	'currency': 'SGD',
};

function generateSignature(payment_id) {
	console.log("/api/create ok ok");
	$.ajax({
		url: host+'/api/generateSignature/'+payment_id,
		type: 'POST',
		data: JSON.stringify(formData),
		dataType: 'json', // what type of data do we expect back from the server
		beforeSend: function(xhr) {
			xhr.setRequestHeader('X-Payment-Key', payment_key);
		}
	}).done(function(data) {
		console.log(data);
		generateForm(data);
	});
}

function generateForm(data) {
	$form = $("<form action='" + data.url + "' method='POST'></form>");
	for (var key in data.fields) {
		if (data.fields.hasOwnProperty(key)) {
			$form.append('<input type="hidden" name="' + key + '" value="' + data.fields[key] + '">');
		}
	}
	$form.append('<input type="hidden" name="card_number" value="4111111111111111">');
	$form.append('<input type="button" value="button">');
	$('body').append($form);
	$form.submit();
}