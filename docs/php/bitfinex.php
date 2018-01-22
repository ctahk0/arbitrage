<?php

/**
* this clas is for Bitfinex trading BOT
*/
class bitfinex {
	private $apikey;
	private $secret;
	private $url = "https://api.bitfinex.com";

	public function __construct($apikey, $secret) {
		$this->apikey = $apikey;
		$this->secret = $secret;
	}

	public function get_balances(){
		$request = "/v1/balances";
		$data = array(
			"request" => $request
		);
		return $this->hash_request($data);
	}

	public function get_info(){
		$request = "/v1/account_infos";
		$data = array(
			"request" => $request
		);
		return $this->hash_request($data);
	}

	public function new_order($symbol, $amount, $price, $side, $type) {
		$request = '/v1/order/new';
		$data = array(
			"request" => $request,
			"symbol" => $symbol,
			"amount" => $amount,
			"price" => $price,
			"exchange" => "bitfinex",
			"side" => $side,
			"type" => $type
		);
		return $this->hash_request($data);
	}

	private function headers($data) {
		$data["nonce"] = strval(round(microtime(true) * 10, 0));
		$payload = base64_encode(json_encode($data));
		$signature = hash_hmac("sha384", $payload, $this->secret);
		return array(
			"X-BFX-APIKEY: " . $this->apikey,
    		"X-BFX-PAYLOAD: " . $payload,
    		"X-BFX-SIGNATURE: " . $signature
		);
	}

	private function hash_request($data){
		$ch = curl_init();
		$burl = $this->url . $data["request"];
		$headers = $this->headers($data);
		curl_setopt_array($ch, array(
			CURLOPT_URL => $burl,
			CURLOPT_POST => true,
			CURLOPT_RETURNTRANSFER => true,
			CURLOPT_HTTPHEADER => $headers,
			CURLOPT_SSL_VERIFYPEER => false,
			CURLOPT_POSTFIELDS => ""
		));
		$ccc = curl_exec($ch);
		return json_decode($ccc, true);
	}
}

require_once('config.php');

//public function balansiraj() {
	$trade = new bitfinex($api_key, $api_secret);
	//$buy = $trade->new_order("ETHBTC", "0.11", "1", "sell", "exchange market");
	$balances = $trade->get_balances();
	//$info = $trade->get_info();

	//print_r($buy) . "<br>";

	$myJSONString = json_encode($balances);
	//return $myJSONString;
	 echo "info  " . $myJSONString;
//}

?>