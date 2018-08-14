// ==UserScript==
// @name            百度|谷歌页面装修
// @description     1.繞過百度、搜狗、谷歌、好搜搜索結果中的自己的跳轉鏈接，直接訪問原始網頁-反正都能看懂 2.去除百度的多余广告 3.添加Favicon显示 4.页面CSS 5.添加计数 6.开关选择以上功能
// @icon            https://coding.net/u/zb227/p/zbImg/git/raw/master/img0/icon.jpg
// @author          Majesty
// @create          2018-08-14
// @run-at          document-start
// @version         0.0.1
// @connect         www.baidu.com
// @include         *://www.baidu.com/*
// @include         *://encrypted.google.*/search*
// @include         *://*.google*/search*
// @namespace       a-o@qq.com
// @supportURL      https://shang.qq.com/wpa/qunwpa?idkey=a2c2082506abd0b6f32816f05057ccec7febb02e228de769f527bd8c8eb82046
// @home-url        https://greasyfork.org/zh-TW/scripts/14178
// @home-url2       https://github.com/langren1353/GM_script
// @copyright       2017, AC
// @lastmodified    2018-08-11


// @resource        baiduTwoPageStyle     https://raw.githubusercontent.com/majesty17/my_static/master/baidu_2col.css
// @resource        googleTwoPageStyle    https://raw.githubusercontent.com/majesty17/my_static/master/google_2col.css

// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_setClipboard
// @grant           GM_xmlhttpRequest
// @grant           GM_getResourceText
// @grant           GM_registerMenuCommand
// ==/UserScript==


// 初次：还是采用了setInterval来处理，感觉这样的话速度应该比Dom快，也比MO适用，因为MO需要在最后才能调用，实用性还不如timer
// 之后：还是采用MO的方式来处理
(function () {
	var fatherName = new Array(
		"c-container", //baidu1
		"rc", //google
	);// Favicon放在xx位置

	var isFaviconEnable = true; // 是否开启favicon图标功能
	var defaultFaviconUrl = "https://ws1.sinaimg.cn/large/6a155794ly1foijtdzhxhj200w00wjr5.jpg";/*默认ico*/
	var valueLock = false; // 避免数据同时读取和写入时导致的死锁，然后致使页面死循环
	var onResizeLocked = false;
	var isGoogleImageUrl = false;



	var Stype_Normal; // 去重定向的选择
	var FaviconType; // favicon的选择-取得实际地址-得到host
	var CounterType; // Counter的选择
	var SiteTypeID; // 标记当前是哪个站点[百度=1;搜狗=2;3=好搜;谷歌=4;必应=5;知乎=6;百度学术=7;其他=8]
	var SiteType={
		BAIDU:1,
		GOOGLE:4,
	};

	var insertLocked = false;
	var oldCenter_colWidth = 0;
	if (location.host.indexOf("www.baidu.com") > -1) {
		SiteTypeID = SiteType.BAIDU;
		Stype_Normal = "h3.t>a, #results .c-container>.c-blocka"; //PC,mobile
		FaviconType = ".result-op, .c-showurl";
		CounterType = "#content_left>#double>div[srcid] *[class~=t],[class~=op_best_answer_question],#content_left>div[srcid] *[class~=t],[class~=op_best_answer_question]";
	} else if (location.host.indexOf("google") > -1) {
		SiteTypeID = SiteType.GOOGLE;
		// FaviconType = "._Rm";
		FaviconType = ".iUh30";
		CounterType = ".srg>div[class~=g] *[class~=r],._yE>div[class~=_kk]";
	}
	if(SiteTypeID == SiteType.GOOGLE && location.href.indexOf("tbm=isch") > 0){
		// 图片站
		isGoogleImageUrl = true;
	}
	try{
		if(SiteTypeID != SiteType.OTHERS){
			document.addEventListener('DOMNodeInserted', function (e) {
				if(e.target != null && e.target.className != null && e.target.className.indexOf("AC-") == 0){ return; } //屏蔽掉因为增加css导致的触发insert动作
				rapidDeal();
			}, false);
		}
	}catch (e){console.log(e);}

	FSBaidu(); // 添加设置项-单双列显示

	function AutoRefresh(){
		AC_addStyle("#content_right{display:none !important;}#content_right td>div:not([id]){display:none;}.result-op:not([id]){display:none!important;}#rhs{display:none;}", "RightRemove");


		AC_addStyle(
			".opr-recommends-merge-imgtext{display:none!important;}" + // 移除百度浏览器推广
			".res_top_banner{display:none!important;}"+ // 移除可能的百度HTTPS劫持显示问题
			".headBlock{display:none;}" // 移除百度的搜索结果顶部一条的建议文字
			, "AC-special-BAIDU"
		);
		AC_addStyle('#sp-ac-container{z-index:999999!important;text-align:left!important;background-color:white;}#sp-ac-container *{font-size:13px!important;color:black!important;float:none!important;}#sp-ac-main-head{position:relative!important;top:0!important;left:0!important;}#sp-ac-span-info{position:absolute!important;right:1px!important;top:0!important;font-size:10px!important;line-height:10px!important;background:none!important;font-style:italic!important;color:#5a5a5a!important;text-shadow:white 0px 1px 1px!important;}#sp-ac-container input{vertical-align:middle!important;display:inline-block!important;outline:none!important;height:auto !important;padding:0px !important;margin-bottom:0px !important;margin-top: 0px !important;}#sp-ac-container input[type="number"]{width:50px!important;text-align:left!important;}#sp-ac-container input[type="checkbox"]{border:1px solid #B4B4B4!important;padding:1px!important;margin:3px!important;width:13px!important;height:13px!important;background:none!important;cursor:pointer!important;visibility:visible !important;position:static !important;}#sp-ac-container input[type="button"]{border:1px solid #ccc!important;cursor:pointer!important;background:none!important;width:auto!important;height:auto!important;}#sp-ac-container li{list-style:none!important;margin:3px 0!important;border:none!important;float:none!important;}#sp-ac-container fieldset{border:2px groove #ccc!important;-moz-border-radius:3px!important;border-radius:3px!important;padding:4px 9px 6px 9px!important;margin:2px!important;display:block!important;width:auto!important;height:auto!important;}#sp-ac-container legend{line-height:20px !important;margin-bottom:0px !important;}#sp-ac-container fieldset>ul{padding:0!important;margin:0!important;}#sp-ac-container ul#sp-ac-a_useiframe-extend{padding-left:40px!important;}#sp-ac-rect{position:relative!important;top:0!important;left:0!important;float:right!important;height:10px!important;width:10px!important;padding:0!important;margin:0!important;-moz-border-radius:3px!important;border-radius:3px!important;border:1px solid white!important;-webkit-box-shadow:inset 0 5px 0 rgba(255,255,255,0.3),0 0 3px rgba(0,0,0,0.8)!important;-moz-box-shadow:inset 0 5px 0 rgba(255,255,255,0.3),0 0 3px rgba(0,0,0,0.8)!important;box-shadow:inset 0 5px 0 rgba(255,255,255,0.3),0 0 3px rgba(0,0,0,0.8)!important;opacity:0.8!important;}#sp-ac-dot,#sp-ac-cur-mode{position:absolute!important;z-index:9999!important;width:5px!important;height:5px!important;padding:0!important;-moz-border-radius:3px!important;border-radius:3px!important;border:1px solid white!important;opacity:1!important;-webkit-box-shadow:inset 0 -2px 1px rgba(0,0,0,0.3),inset 0 2px 1px rgba(255,255,255,0.3),0px 1px 2px rgba(0,0,0,0.9)!important;-moz-box-shadow:inset 0 -2px 1px rgba(0,0,0,0.3),inset 0 2px 1px rgba(255,255,255,0.3),0px 1px 2px rgba(0,0,0,0.9)!important;box-shadow:inset 0 -2px 1px rgba(0,0,0,0.3),inset 0 2px 1px rgba(255,255,255,0.3),0px 1px 2px rgba(0,0,0,0.9)!important;}#sp-ac-dot{right:-3px!important;top:-3px!important;}#sp-ac-cur-mode{left:-3px!important;top:-3px!important;width:6px!important;height:6px!important;}#sp-ac-content{padding:0!important;margin:5px 5px 0 0!important;-moz-border-radius:3px!important;border-radius:3px!important;border:1px solid #A0A0A0!important;-webkit-box-shadow:-2px 2px 5px rgba(0,0,0,0.3)!important;-moz-box-shadow:-2px 2px 5px rgba(0,0,0,0.3)!important;box-shadow:-2px 2px 5px rgba(0,0,0,0.3)!important;}#sp-ac-main{padding:5px!important;border:1px solid white!important;-moz-border-radius:3px!important;border-radius:3px!important;background-color:#F2F2F7!important;background:-moz-linear-gradient(top,#FCFCFC,#F2F2F7 100%)!important;background:-webkit-gradient(linear,0 0,0 100%,from(#FCFCFC),to(#F2F2F7))!important;}#sp-ac-foot{position:relative!important;left:0!important;right:0!important;min-height:20px!important;}#sp-ac-savebutton{position:absolute!important;top:0!important;right:2px!important;}#sp-ac-container .sp-ac-spanbutton{border:1px solid #ccc!important;-moz-border-radius:3px!important;border-radius:3px!important;padding:2px 3px!important;cursor:pointer!important;background-color:#F9F9F9!important;-webkit-box-shadow:inset 0 10px 5px white!important;-moz-box-shadow:inset 0 10px 5px white!important;box-shadow:inset 0 10px 5px white!important;}label[class="newFunc"]{color:blue !important;}', "ac-MENU");
	}
	AutoRefresh();

	function rapidDeal(){
		try{
			if (insertLocked == false && SiteTypeID != SiteType.OTHERS) {
				insertLocked = true;
				setTimeout(function () {
					insertLocked = false;
					ACHandle();
					AutoRefresh();
				}, 200);
			}
			removeAD_baidu_sogou();
			FSBaidu(); // 单独不需要定时器
		}catch (e){console.log(e);}
	}
	function ACHandle() {
        InsertSettingMenu();
		if(SiteTypeID == SiteType.OTHERS) return;
		if (true) { //必开重定向
			if(Stype_Normal != null && Stype_Normal != "") resetURLNormal(document.querySelectorAll(Stype_Normal)); // 百度搜狗去重定向-普通模式【注意不能为document.query..】
			if(SiteTypeID == SiteType.GOOGLE) removeOnMouseDownFunc(); // 移除onMouseDown事件，谷歌去重定向

			safeRemove(".res_top_banner"); // 移除百度可能显示的劫持
		}
		if (isFaviconEnable) {
			addFavicon(document.querySelectorAll(FaviconType)); // 添加Favicon显示
		}
		acSetCookie("ORIGIN", "", -1);

		FSBaidu();
		removeAD_baidu_sogou(); // 移除百度广告

	}
	function acSetCookie(cname, cvalue, exdays) {
		var d = new Date();
		d.setTime(d.getTime() + (exdays*24*60*60*1000));
		var expires = "expires="+d.toUTCString();
		document.cookie = cname + "=" + cvalue + "; " + expires+";domain=.www.baidu.com";
	}


	function removeOnMouseDownFunc() {
		try {
			var resultNodes = document.querySelectorAll(".g .rc .r a");
			for(var i=0; i < resultNodes.length; i++){
				var one = resultNodes[i];
				one.setAttribute("onmousedown", ""); // 谷歌去重定向干扰
				one.setAttribute("target", "_blank"); // 谷歌链接新标签打开
			}
		} catch (e) {
			console.log(e);
		}
	}

	function AC_addStyle(css, className, addToTarget, isReload){ // 添加CSS代码，不考虑文本载入时间，带有className
		var tout = setInterval(function(){
			/**
			 * addToTarget这里不要使用head标签,head标签的css会在html载入时加载，
			 * html加载后似乎不会再次加载，body会自动加载
			 * **/
			addToTarget = addToTarget || "body";
			isReload = isReload || false;
			if(document.querySelector(addToTarget) != null){
				clearInterval(tout);
				// 如果true 强行覆盖，不管有没有--先删除
				// 如果false，不覆盖，但是如果有的话，要退出，不存在则新增--无需删除
				if(isReload == true){
					safeRemove("."+className);
				}else if(isReload == false && document.querySelector("."+className) != null){
					// 节点存在 && 不准备覆盖
					return;
				}
				var cssNode = document.createElement("style");
				if(className != null) cssNode.className = className;
				cssNode.setAttribute("type", "text/css")
				cssNode.innerHTML = css;
				try{
					document.querySelector(addToTarget).appendChild(cssNode);
				}catch (e){console.log(e.message);}
			}
		}, 50);
	}

	function resetURLNormal(list) {
		for (var i = 0; i < list.length; i++) {
			// 此方法是异步，故在结束的时候使用i会出问题-严重!
			// 采用闭包的方法来进行数据的传递
			var curNode = list[i];
			var curhref = curNode.href;
			var trueUrlNoBaidu = "";
			try{
				var node = curNode.parentNode.parentNode;
				if(node.className.indexOf("result") >= 0){
					trueUrlNoBaidu = node.querySelector(FaviconType).innerHTML;
					trueUrlNoBaidu = replaceAll(trueUrlNoBaidu);
				}
			}catch (e){
			}

			if (list[i] != null && list[i].getAttribute("ac_redirectStatus") == null) {
				list[i].setAttribute("ac_redirectStatus", "0");
				if (curhref.indexOf("www.baidu.com/link") > -1 ||
					curhref.indexOf("m.baidu.com/from") > -1 ||
					curhref.indexOf("www.sogou.com/link") > -1 ||
					curhref.indexOf("so.com/link") > -1) {
					(function (c_curnode, c_curhref) {
						var url = c_curhref.replace(/^http:/, "https:");
						if(SiteTypeID == SiteType.BAIDU && url.indexOf("eqid") < 0){
							// 如果是百度，并且没有带有解析参数，那么手动带上
							url = url + "&wd=&eqid=";
						}
						var gmRequestNode = GM_xmlhttpRequest({
							url: url,
							headers: {"Accept": "*/*", "Referer":c_curhref.replace(/^http:/, "https:")},
							method: "GET",
							timeout: 5000,
							onreadystatechange: function (response) {
								// 由于是特殊返回-并且好搜-搜狗-百度都是这个格式，故提出
								DealRedirect(gmRequestNode, c_curhref, response.responseText, "URL='([^']+)'")
								// 这个是在上面无法处理的情况下，备用的 tm-finalurldhdg  tm-finalurlmfdh
								if(response.responseHeaders.indexOf("tm-finalurl") >= 0){
									var relURL = Reg_Get(response.responseHeaders, "tm-finalurl\\w+: ([^\\s]+)");
									if(relURL == null || relURL == "") return;
									DealRedirect(gmRequestNode, c_curhref, relURL);
								}
							}
						});
					})(curNode, curhref); //传递旧的网址过去，读作c_curhref
				}
			}
		}
	}
	function DealRedirect(request, curNodeHref, respText, RegText){
		if(respText == null || typeof(respText)=="undefined") return;
		var resultResponseUrl = "";
		if(RegText != null){
			resultResponseUrl = Reg_Get(respText, RegText);
		} else{
			resultResponseUrl = respText;
		}
		if(resultResponseUrl != null && resultResponseUrl != "" && resultResponseUrl.indexOf("www.baidu.com/link") < 0){
			try{
				if(SiteTypeID == SiteType.SOGOU) curNodeHref = curNodeHref.replace(/^https:\/\/www.sogou.com/, "");
				var changeNodeList = document.querySelectorAll("a[href*='"+curNodeHref+"']");
				for(var i=0; i < changeNodeList.length; i++){
					changeNodeList[i].setAttribute("ac_redirectStatus", "2");
					changeNodeList[i].setAttribute("href", resultResponseUrl);
				}
			}catch (e){}
			request.abort();
		}
	}
	function Reg_Get(HTML, reg) {
		var RegE = new RegExp(reg);
		try {
			return RegE.exec(HTML)[1];
		} catch (e) {
			return "";
		}
	}
	function removeAD_baidu_sogou() { // 移除百度自有广告
		if (SiteTypeID == SiteType.BAIDU) {
			// safeRemove(".c-container /deep/ .c-container");
			// 移除shadowDOM广告；搜索关键字：淘宝；然后点击搜索框，广告会多次重现shadowdom
			try{$('.c-container /deep/ .c-container').has('.f13>span:contains("广告")').remove();}catch (e) {}
			try{$('#content_right>div').has('a:contains("广告")').remove();}catch (e) {}
			try{$('#content_right>br').remove();}catch (e) {}
			// 移除标准广告
			try{$('#content_left>div').has('span:contains("广告")').remove();}catch (e) {}
		}
	}

    function getKeyword(){
        if(SiteTypeID == SiteType.BAIDU){
            var url=location.href;
            try{
                url=url.substring(url.search("wd="));
                url=url.substring(3,url.search('&'));
                return url;
            }catch(e){console.warning("get keyword error!");}
        }
        else{
            return "";
        }
    }


	function safeRemove(cssSelector){
		try {
			document.querySelector(cssSelector).remove();
		}catch (e){
		}
	}

	function replaceAll(sbefore) {
		var send;
		var result = sbefore.split('-');
		send = sbefore.replace(/(\/[^/]*|\s*)/, "").replace(/<[^>]*>/g, "").replace(/https?:\/\//g, "").replace(/<\/?strong>/g, "").replace(/<\/?b>/g, "").replace(/<?>?/g, "").replace(/( |\/).*/g, "");
		return send;
	}


    /* 页面上增加自定义按钮 */
    function InsertSettingMenu(){
		if (document.querySelector("#myuser") == null) {
			try{

                //var kw=document.getElementById('kw').value;
                var kw=getKeyword();
				var parent = document.querySelector("#u, #gbw>div>div");
				parent.style="width: auto;";
				var userAdiv = document.createElement("a");
				userAdiv.style = "text-decoration: none;";
				//userAdiv.innerHTML = "<span id='myuser' style='display: inline-block;'><span class='myuserconfig' style='display: inline-block;height: 18px;line-height: 1.5;background: #2866bd;color: #fff;font-weight: bold;text-align: center;padding: 6px;'>自定义</span><a >tes</a></span></span>";
                var inner="<a href='https://www.so.com/s?ie=utf-8&q="+kw+"' target='_blank'><img src='https://www.so.com/favicon.ico' height='20px'></img></a>";
                inner=inner+"<a href='https://www.sogou.com/web?query="+kw+"' target='_blank'><img src='https://www.sogou.com/favicon.ico'  height='20px'></img></a>";
                inner=inner+"<a href='https://www.google.com.hk/search?q="+kw+"' target='_blank'><img src='http://www.google.cn/favicon.ico'  height='20px'></img></a>";
                inner=inner+"<a href='https://cn.bing.com/search?q="+kw+"' target='_blank'><img src='https://cn.bing.com/favicon.ico'  height='20px'></img></a>";
                //inner=inner+"<img class='btn_tool_bing' onClick='alert(location.href);' src='https://cn.bing.com/favicon.ico' height='20px'></img>";
                userAdiv.innerHTML="<span id='myuser' style='display: inline-block;'>"+inner+"</span>"
				parent.insertBefore(userAdiv, parent.childNodes[0]);



			}catch (e){
                console.log("insert button error");
            }
		}
	}


	function addFavicon(citeList) {
		for (var index = 0; index < citeList.length; index++) {
			var url = replaceAll(citeList[index].innerHTML);
			//console.log(index+"."+url);
			if (null == citeList[index].getAttribute("ac_faviconStatus")) {
				if (url == "") {
					console.log("无效地址：" + citeList[index].innerHTML);
					citeList[index].setAttribute("ac_faviconStatus", "-1");
					continue;
				}
				var curNode = citeList[index];
				var faviconUrl = url;
				var II= 0;
				for (; II <= 5; II++) {
					curNode = curNode.parentNode;
					if (curNode != null && isInUrlList(curNode.className+"")) {
						break;
					}
				}
				//console.log(index+"."+faviconUrl+"--"+II);
				if (II <= 5) {
					var tmpHTML = curNode.innerHTML;
					var pos = tmpHTML.indexOf("fav-url")
						& tmpHTML.indexOf("favurl")
						& tmpHTML.indexOf("tit-ico")
						& tmpHTML.indexOf("img_fav rms_img")
						& tmpHTML.indexOf("c-tool-")
						& tmpHTML.indexOf("span class=\"c-icon c-icon-");
					//他自己已经做了favicon了
					if (pos > -1) {
						console.log("已有图片：" + faviconUrl);
						citeList[index].setAttribute("ac_faviconStatus", "-2");
						continue;
					}
					// 特殊处理BING
					if(SiteTypeID == SiteType.BING) curNode = curNode.querySelector("h2");
					//https://api.byi.pw/favicon/?url=???? 不稳定
					//http://"+faviconUrl+"/cdn.ico?defaulticon=http://soz.im/favicon.ico 不稳定
					//https://www.xtwind.com/api/index.php?url=???? 挂了。。。
					//https://statics.dnspod.cn/proxy_favicon/_/favicon?domain=sina.cn
					//www.google.com/s2/favicons?domain=764350177.lofter.com
					//如果地址不正确，那么丢弃
					var host = faviconUrl.replace(/[^.]+\.([^.]+)\.([^.]+)/, "$1.$2");
					if (curNode.querySelector(".faviconT") == null && host.length > 3) {
						var insNode = document.createElement("img");
						curNode = curNode.children[0]; //firstChild容易遇到text对象
						citeList[index].setAttribute("ac_faviconStatus", "1");
						curNode.insertBefore(insNode, curNode.firstChild);
						insNode.className = "faviconT";
						insNode.style = "position:relative;z-index:1;vertical-align:sub;height:16px;width:16px;margin-right:5px;margin-bottom: 2px;";
						insNode.src = "https://favicon.yandex.net/favicon/" + host;
						insNode.setAttribute("faviconID", "0");
						insNode.onload = function (eveNode) {
							if (eveNode.target.naturalWidth < 16) {
								eveNode.target.src = defaultFaviconUrl;
								eveNode.target.onload = null;
							}
						};
					}
				}
			}
		}
		function isInUrlList(url) {
			var leng = fatherName.length;
			for (var i = 0; i < leng; i++) {
				if (url.indexOf(fatherName[i]) >= 0) {
					return true;
				}
			}
			return false;
		}
	}

	function FSBaidu() { // thanks for code from 浮生@未歇 @page https://greasyfork.org/zh-TW/scripts/31642
		var keySite = "baidu";
		if(SiteTypeID == SiteType.GOOGLE) keySite = "google";
		var StyleManger = {
			importStyle: function (fileUrl, toClassName, addToTarget, isReload) {
				if(isReload == null) isReload = false;
				if(addToTarget == null) addToTarget = "body";
				if(isReload==false && document.querySelector("."+toClassName) != null){
					// 已经存在,并且不准备覆盖
					return;
				}
				if(document.querySelector("#content_left,.bkWMgd") == null) return;
				var ssNode = document.createElement("link");
				ssNode.rel = "stylesheet";
				ssNode.type = "text/css";
				ssNode.className = toClassName;
				ssNode.media = "screen";
				ssNode.href = fileUrl;
				try{document.querySelector(addToTarget).appendChild(ssNode);}catch (e){}
			},
			//加载普通样式
			loadCommonStyle: function () {
				AC_addStyle(GM_getResourceText(keySite+"CommonStyle"), "ACStyle-common", "#wrapper>#head, .jsrp");
				try{
					document.querySelector("#result_logo img").setAttribute("src", "https://ws1.sinaimg.cn/large/6a155794ly1fkx1uhxfz6j2039012wen.jpg");
				}catch (e){}
			},
			//加载自定义菜单样式
			loadMyMenuStyle: function () {
				AC_addStyle(GM_getResourceText(keySite+"MyMenuStyle"), "ACStyle-mymenu", "#wrapper>#head, .jsrp");
			},

			//加载双页样式
			loadTwoPageStyle: function () {
				AC_addStyle(GM_getResourceText(keySite+"TwoPageStyle"), "ACStyle-twopage", "#wrapper>#head, .jsrp");
			},
			loadExpandOneStyle:function () {
				AC_addStyle(
					"#content_left .result-op:hover,#content_left .result:hover{box-shadow:0 0 2px gray;background:rgba(230,230,230,0.1)!important;}" +
					"#content_left .result,#content_left .result-op{width:100%; min-width:670px;margin-bottom:14px!important;}" +
					".c-span18{width:78%!important;min-width:550px;}" +
					".c-span24{width: auto!important;}", "ACStyle-expand", "#wrapper>#head, .jsrp");
			}
		};
		var ControlManager = {
			twoPageDisplay: function () {
				// 定时查询
				try{
					setTimeout(function(){
						if(document.querySelector("#content_left>.c-container:nth-child(even),.srg>.g:nth-child(even)") != null){
							if (document.querySelector("#content_left>#double,.srg>#double") == null) {
								// 没有节点那么创建
								var div = document.createElement("div");
								div.id ="double";
								var parent = document.querySelector("#content_left,.srg");
								parent.insertBefore(div, parent.childNodes[0]);
								return;
							}
							if(document.querySelector("#content_left>.sp-separator, .med>.sp-separator") == null){
								// 不带翻页情况下
								var selector = document.querySelectorAll("#content_left>.c-container:not([acdb]),.srg>.g:not([acdb])");
								var DBP = document.querySelector("#double");
								for(var i = 1; selector && i < selector.length; i++){
									selector[i].setAttribute("acdb", 1);
									if(selector[i].offsetTop > DBP.offsetHeight) DBP.appendChild(selector[i]);
								}
							}else{
								// 带翻页情况下
								var parent = document.querySelector("#content_left>.sp-separator:not([isHandled]), .med>.sp-separator:not([isHandled])");
								var selector = document.querySelectorAll("#content_left>.sp-separator:not([isHandled])~.c-container:not([acdb]), .med>.sp-separator:not([isHandled])~#ires .g:not([acdb])");
								try{parent.setAttribute("isHandled", "1");}catch (e){}
								var DBR = document.querySelector("#double");
								for(var i = 1; i < selector.length; i++){
									selector[i].setAttribute("acdb", 1);
									if(selector[i].offsetTop > DBR.offsetTop + DBR.offsetHeight)
										DBR.appendChild(selector[i]);
								}
							}
						}
					}, 50);
				}catch (e){
					console.log(e);
				}
			},
			//居中显示 --- 必须是百度和谷歌的搜索结果页面，其他页面不能加载的--已经通过脚本include标签限制了一部分
			centerDisplay: function () {
				if(SiteTypeID != SiteType.BAIDU && SiteTypeID != SiteType.GOOGLE) return;
				// 如果是百度：非（包含搜索页面 || 包含left页面）
				if(SiteTypeID == SiteType.BAIDU && (location.href.indexOf(".com/s?") < 0 && document.querySelector("#content_left") ==null)) return;

				if(document.querySelector(".acCssLoadFlag") == null && valueLock == false){
					valueLock = true;
					StyleManger.loadMyMenuStyle();

                    this.twoPageDisplay();
                    StyleManger.loadTwoPageStyle();
                    StyleManger.loadCommonStyle();

					setTimeout(function() {
						valueLock = false;
					}, 30);
				}
			},
			init: function () {
				if(isGoogleImageUrl) return;
				this.centerDisplay();
			}
		};
		ControlManager.init();
		function mutationfunc() {
			ControlManager.init();
			try{window.onresize();}catch (e){}
			if(document.querySelector("#double") != null){
				setTimeout(function(){ // 动态设置底部推荐关键字的marginTop属性
					try{
						document.querySelector("#container #rs div").parentNode.style.marginTop = Math.max(document.querySelector("#double").offsetHeight, document.querySelector("#content_left").offsetHeight)-document.querySelector("#content_left").offsetHeight+"px";
					}catch (e){}
				}, 1200);
			}
		}

        try{
            window.onresize = function() {
                setTimeout(function () {
                    try {
                        var width = document.documentElement.clientWidth;

                        if(oldCenter_colWidth == width) return;
                        if(onResizeLocked == false && !isGoogleImageUrl){
                            onResizeLocked = true;
                            AC_addStyle("#rhscol{min-width:"+width+"px !important;}#center_col{width:"+width+"px !important;margin-left: unset !important;margin-right: unset !important;}#center_col>*{padding-left:8%;padding-right:8%;}", "AC-Style-bkWMgd", null, true);
                            setTimeout(function(){onResizeLocked = false; }, 20);
                        }
                        var BaiduMarLeft = width * 0.5 - 480;
                        var GoogleMmarLeft = width * 0.34 - 480;

                        oldCenter_colWidth = width;
                    } catch (e) {
                    }
                }, 50);
            }
            }catch (e) {
                // console.log(e);
            }

		mutationfunc();
	}
})();