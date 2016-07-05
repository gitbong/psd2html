var config = {
	//最外层会被class名为'rootClass'的div包含
	rootClass: 'page0',
	//图片发布路径,最终会发布在'images/rootClass'下
	imgPath: 'images/',
	//css发布路径
	cssPath: 'css/',
	//css文件后罪名,如为.scss,不会被编译
	cssFileType: '.css',
	//发布设置,'*'会被实际数值替换,scale为数值的缩放值
	previewType: [
		{htmlFontSize: '100px', unit: '*rem', scale: 0.01},
		{htmlFontSize: '12px', unit: '*px', scale: 1}
	],
	//选择用哪个发布设置发布
	previewId: 0
};

var _fileURI, _doc, _rootTimeLine, _lib;
var _tpl = '';
var _styleCSS = '';
var _bgCSS = '';

function run() {
	config.imgPath += config.rootClass + '/';

	_doc = fl.getDocumentDOM();
	_rootTimeLine = _doc.getTimeline();
	_lib = _doc.library;
	_fileURI = _doc.pathURI.slice(0, _doc.pathURI.lastIndexOf("/") + 1);


	_tpl = _readTimeLine(_rootTimeLine, '.' + config.rootClass);

	exportHtml(_tpl);
	exportCSS(_styleCSS, 'style');
	exportCSS(_bgCSS, 'lib');
}

function _readTimeLine(timeline, classList) {
	if (timeline == null)return;

	var html = '';

	for (var j = timeline.layers.length - 1; j >= 0; j--) {
		var layer = timeline.layers[j];
		if (layer.layerType == 'normal') {
			for (var i in layer.frames[0].elements) {
				var ele = layer.frames[0].elements[i];
				// log(ele.elementType + '---' + ele.instanceType);
				switch (ele.elementType) {
					case 'instance':
					{
						switch (ele.instanceType) {
							case 'symbol':
								html += _createDIV(ele, classList);
								break;
							case 'bitmap':
								break;
						}
						break;
					}
					case 'text':
					{
						switch (ele.textType) {
							case 'input':
								break;
							default:
								html += _createTxt(ele, layer.name, classList);
								break;
						}
						break;
					}
				}
			}
		}
	}
	return html;
}

function _createDIV(e, classList) {
	var html = '';
	var nameObj = Name(e.libraryItem.timeline.name);
	var className = nameObj.name;

	var isBmp = divIsBmp(e);

	if (isBmp) {
		html += _createBmp(e, classList);
	} else {
		_styleCSS += classList + ' .' + className + _getStyleCSS(e, nameObj);
		html += '<div class="' + className + '">' + _readTimeLine(e.libraryItem.timeline, classList + " ." + className) + '</div>';
	}
	return html;
}
function _createBmp(e, classList) {
	// name:test.psd Asset/box-ctn/Assets/box
	var name = e.libraryItem.name;
	var arr = name.split('/');
	var nameObj = Name(arr[arr.length - 1]);
	var className = nameObj.name;
	_styleCSS += classList + ' .' + className + _getStyleCSS(e, nameObj);
	_bgCSS += classList + ' .' + className + '-img' + _getBgCSS(e);
	return '<div class="' + className + ' ' + (className + '-img') + '"></div>';
}
function _createTxt(e, cName, classList) {
	var txt = e.getTextString();
	var nameObj = Name(cName);
	var className = nameObj.name;
	_styleCSS += classList + ' .' + className + '{' + left(e, nameObj) + top(e, nameObj) + width(e.width) + height(e.height) + color(e.getTextAttr('fillColor')) + fontSize(e.getTextAttr('size') * e.scaleX) + textAlign(e.getTextAttr('alignment')) + '}';
	return '<div class="' + className + '">' + txt + '</div>';
}
function _getStyleCSS(e, nameObj) {
	var str = '{';
	str += left(e, nameObj) + top(e, nameObj) + width(e.width) + height(e.height);
	str += '}';
	return str;
}
function _getBgCSS(e) {
	var str = '{';
	str += background(e);
	str += '}';
	return str;
}

function left(e, nameObj) {
	var align = nameObj.align;
	var r;
	if (align.indexOf('L') != -1) {
		r = 'left:';
		if (nameObj.hasPercent) {
			r += e.x * 100 / _doc.width + '%';
		} else {
			r += val(e.x);
		}
	}
	if (align.indexOf('R') != -1) {
		r = 'right:';
		if (nameObj.hasPercent) {
			r += (_doc.width - e.x - e.width) * 100 / _doc.width + '%;';
		} else {
			r += val(_doc.width - e.x - e.width) + ';';
		}
	}
	return r + ';';
}
function top(e, nameObj) {
	var align = nameObj.align;
	var r;
	if (align.indexOf('T') != -1) {
		r = 'top:';
		if (nameObj.hasPercent) {
			r += e.y * 100 / _doc.height + '%';
		} else {
			r += val(e.y);
		}
	}
	if (align.indexOf('B') != -1) {
		r = 'bottom:';
		if (nameObj.hasPercent) {
			r += (_doc.height - e.y - e.height) * 100 / _doc.height + '%;';
		} else {
			r += val(_doc.height - e.y - e.height) + ';';
		}
	}
	return r + ';';
}
function width(v) {
	return 'width:' + val(v) + ';position:absolute;';
}
function height(v) {
	return 'height:' + val(v) + ';';
}
function background(e) {
	var asset = e.libraryItem.name.split('Asset/')[1];
	var str = '';

	var url = config.imgPath + Name(asset).file;

	str += 'background-image: url(../' + url + ');';
	str += 'background-repeat: no-repeat;';
	str += 'background-position: 0 0;';
	str += 'background-size:100% auto;';

	exportImg(e.libraryItem.timeline.layers[0].frames[0].elements[0].libraryItem, url);

	return str;
}
function color(v) {
	return 'color:' + v + ';';
}
function fontSize(v) {
	return 'font-size:' + val(v) + ';';
}
function textAlign(v) {
	return 'text-align:' + v + ';';
}
function val(v) {
	var nv = v * config.previewType[config.previewId].scale;
	return config.previewType[config.previewId].unit.split('*').join(nv);
}

function divIsBmp(e) {
	var is = false;
	if (e.libraryItem.timeline.layers.length == 1) {
		if (e.libraryItem.timeline.layers[0].frames[0].elements.length == 1) {
			if (e.libraryItem.timeline.layers[0].frames[0].elements[0].instanceType == 'bitmap') {
				is = true;
			}
		}
	}
	return is;
}

function Name(name) {
	var a0 = name.split('?');
	var a1 = a0.length == 1 ? [] : a0[1].toUpperCase().split('-');

	var obj = {
		name: a0[0],
		type: a1.indexOf('J') != -1 ? '.jpg' : '.png',
		commands: a1
	};

	var align = 'TL';
	for (var i in obj.commands) {
		switch (obj.commands[i]) {
			case 'TL':
			{
				align = 'TL';
				break;
			}
			case 'TR':
			{
				align = 'TR';
				break;
			}
			case 'BL':
			{
				align = 'BL';
				break;
			}
			case 'BR':
			{
				align = 'BR';
				break;
			}
		}
	}
	obj.align = align;
	obj.file = obj.name + obj.type;

	var hasPercent = false;
	if (obj.commands.indexOf('%') != -1)hasPercent = true;
	obj.hasPercent = hasPercent;

	return obj;
}

function exportHtml(html) {
	var _fileURL = _fileURI + 'temp.html';
	var _text = '<!DOCTYPE html><html style="font-size:' + config.previewType[config.previewId].htmlFontSize + '"><head lang="en"><meta charset="UTF-8"><title></title><style>body,div,ul,li,img,p,a,h1,h2,h3,input,span{margin:0px;padding:0px;border:0px;}html,body{position:relative;background:' + _doc.backgroundColor + ';width:' + _doc.width + 'px;height:' + _doc.height + 'px;}</style><link rel="stylesheet" href="css/lib.css"/><link rel="stylesheet" href="css/style.css"/></head><body class="' + config.rootClass + '">' + html + '</body></html>';
	FLfile.write(_fileURL, _text);
}

function exportImg(libItem, path) {
	FLfile.createFolder(_fileURI + config.imgPath);
	libItem.exportToFile(_fileURI + path, 100);
}

function exportCSS(css, name) {
	var _folderURI = _fileURI + config.cssPath;
	var _fileURL = _folderURI + name + config.cssFileType;
	FLfile.createFolder(_folderURI);
	FLfile.write(_fileURL, css);
}

function log(a) {
	var type = typeof(a);
	if (type == 'object') {
		for (var i in a) {
			fl.trace(i + ':' + a[i]);
		}
	} else {
		fl.trace(a);
	}
}

run();
