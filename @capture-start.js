//-------------------------------------------------------------
// LIBRARYS
//-------------------------------------------------------------
const puppeteer = require('puppeteer');										// puppeteerライブラリ
const devices = require('puppeteer/DeviceDescriptors');		// デバイス定義用ライブラリ（例： await page.emulate(devices['iPhone 8'])）
require('date-utils');																		// 日付フォーマット用のライブラリ
const fs = require("fs");																	// node.jsでファイル出力するための標準ライブラリ読み込み

//-------------------------------------------------------------
// GENERAL SETTING
//-------------------------------------------------------------
const readFilePath = '_targetSiteUrls.txt'	// アクセスするURL一覧のテキスト

const headlessBoolean = true							// 動作確認するためheadlessモードにしない（true: ブラウザの動きを見せない、false: ブラウザの動きを見せる）
const headlessNum = 10										// 動作確認しやすいようにpuppeteerの操作を遅延させる
const viewportHeight = 1200								// アクセスした際のページの高さ設定 ※ページに合わせて再設定される
let viewportWidth = 1200									// アクセスした際のページの横幅設定


const pageWaitingTime = 5000							// ページの待ち時間

// ** 対象のデバイスの種類を選択・コメントを解除 - start *****
const selectTargetDevicesType = 'typeA'
let arrWidth
let arrDevices
switch(selectTargetDevicesType) {
	// ◆ 1つ分 - SP
	case 'typeA':
		arrWidth = [375]
		arrDevices = ['iPhone 8']
		break;

	// ◆ 1つ分 - Tablet
	case 'typeB':
		arrWidth = [768]
		arrDevices = ['iPad']
		break;

	// ◆ 1つ分 - PC
	case 'typeC':
		arrWidth = [1600]
		arrDevices = ['PC']
		break;

	// ◆ 2つ分 - SP & Tablet
	case 'typeD':
		arrWidth = [375, 768]
		arrDevices = ['iPhone 8', 'iPad']
		break;

	// ◆ 2つ分 - Tablet & PC
	case 'typeE':
		arrWidth = [768, 1600]
		arrDevices = ['iPad', 'PC']
		break;

	// ◆ 2つ分 - SP & PC
	case 'typeF':
		arrWidth = [375, 1600]
		arrDevices = ['iPhone 8', 'PC']
		break;

	// ◆ 3つ分
	case 'typeG':
		arrWidth = [375, 768, 1600]
		arrDevices = ['iPhone 8', 'iPad', 'PC']
		break;
}
// ** 対象のデバイスの種類を選択・コメントを解除 - end *****

	// ▼ 参考： Devices list
	// https://github.com/GoogleChrome/puppeteer/issues/2980
	// https://github.com/GoogleChrome/puppeteer/blob/master/lib/DeviceDescriptors.js
	// https://flaviocopes.com/puppeteer/

const googleLogin = false // googleログイン処理を有効にするかどうか
	const googleLoginURL = '※※※Googleログイン用URL※※※'
	const googleLoginID = 'googleLoginID'
	const googleLoginPW = 'googleLoginPW'
	const timeInterval1 = 3000	// ID入力後
	const timeInterval2 = 10000	// 2段階認証前

const basicAuthentication = false // ベーシック認証処理を有効にするかどうか
	const basicLoginID = 'basicLoginID'
	const basicLoginPW = 'basicLoginPW'

let getTime = ''
let saveFileName = ''
let saveFileNameEnd = '_cap'							// getTime + '_' + i + [※※※ ココ ※※※] + extension
const urlLastElement = false								// urlの最後の「/スラッシュ」以降の文字列をファイル名末尾に付与するかどうか ※saveFileNameEndが上書きされる
const extension = '.png'

//-------------------------------------------------------------
// MAIN
//-------------------------------------------------------------
// https://swet.dena.com/entry/2018/04/26/152326
// Puppeteerによるフルページスクリーンショット - 遅延読み込み対策
async function scrollToBottom(page, viewportHeight) {
	const getScrollHeight = () => {
	return Promise.resolve(document.documentElement.scrollHeight) }

	let scrollHeight = await page.evaluate(getScrollHeight)
	let currentPosition = 0
	let scrollNumber = 0

	while (currentPosition < scrollHeight) {
	scrollNumber += 1
	const nextPosition = scrollNumber * viewportHeight
	await page.evaluate(function (scrollTo) {
		return Promise.resolve(window.scrollTo(0, scrollTo))
	}, nextPosition)
	await page.waitForNavigation({waitUntil: 'networkidle2', timeout: pageWaitingTime})
				.catch(e => console.log('timeout exceed. proceed to next operation'));

	currentPosition = nextPosition;
	console.log(`scrollNumber: ${scrollNumber}`)
	console.log(`currentPosition: ${currentPosition}`)

	// 2
	scrollHeight = await page.evaluate(getScrollHeight)
	console.log(`ScrollHeight ${scrollHeight}`)
	}
}

//-------------------------------------------------------------
// INITIALIZE (CONSTRUCT)
//-------------------------------------------------------------
(async () => {

	// 基本設定の準備
	const browser = await puppeteer.launch({
		headless: headlessBoolean,
		slowMo: headlessNum
	})
	// Pageクラスのインスタンスを取得
	const page = await browser.newPage()

	// デバイス
	// await page.emulate(devices['iPhone 8'])

	// ユーザーエージェント
	// await page.setUserAgent('bot')
	// await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 (KHTML, like Gecko) Version/11.0 Mobile/15A372 Safari/604.1');

	// 画面の大きさ設定（Chromeのウィンドウ自体の大きさの調整ではない）
	// await page.setViewport({width: 1600, height: 950})


	// ※※※ベーシック認証 -------------------- start（処理開始）
	if(basicAuthentication){
		await page.setExtraHTTPHeaders({
			Authorization: `Basic ${new Buffer(`${basicLoginID}:${basicLoginPW}`).toString('base64')}`
		});
	}
	// ※※※ベーシック認証 -------------------- end（処理終了）


	// ※※※Googleログイン -------------------- start（処理開始）
	if(googleLogin){
		// 01. サイトにアクセス
		await page.goto(googleLoginURL);
		await page.waitForNavigation({waitUntil: 'networkidle2', timeout: pageWaitingTime})
				.catch(e => console.log('timeout exceed. proceed to next operation'));

		// 02. email
		await page.waitFor('input[type=email]')															// テキストボックスの表示を待つ
		await page.focus('input[type="email"]')															// テキストボックスへフォーカス
		await page.type('input[type=email]', googleLoginID, { delay: 100 })	// コマンドラインからの第一引数をテキストボックスに入力
		await page.keyboard.press('Enter')																	// Enterキーを押す

		// 一応ページ遷移用のインターバルを設ける
		await page.waitFor(timeInterval1)

		// 03. password
		await page.waitFor('input[type=password]')
		await page.focus('input[type=password]')
		await page.type('input[type=password]', googleLoginPW, { delay: 100 })
		await page.keyboard.press('Enter')

		// 一応ページ遷移用のインターバルを設ける ※2段階認証をしてるとこの間に承認操作が必要
		await page.waitFor(timeInterval2)
	}
	// ※※※Googleログイン -------------------- end（処理終了）


	// テキストファイルを読み込み、そこに書かれているURLを対象に1行ずつ処理する
	let readFileData = fs.readFileSync(readFilePath, 'utf-8')
	readFileData = readFileData.trim()
	const arrUrls = readFileData.split(/\r\n|\r|\n/)
	// console.log(arrUrls)

	// 1行ずつ処理開始
	for(i=0; i<arrUrls.length; i++){

		console.log("target URL: " + arrUrls[i])

		const setTime = new Date();								// 日付インスタンスを取得
		// ページへのアクセス状態や保存ファイル名を設定
		getTime = setTime.toFormat("YYYYMMDD_HH24MISS")			// 処理実行時の日時取得
		// viewportWidth = 1200

		// urlの最後の「/スラッシュ」以降の文字列をファイル名末尾に付与する
		if(urlLastElement) saveFileNameEnd = getUrlLastElement(arrUrls[i])

		for(j=0; j<arrWidth.length; j++){

			// ファイル名セット
			saveFileName = getTime + '_No' + (i+1) + '_' + j + extension

			// デバイスセット or サイズ指定
			if(arrDevices[j]=='PC'){
				// widthセット（PCのようにサイズ指定したい時用）
				page.setViewport({width: arrWidth[j], height: viewportHeight})
			} else {
				// デバイス適用する場合
				const devices = puppeteer.devices[arrDevices[j]];
				await page.emulate(devices);
			}

			// ※※※最終目的処理（ページアクセス → ページの高さ取得 → ページの全体キャプチャ）
			// -------------------- start（処理開始）
			await page.goto(arrUrls[i]);
			// await page.waitForNavigation({waitUntil: 'networkidle2', timeout: pageWaitingTime})
			// 		.catch(e => console.log('timeout exceed. proceed to next operation'));
			await scrollToBottom(page, viewportHeight)
			await page.screenshot({path: saveFileName, fullPage: true})
			// -------------------- end（処理終了）

			console.log("save screenshot: " + saveFileName)
		}

	}


	// 終了
	await browser.close()
})();


//-------------------------------------------------------------
// METHOD
//-------------------------------------------------------------
// urlの最後の「/スラッシュ」以降の文字列を返す
function getUrlLastElement(e) {
	const arrUrlSplit = e.split(/\//)
	const splitEndNum = arrUrlSplit.length - 1
	const returnValue = '_' + arrUrlSplit[splitEndNum]
	return returnValue
}

