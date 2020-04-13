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
const urlsFilePath = '_get-html-target-site-urls.txt'	// アクセスするURL一覧のテキスト
const keywordsFilePath = '_get-html-search-keywords.txt'	// アクセスするURL一覧のテキスト
const setTime = new Date();								// 日付インスタンスを取得

const headlessBoolean = false							// 動作確認するためheadlessモードにしない（true: ブラウザの動きを見せない、false: ブラウザの動きを見せる）
const headlessNum = 10										// 動作確認しやすいようにpuppeteerの操作を遅延させる
const viewportHeight = 1200								// アクセスした際のページの高さ設定 ※ページに合わせて再設定される
let viewportWidth = 1400									// アクセスした際のページの横幅設定

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
	await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 5000})
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


	// // ※※※ベーシック認証 -------------------- start（処理開始）
	// if(basicAuthentication){
	// 	await page.setExtraHTTPHeaders({
	// 		Authorization: `Basic ${new Buffer(`${basicLoginID}:${basicLoginPW}`).toString('base64')}`
	// 	});
	// }
	// // ※※※ベーシック認証 -------------------- end（処理終了）

	// // ※※※Googleログイン -------------------- start（処理開始）
	// if(googleLogin){
	// 	// 01. サイトにアクセス
	// 	await page.goto(googleLoginURL);
	// 	await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 5000})
	// 			.catch(e => console.log('timeout exceed. proceed to next operation'));

	// 	// 02. email
	// 	await page.waitFor('input[type=email]')															// テキストボックスの表示を待つ
	// 	await page.focus('input[type="email"]')															// テキストボックスへフォーカス
	// 	await page.type('input[type=email]', googleLoginID, { delay: 100 })	// コマンドラインからの第一引数をテキストボックスに入力
	// 	await page.keyboard.press('Enter')																	// Enterキーを押す

	// 	// 一応ページ遷移用のインターバルを設ける
	// 	await page.waitFor(timeInterval1)

	// 	// 03. password
	// 	await page.waitFor('input[type=password]')
	// 	await page.focus('input[type=password]')
	// 	await page.type('input[type=password]', googleLoginPW, { delay: 100 })
	// 	await page.keyboard.press('Enter')

	// 	// 一応ページ遷移用のインターバルを設ける ※2段階認証をしてるとこの間に承認操作が必要
	// 	await page.waitFor(timeInterval2)
	// }
	// // ※※※Googleログイン -------------------- end（処理終了）






	// テキストファイルを読み込み、そこに書かれているURLを対象に1行ずつ処理する
	// urlを配列に（探す書店サイトのURL）
	let urlsData = fs.readFileSync(urlsFilePath, 'utf-8')
	urlsData = urlsData.trim()
	const arrUrlsLine = urlsData.split(/\r\n|\r|\n/)

	// keywordを配列に（探す漫画のタイトル）
	let keywordsData = fs.readFileSync(keywordsFilePath, 'utf-8')
	keywordsData = keywordsData.trim()
	const arrKeywords = keywordsData.split(/\r\n|\r|\n/)



	// 1行ずつ処理開始
	for(i=0; i<arrUrlsLine.length; i++){

		const arrUrls = arrUrlsLine[i].split(/\t/)
		console.log("target URL: " + arrUrls[0])

		// ページへのアクセス状態や保存ファイル名を設定
		getTime = setTime.toFormat("YYYYMMDD_HH24MISS")			// 処理実行時の日時取得
		// viewportWidth = 1200

		// // urlの最後の「/スラッシュ」以降の文字列をファイル名末尾に付与する
		// if(urlLastElement) saveFileNameEnd = getUrlLastElement(arrUrls[0])
		// saveFileName = getTime + '_' + i + saveFileNameEnd + extension

		page.setViewport({width: viewportWidth, height: viewportHeight})




		// フォームのクリア
		page.clear = async (selector)=>{
			let elem = await page.$(selector)
			await elem.click()
			await elem.focus()
			await elem.click({clickCount: 3})
			await elem.press('Backspace')
		};




		// ※※※最終目的処理
		// -------------------- start（処理開始）
		await page.goto(arrUrls[0]);
		await page.waitForNavigation({waitUntil: 'networkidle2', timeout: 1000})
				.catch(e => console.log('timeout exceed. proceed to next operation'))

		for(j=0; j<arrKeywords.length; j++){

			// 保存ファイル名
			const exportFileName = arrUrls[1]

			// 対象の検索フォーム情報
			const targetFormName = arrUrls[2]

			// 検索結果後のリスト最初の要素のセレクタ指定	https://qiita.com/go_sagawa/items/85f97deab7ccfdce53ea
			const itemSelector = arrUrls[3]

			// 取得要素のタイプ
			const itemSelectorType = arrUrls[4]

			// フォームのクリア
			await page.clear(targetFormName)

			// 処理開始

			// キーワードを検索
			await page.waitFor(targetFormName)															// テキストボックスの表示を待つ
			await page.focus(targetFormName)															// テキストボックスへフォーカス
			await page.type(targetFormName, arrKeywords[j], { delay: 100 })	// コマンドラインからの第一引数をテキストボックスに入力
			await page.keyboard.press('Enter')																	// Enterキーを押す
			await page.waitFor(5000)

			// 要素を取得
			// href									… aタグのhref
			// textContent					… テキスト
			// innerHTML						… html
			let data = ''
			switch(itemSelectorType) {
				// ◆ aタグのhref
				case 'href':
					data = await page.evaluate((selector) => {
						return document.querySelector(selector).href
					}, itemSelector)
					break;

				// ◆ テキスト
				case 'textContent':
					data = await page.evaluate((selector) => {
						return document.querySelector(selector).textContent
					}, itemSelector)
					break;

				// ◆ html
				case 'innerHTML':
					data = await page.evaluate((selector) => {
						return document.querySelector(selector).innerHTML
					}, itemSelector)
					break;
			}

			// テキストファイル出力 - 追記
			appendFile(exportFileName, data + '\n')


			// const summary = await page.evaluate(() => {
			//   return document.querySelector('.search_result_table ul li a').href
			// })
			// console.log(summary)


			await page.waitFor(1000)

		}


		// await scrollToBottom(page, viewportHeight)
		// await page.screenshot({path: saveFileName, fullPage: true})
		// -------------------- end（処理終了）

		// console.log("save screenshot: " + saveFileName)
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

// ファイルの書き込み関数
function writeFile(path, data) {
	fs.writeFile(path, data, function (err) {
		if (err) {
				throw err;
		}
	});
}

// ファイルの追記関数
function appendFile(path, data) {
	fs.appendFile(path, data, function (err) {
		if (err) {
				throw err;
		}
	});
}



// xxxxx
function accessBasicAuthentication(page) {

}

// xxxxx
function accessGoogleLogin(page) {

}













